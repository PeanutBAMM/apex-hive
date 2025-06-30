// ci-smart-push.js - Smart git push with CI monitoring and auto-healing
import { execSync } from "child_process";

export async function run(args) {
  const { modules, branch, force = false } = args;

  console.error("[CI-SMART-PUSH] Starting smart push process...");

  try {
    // Step 1: Pre-push checks
    const preChecks = await runPrePushChecks(modules);
    if (!preChecks.passed) {
      return {
        status: "blocked",
        reason: preChecks.reason,
        checks: preChecks,
        message: "Pre-push checks failed. Fix issues before pushing.",
      };
    }

    // Step 2: Get current branch
    const currentBranch =
      branch ||
      execSync("git branch --show-current", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();

    if (!currentBranch) {
      return {
        status: "error",
        message: "Could not determine current branch",
      };
    }

    console.error(`[CI-SMART-PUSH] Pushing to branch: ${currentBranch}`);

    // Step 3: Push to remote
    let pushOutput;
    try {
      const pushCmd = force
        ? `git push --force-with-lease origin ${currentBranch}`
        : `git push origin ${currentBranch}`;
      pushOutput = execSync(pushCmd, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error) {
      if (error.message.includes("no upstream branch")) {
        // Set upstream and push
        console.error("[CI-SMART-PUSH] Setting upstream branch...");
        pushOutput = execSync(`git push -u origin ${currentBranch}`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
      } else {
        throw error;
      }
    }

    // Step 4: Wait for CI to start
    console.error("[CI-SMART-PUSH] Waiting for CI to start...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 5: Get the CI run ID
    let runId;
    try {
      const runs = execSync(
        "gh run list --limit 5 --json databaseId,headBranch,createdAt",
        {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      const runList = JSON.parse(runs);
      const branchRun = runList.find((r) => r.headBranch === currentBranch);

      if (branchRun) {
        runId = branchRun.databaseId;
      }
    } catch (error) {
      console.error("[CI-SMART-PUSH] Could not find CI run");
    }

    // Step 6: Monitor CI progress
    if (runId) {
      console.error(`[CI-SMART-PUSH] Monitoring CI run ${runId}...`);

      const watchModule = await import("./ci-watch.js");
      const watchResult = await watchModule.run({
        runId,
        follow: true,
        modules,
      });

      // Step 7: If CI fails, attempt auto-healing
      if (watchResult.conclusion === "failure") {
        console.error("[CI-SMART-PUSH] CI failed! Attempting auto-healing...");

        const healModule = await import("./ci-heal.js");
        const healResult = await healModule.run({ modules });

        if (healResult.healingActions.length > 0) {
          console.error(
            "[CI-SMART-PUSH] Applied healing actions, pushing fixes...",
          );

          // Push the fixes
          try {
            execSync(`git push origin ${currentBranch}`, {
              stdio: ["pipe", "pipe", "pipe"],
            });

            return {
              status: "pushed-with-healing",
              branch: currentBranch,
              runId,
              initialResult: watchResult,
              healing: healResult,
              message: "Push succeeded after auto-healing CI issues",
            };
          } catch (error) {
            console.error("[CI-SMART-PUSH] Failed to push healing fixes");
          }
        }

        return {
          status: "ci-failed",
          branch: currentBranch,
          runId,
          result: watchResult,
          healing: healResult,
          message:
            'Push succeeded but CI failed. Run "apex ci:parse" for details.',
        };
      }

      return {
        status: "success",
        branch: currentBranch,
        runId,
        result: watchResult,
        message: "✅ Push succeeded and CI passed!",
      };
    }

    // No CI run found, just report push success
    return {
      status: "pushed",
      branch: currentBranch,
      message: "Push succeeded. CI status unknown.",
    };
  } catch (error) {
    console.error("[CI-SMART-PUSH] Error:", error.message);
    return {
      status: "error",
      message: "Failed to push",
      error: error.message,
    };
  }
}

async function runPrePushChecks(modules) {
  const checks = {
    passed: true,
    reason: null,
    details: {},
  };

  // Check 1: Uncommitted changes
  try {
    const gitStatus = execSync("git status --porcelain", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (gitStatus.trim()) {
      checks.passed = false;
      checks.reason = "Uncommitted changes detected";
      checks.details.uncommitted = gitStatus.split("\n").filter(Boolean).length;
    }
  } catch (error) {
    console.error("[CI-SMART-PUSH] Failed to check git status");
  }

  // Check 2: Run tests if available
  try {
    console.error("[CI-SMART-PUSH] Running tests...");
    execSync("npm test -- --passWithNoTests", {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
    });
    checks.details.tests = "passed";
  } catch (error) {
    if (!error.message.includes("no test specified")) {
      checks.passed = false;
      checks.reason = "Tests failed";
      checks.details.tests = "failed";
    }
  }

  // Check 3: Lint check
  try {
    console.error("[CI-SMART-PUSH] Running lint check...");
    execSync("npm run lint --if-present", {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 20000,
    });
    checks.details.lint = "passed";
  } catch (error) {
    // Lint errors are warnings, not blockers
    checks.details.lint = "warning";
  }

  // Check 4: Branch protection
  try {
    const currentBranch = execSync("git branch --show-current", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (currentBranch === "main" || currentBranch === "master") {
      checks.details.branch = "protected-branch-warning";
      console.error("[CI-SMART-PUSH] Warning: Pushing to protected branch");
    }
  } catch (error) {
    // Ignore branch check errors
  }

  return checks;
}
