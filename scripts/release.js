// release.js - Orchestrate full release workflow
import { execSync } from "child_process";
import { promises as fs } from "fs";

export async function run(args = {}) {
  const {
    type = "patch",
    preid,
    exact,
    skipTests = false,
    skipBuild = false,
    skipTag = false,
    skipChangelog = false,
    skipDeploy = false,
    confirm = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[RELEASE] Starting release workflow...");

  try {
    const steps = [];

    // Step 1: Pre-release checks
    console.error("[RELEASE] Running pre-release checks...");
    const checks = await runPreReleaseChecks({ skipTests });

    if (!checks.passed) {
      return {
        success: false,
        error: "Pre-release checks failed",
        data: { checks },
        message: `Release blocked: ${checks.failures.join(", ")}`,
      };
    }

    steps.push({
      step: "pre-checks",
      status: "passed",
      details: checks,
    });

    // Step 2: Version bump
    console.error("[RELEASE] Bumping version...");
    let newVersion = null;

    if (!dryRun) {
      const versionResult =
        (await modules["version:bump"]?.run({
          type,
          preid,
          exact,
          commit: false,
          tag: false,
          dryRun,
        })) || (await runVersionBump({ type, preid, exact }));

      if (!versionResult.success) {
        return {
          success: false,
          error: "Version bump failed",
          data: { steps },
          message: "Failed to bump version",
        };
      }

      newVersion = versionResult.data.current;
      steps.push({
        step: "version-bump",
        status: "completed",
        details: versionResult.data,
      });
    }

    // Step 3: Build
    if (!skipBuild) {
      console.error("[RELEASE] Building project...");
      const buildResult = await runBuild();

      if (!buildResult.success) {
        // Rollback version
        if (newVersion) await rollbackVersion();

        return {
          success: false,
          error: "Build failed",
          data: { steps },
          message: "Failed to build project",
        };
      }

      steps.push({
        step: "build",
        status: "completed",
        details: buildResult,
      });
    }

    // Step 4: Generate changelog
    if (!skipChangelog && !dryRun) {
      console.error("[RELEASE] Generating changelog...");
      const changelogResult =
        (await modules["changelog:generate"]?.run({
          unreleased: false,
          dryRun,
        })) || (await runChangelogGenerate());

      steps.push({
        step: "changelog",
        status: changelogResult.success ? "completed" : "warning",
        details: changelogResult.data,
      });
    }

    // Step 5: Commit and tag
    if (!skipTag && !dryRun) {
      console.error("[RELEASE] Creating release commit and tag...");

      try {
        // Commit all changes
        execSync("git add -A", { stdio: "pipe" });
        execSync(`git commit -m "chore: release v${newVersion}"`, {
          stdio: "pipe",
        });

        // Create tag
        execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
          stdio: "pipe",
        });

        steps.push({
          step: "git-tag",
          status: "completed",
          details: { version: newVersion, tag: `v${newVersion}` },
        });
      } catch (error) {
        console.error("[RELEASE] Git operations failed:", error.message);
        steps.push({
          step: "git-tag",
          status: "failed",
          error: error.message,
        });
      }
    }

    // Step 6: Deploy
    if (!skipDeploy && !dryRun) {
      const needsConfirm = !confirm && !dryRun;

      if (needsConfirm) {
        return {
          success: false,
          error: "Confirmation required",
          data: {
            version: newVersion,
            steps,
            next: "deploy",
          },
          message: "Release prepared. Run with --confirm to deploy.",
        };
      }

      console.error("[RELEASE] Deploying...");
      const deployResult =
        (await modules.deploy?.run({
          environment: "production",
          build: false,
          test: false,
          confirm: true,
          dryRun,
        })) || (await runDeploy());

      if (!deployResult.success) {
        return {
          success: false,
          error: "Deploy failed",
          data: { steps },
          message: "Release created but deployment failed",
        };
      }

      steps.push({
        step: "deploy",
        status: "completed",
        details: deployResult.data,
      });
    }

    // Step 7: Push to remote
    if (!dryRun && newVersion) {
      console.error("[RELEASE] Pushing to remote...");
      try {
        execSync("git push", { stdio: "pipe" });
        if (!skipTag) {
          execSync(`git push origin v${newVersion}`, { stdio: "pipe" });
        }

        steps.push({
          step: "push",
          status: "completed",
          details: { pushed: true, tag: `v${newVersion}` },
        });
      } catch (error) {
        console.error("[RELEASE] Push failed:", error.message);
        steps.push({
          step: "push",
          status: "warning",
          error: error.message,
        });
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        version: newVersion || "TBD",
        steps,
        deployed: !skipDeploy && !dryRun,
      },
      message: dryRun
        ? `Would release version (type: ${type})`
        : `Released v${newVersion} successfully`,
    };
  } catch (error) {
    console.error("[RELEASE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Release workflow failed",
    };
  }
}

async function runPreReleaseChecks(options) {
  const checks = {
    passed: true,
    failures: [],
    warnings: [],
  };

  // Check 1: Clean working directory
  try {
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    if (status.trim()) {
      checks.failures.push("Uncommitted changes");
      checks.passed = false;
    }
  } catch {
    checks.warnings.push("Could not check git status");
  }

  // Check 2: On main/master branch
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

  // Check 3: Tests pass
  if (!options.skipTests) {
    try {
      execSync("npm test", { stdio: "ignore" });
    } catch {
      checks.failures.push("Tests failed");
      checks.passed = false;
    }
  }

  // Check 4: No console.log statements
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

  // Check 5: Up to date with remote
  try {
    execSync("git fetch", { stdio: "ignore" });
    const behind = execSync("git rev-list HEAD..@{u} --count", {
      encoding: "utf8",
    }).trim();
    if (parseInt(behind) > 0) {
      checks.failures.push(`Branch is ${behind} commits behind remote`);
      checks.passed = false;
    }
  } catch {
    checks.warnings.push("Could not check remote status");
  }

  return checks;
}

async function runVersionBump(options) {
  try {
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    const currentVersion = pkg.version;

    // Simple version bump logic
    const parts = currentVersion.split(".");
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const patch = parseInt(parts[2]);

    let newVersion;
    switch (options.type) {
      case "major":
        newVersion = `${major + 1}.0.0`;
        break;
      case "minor":
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case "patch":
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }

    if (options.exact) {
      newVersion = options.exact;
    }

    pkg.version = newVersion;
    await fs.writeFile("package.json", JSON.stringify(pkg, null, 2) + "\n");

    return {
      success: true,
      data: {
        previous: currentVersion,
        current: newVersion,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function rollbackVersion() {
  try {
    execSync("git checkout -- package.json", { stdio: "pipe" });
  } catch {
    // Ignore errors
  }
}

async function runBuild() {
  try {
    execSync("npm run build", { stdio: "pipe" });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function runChangelogGenerate() {
  try {
    execSync("npm run changelog:generate", { stdio: "pipe" });
    return {
      success: true,
      data: { generated: true },
    };
  } catch {
    return {
      success: false,
      data: { generated: false },
    };
  }
}

async function runDeploy() {
  try {
    execSync("npm run deploy", { stdio: "pipe" });
    return {
      success: true,
      data: { deployed: true },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
