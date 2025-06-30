// build.js - Build orchestration script
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    target = "production",
    clean = true,
    minify = true,
    sourcemaps = false,
    analyze = false,
    watch = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[BUILD] Starting build process...");

  try {
    const steps = [];
    const startTime = Date.now();

    // Step 1: Clean previous build
    if (clean) {
      console.error("[BUILD] Cleaning previous build...");
      const cleanResult = await cleanBuild();
      steps.push({
        step: "clean",
        status: cleanResult.success ? "completed" : "failed",
        duration: cleanResult.duration,
      });

      if (!cleanResult.success && !dryRun) {
        return {
          success: false,
          error: "Clean failed",
          data: { steps },
          message: "Failed to clean previous build",
        };
      }
    }

    // Step 2: Pre-build checks
    console.error("[BUILD] Running pre-build checks...");
    const checks = await runPreBuildChecks();

    if (!checks.passed) {
      return {
        success: false,
        error: "Pre-build checks failed",
        data: {
          steps,
          checks,
        },
        message: `Build blocked: ${checks.failures.join(", ")}`,
      };
    }

    steps.push({
      step: "pre-checks",
      status: "passed",
      checks: checks.passed,
    });

    // Step 3: Install dependencies if needed
    if (checks.needsInstall && !dryRun) {
      console.error("[BUILD] Installing dependencies...");
      const installResult = await installDependencies();
      steps.push({
        step: "install",
        status: installResult.success ? "completed" : "failed",
        duration: installResult.duration,
      });

      if (!installResult.success) {
        return {
          success: false,
          error: "Install failed",
          data: { steps },
          message: "Failed to install dependencies",
        };
      }
    }

    // Step 4: Build based on target
    if (!dryRun) {
      console.error(`[BUILD] Building for ${target}...`);
      const buildResult = await executeBuild({
        target,
        minify,
        sourcemaps,
        watch,
      });

      if (!buildResult.success) {
        return {
          success: false,
          error: "Build failed",
          data: { steps },
          message: `Failed to build for ${target}`,
        };
      }

      steps.push({
        step: "build",
        status: "completed",
        duration: buildResult.duration,
        output: buildResult.output,
      });

      // Step 5: Post-build tasks
      console.error("[BUILD] Running post-build tasks...");
      const postBuildResult = await runPostBuild({
        target,
        analyze,
        buildResult,
      });

      steps.push({
        step: "post-build",
        status: "completed",
        tasks: postBuildResult.tasks,
      });
    }

    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      dryRun,
      data: {
        target,
        steps,
        duration: totalDuration,
        output: dryRun ? null : await getBuildOutput(),
        stats: dryRun ? null : await getBuildStats(),
      },
      message: dryRun
        ? `Would build for ${target} with ${steps.length} steps`
        : `Build completed successfully in ${(totalDuration / 1000).toFixed(1)}s`,
    };
  } catch (error) {
    console.error("[BUILD] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Build process failed",
    };
  }
}

async function cleanBuild() {
  const start = Date.now();

  try {
    const buildDirs = ["dist", "build", ".next", "out", "coverage"];
    let cleaned = 0;

    for (const dir of buildDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        cleaned++;
      } catch {
        // Directory doesn't exist
      }
    }

    // Clean cache directories
    const cacheDirs = [".cache", ".parcel-cache", "node_modules/.cache"];
    for (const dir of cacheDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        cleaned++;
      } catch {
        // Directory doesn't exist
      }
    }

    return {
      success: true,
      cleaned,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - start,
    };
  }
}

async function runPreBuildChecks() {
  const checks = {
    passed: true,
    failures: [],
    warnings: [],
    needsInstall: false,
  };

  // Check 1: package.json exists
  try {
    await fs.access("package.json");
  } catch {
    checks.failures.push("No package.json found");
    checks.passed = false;
    return checks;
  }

  // Check 2: node_modules exists
  try {
    await fs.access("node_modules");
  } catch {
    checks.needsInstall = true;
  }

  // Check 3: Check for build script
  try {
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    if (!pkg.scripts?.build && !pkg.scripts?.["build:production"]) {
      checks.failures.push("No build script defined in package.json");
      checks.passed = false;
    }
  } catch {
    checks.failures.push("Invalid package.json");
    checks.passed = false;
  }

  // Check 4: TypeScript config if using TypeScript
  try {
    await fs.access("tsconfig.json");
    // Validate tsconfig
    try {
      const tsconfig = JSON.parse(await fs.readFile("tsconfig.json", "utf8"));
      if (!tsconfig.compilerOptions) {
        checks.warnings.push("tsconfig.json missing compilerOptions");
      }
    } catch {
      checks.warnings.push("Invalid tsconfig.json");
    }
  } catch {
    // Not using TypeScript
  }

  // Check 5: Lint errors
  try {
    execSync("npm run lint -- --quiet", { stdio: "ignore" });
  } catch {
    checks.warnings.push("Lint errors detected");
  }

  return checks;
}

async function installDependencies() {
  const start = Date.now();

  try {
    console.error("[BUILD] Running npm ci for faster install...");

    // Try npm ci first (faster for CI)
    try {
      execSync("npm ci", { stdio: "pipe" });
    } catch {
      // Fallback to npm install
      console.error("[BUILD] Falling back to npm install...");
      execSync("npm install", { stdio: "pipe" });
    }

    return {
      success: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - start,
    };
  }
}

async function executeBuild(options) {
  const start = Date.now();

  try {
    // Determine build command
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    let buildCommand = "npm run build";

    // Check for target-specific scripts
    if (
      options.target !== "production" &&
      pkg.scripts?.[`build:${options.target}`]
    ) {
      buildCommand = `npm run build:${options.target}`;
    } else if (pkg.scripts?.["build:production"]) {
      buildCommand = "npm run build:production";
    }

    // Add environment variables
    const env = {
      ...process.env,
      NODE_ENV: options.target,
      GENERATE_SOURCEMAP: options.sourcemaps ? "true" : "false",
    };

    if (options.minify === false) {
      env.DISABLE_MINIFY = "true";
    }

    // Execute build
    console.error(`[BUILD] Running: ${buildCommand}`);

    if (options.watch) {
      // For watch mode, spawn in background
      const { spawn } = await import("child_process");
      const buildProcess = spawn(buildCommand, {
        shell: true,
        env,
        stdio: "inherit",
      });

      // Give it a moment to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return {
        success: true,
        duration: Date.now() - start,
        output: "watch",
        process: buildProcess,
      };
    } else {
      // Normal build
      const output = execSync(buildCommand, {
        env,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Determine output directory
      const outputDir = await detectBuildOutput();

      return {
        success: true,
        duration: Date.now() - start,
        output: outputDir,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - start,
    };
  }
}

async function detectBuildOutput() {
  const possibleOutputs = ["dist", "build", ".next", "out", "public", "output"];

  for (const dir of possibleOutputs) {
    try {
      const stats = await fs.stat(dir);
      if (stats.isDirectory()) {
        // Check if it was recently modified (within last minute)
        const modified = Date.now() - stats.mtimeMs;
        if (modified < 60000) {
          return dir;
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return "dist"; // Default
}

async function runPostBuild(options) {
  const tasks = [];

  // Copy static assets
  try {
    await fs.access("public");
    if (options.buildResult.output && options.buildResult.output !== "public") {
      execSync(`cp -r public/* ${options.buildResult.output}/`, {
        stdio: "ignore",
      });
      tasks.push("copy-static-assets");
    }
  } catch {
    // No public directory
  }

  // Generate build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    target: options.target,
    duration: options.buildResult.duration,
    commit: await getGitCommit(),
  };

  if (options.buildResult.output) {
    await fs.writeFile(
      path.join(options.buildResult.output, "build-info.json"),
      JSON.stringify(buildInfo, null, 2),
    );
    tasks.push("build-info");
  }

  // Bundle analysis
  if (options.analyze) {
    try {
      console.error("[BUILD] Running bundle analyzer...");
      execSync("npm run analyze", { stdio: "inherit" });
      tasks.push("bundle-analysis");
    } catch {
      // Analyze not available
    }
  }

  // Validate output
  if (options.buildResult.output) {
    const validation = await validateBuildOutput(options.buildResult.output);
    if (validation.valid) {
      tasks.push("output-validation");
    }
  }

  return { tasks };
}

async function getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

async function validateBuildOutput(outputDir) {
  const validation = {
    valid: true,
    issues: [],
  };

  try {
    const stats = await fs.stat(outputDir);
    if (!stats.isDirectory()) {
      validation.valid = false;
      validation.issues.push("Output is not a directory");
      return validation;
    }

    // Check for index.html or main entry
    const entries = ["index.html", "index.js", "main.js", "app.js"];
    let hasEntry = false;

    for (const entry of entries) {
      try {
        await fs.access(path.join(outputDir, entry));
        hasEntry = true;
        break;
      } catch {
        // Entry doesn't exist
      }
    }

    if (!hasEntry) {
      validation.issues.push("No entry point found");
    }

    // Check directory size
    const size = await getDirectorySize(outputDir);
    if (size === 0) {
      validation.valid = false;
      validation.issues.push("Output directory is empty");
    }
  } catch (error) {
    validation.valid = false;
    validation.issues.push(error.message);
  }

  return validation;
}

async function getDirectorySize(dir) {
  try {
    const output = execSync(`du -sk ${dir} | cut -f1`, { encoding: "utf8" });
    return parseInt(output.trim());
  } catch {
    return 0;
  }
}

async function getBuildOutput() {
  const outputDirs = ["dist", "build", ".next", "out"];

  for (const dir of outputDirs) {
    try {
      await fs.access(dir);
      return dir;
    } catch {
      // Not this one
    }
  }

  return null;
}

async function getBuildStats() {
  const stats = {};

  const output = await getBuildOutput();
  if (!output) return stats;

  try {
    // Get size
    stats.sizeKB = await getDirectorySize(output);

    // Count files
    const fileCount = execSync(`find ${output} -type f | wc -l`, {
      encoding: "utf8",
    });
    stats.files = parseInt(fileCount.trim());

    // Get largest files
    try {
      const largestFiles = execSync(
        `find ${output} -type f -exec du -k {} + | sort -rn | head -5`,
        { encoding: "utf8" },
      );

      stats.largestFiles = largestFiles
        .trim()
        .split("\n")
        .map((line) => {
          const [size, file] = line.split("\t");
          return {
            file: file.replace(`${output}/`, ""),
            sizeKB: parseInt(size),
          };
        });
    } catch {
      // Ignore errors
    }
  } catch {
    // Ignore errors
  }

  return stats;
}
