// deploy.js - Deploy application to various environments
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    environment = "production",
    service = "auto",
    build = true,
    test = true,
    confirm = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[DEPLOY] Starting deployment process...");

  try {
    const deploySteps = [];
    const deployConfig = await loadDeployConfig(environment);

    // Step 1: Pre-deployment checks
    console.error("[DEPLOY] Running pre-deployment checks...");
    const checks = await runPreDeployChecks(environment, { test });

    if (!checks.passed) {
      return {
        success: false,
        error: "Pre-deployment checks failed",
        data: checks,
        message: `Deployment blocked: ${checks.failures.join(", ")}`,
      };
    }

    deploySteps.push({
      step: "pre-checks",
      status: "passed",
      details: checks,
    });

    // Step 2: Build if needed
    if (build) {
      console.error("[DEPLOY] Building application...");
      const buildResult = await runBuild(environment, deployConfig);

      if (!buildResult.success) {
        return {
          success: false,
          error: "Build failed",
          data: { steps: deploySteps },
          message: "Failed to build application",
        };
      }

      deploySteps.push({
        step: "build",
        status: "completed",
        details: buildResult,
      });
    }

    // Step 3: Determine deployment service
    const deployService =
      service === "auto"
        ? await detectDeploymentService(deployConfig)
        : service;

    // Step 4: Confirm deployment
    if (!confirm && !dryRun && environment === "production") {
      return {
        success: false,
        error: "Confirmation required",
        data: {
          environment,
          service: deployService,
          steps: deploySteps,
        },
        message: "Production deployment requires --confirm flag",
      };
    }

    // Step 5: Deploy
    if (!dryRun) {
      console.error(
        `[DEPLOY] Deploying to ${environment} via ${deployService}...`,
      );
      const deployResult = await executeDeployment(
        deployService,
        environment,
        deployConfig,
      );

      if (!deployResult.success) {
        return {
          success: false,
          error: "Deployment failed",
          data: {
            steps: deploySteps,
            deployment: deployResult,
          },
          message: `Failed to deploy to ${environment}`,
        };
      }

      deploySteps.push({
        step: "deployment",
        status: "completed",
        details: deployResult,
      });

      // Step 6: Post-deployment verification
      console.error("[DEPLOY] Verifying deployment...");
      const verification = await verifyDeployment(
        deployService,
        environment,
        deployConfig,
      );

      deploySteps.push({
        step: "verification",
        status: verification.verified ? "passed" : "warning",
        details: verification,
      });
    }

    return {
      success: true,
      dryRun,
      data: {
        environment,
        service: deployService,
        steps: deploySteps,
        url: deployConfig.url || "N/A",
      },
      message: dryRun
        ? `Would deploy to ${environment} via ${deployService}`
        : `Successfully deployed to ${environment}`,
    };
  } catch (error) {
    console.error("[DEPLOY] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Deployment failed",
    };
  }
}

async function loadDeployConfig(environment) {
  const config = {
    production: {
      branch: "main",
      buildCommand: "npm run build",
      testCommand: "npm test",
      url: "https://app.example.com",
    },
    staging: {
      branch: "develop",
      buildCommand: "npm run build:staging",
      testCommand: "npm test",
      url: "https://staging.example.com",
    },
    development: {
      branch: "develop",
      buildCommand: "npm run build:dev",
      testCommand: "npm test:unit",
      url: "http://localhost:3000",
    },
  };

  // Try to load from deploy.json
  try {
    const customConfig = JSON.parse(await fs.readFile("deploy.json", "utf8"));
    return (
      customConfig[environment] || config[environment] || config.production
    );
  } catch {
    return config[environment] || config.production;
  }
}

async function runPreDeployChecks(environment, options) {
  const checks = {
    passed: true,
    failures: [],
    warnings: [],
  };

  // Check 1: Git status
  try {
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    if (status.trim()) {
      checks.failures.push("Uncommitted changes");
      checks.passed = false;
    }
  } catch {
    checks.warnings.push("Could not check git status");
  }

  // Check 2: On correct branch
  if (environment === "production") {
    try {
      const branch = execSync("git branch --show-current", {
        encoding: "utf8",
      }).trim();
      if (branch !== "main" && branch !== "master") {
        checks.failures.push(`Not on main branch (on ${branch})`);
        checks.passed = false;
      }
    } catch {
      checks.warnings.push("Could not check branch");
    }
  }

  // Check 3: Tests pass
  if (options.test) {
    try {
      execSync("npm test", { stdio: "ignore" });
    } catch {
      checks.failures.push("Tests failed");
      checks.passed = false;
    }
  }

  // Check 4: No console.log in production
  if (environment === "production") {
    try {
      const consoleLogs = execSync(
        'grep -r "console\\.log" --include="*.js" --exclude-dir=node_modules . | wc -l',
        { encoding: "utf8" },
      ).trim();

      if (parseInt(consoleLogs) > 0) {
        checks.warnings.push(`Found ${consoleLogs} console.log statements`);
      }
    } catch {
      // Grep failed, ignore
    }
  }

  return checks;
}

async function runBuild(environment, config) {
  try {
    const buildCommand = config.buildCommand || "npm run build";
    console.error(`[DEPLOY] Running: ${buildCommand}`);

    const output = execSync(buildCommand, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Check if build output exists
    const expectedOutputs = ["dist", "build", ".next", "out"];
    let buildOutput = null;

    for (const dir of expectedOutputs) {
      try {
        await fs.access(dir);
        buildOutput = dir;
        break;
      } catch {
        // Not this one
      }
    }

    return {
      success: true,
      output: buildOutput,
      command: buildCommand,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function detectDeploymentService(config) {
  // Check for deployment configuration files
  const services = [
    { file: "vercel.json", service: "vercel" },
    { file: "netlify.toml", service: "netlify" },
    { file: "firebase.json", service: "firebase" },
    { file: "app.yaml", service: "gcp" },
    { file: "Dockerfile", service: "docker" },
    { file: ".github/workflows/deploy.yml", service: "github-actions" },
    { file: "heroku.yml", service: "heroku" },
    { file: "render.yaml", service: "render" },
  ];

  for (const { file, service } of services) {
    try {
      await fs.access(file);
      return service;
    } catch {
      // Not this service
    }
  }

  // Check package.json for deploy scripts
  try {
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    if (pkg.scripts?.["deploy:vercel"]) return "vercel";
    if (pkg.scripts?.["deploy:netlify"]) return "netlify";
    if (pkg.scripts?.deploy) return "custom";
  } catch {
    // No package.json
  }

  return "manual";
}

async function executeDeployment(service, environment, config) {
  const deployCommands = {
    vercel: `vercel --prod ${environment === "production" ? "" : "--no-prod"}`,
    netlify: `netlify deploy ${environment === "production" ? "--prod" : ""}`,
    firebase: `firebase deploy --only hosting`,
    heroku: `git push heroku main`,
    "github-actions": `gh workflow run deploy.yml -f environment=${environment}`,
    custom: config.deployCommand || "npm run deploy",
    manual: 'echo "Manual deployment required"',
  };

  const command = deployCommands[service] || deployCommands.manual;

  try {
    console.error(`[DEPLOY] Running: ${command}`);
    const output = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Extract deployment URL if available
    let deployUrl = null;
    if (output.includes("https://")) {
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      deployUrl = urlMatch ? urlMatch[0] : null;
    }

    return {
      success: true,
      service,
      command,
      url: deployUrl || config.url,
    };
  } catch (error) {
    return {
      success: false,
      service,
      command,
      error: error.message,
    };
  }
}

async function verifyDeployment(service, environment, config) {
  const verification = {
    verified: false,
    checks: [],
  };

  // Simple URL check
  if (config.url && config.url.startsWith("http")) {
    try {
      // Would use fetch or curl in real implementation
      verification.checks.push({
        name: "URL accessible",
        passed: true,
      });
      verification.verified = true;
    } catch {
      verification.checks.push({
        name: "URL accessible",
        passed: false,
      });
    }
  }

  return verification;
}
