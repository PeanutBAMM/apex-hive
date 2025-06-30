// ci-monitor.js - Monitor GitHub Actions CI status
import { execSync } from "child_process";

export async function run(args) {
  const { modules } = args;
  const gitOps = modules?.gitOps;

  console.error("[CI-MONITOR] Checking GitHub Actions status...");

  try {
    // Check if we have gh CLI available
    try {
      execSync("which gh", { stdio: "ignore" });
    } catch {
      return {
        status: "unavailable",
        message: "GitHub CLI (gh) not installed",
        runs: [],
        failures: [],
      };
    }

    // Get recent workflow runs
    let runs = [];
    try {
      const output = execSync(
        "gh run list --limit 10 --json databaseId,displayTitle,conclusion,status,workflowName,headBranch,createdAt",
        {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      runs = JSON.parse(output);
    } catch (error) {
      console.error("[CI-MONITOR] Failed to fetch runs:", error.message);
      return {
        status: "error",
        message: "Failed to fetch workflow runs",
        error: error.message,
      };
    }

    // Analyze runs
    const failures = runs.filter((r) => r.conclusion === "failure");
    const inProgress = runs.filter((r) => r.status === "in_progress");
    const successful = runs.filter((r) => r.conclusion === "success");

    // Determine overall status
    let status = "passing";
    if (failures.length > 0) {
      status = "failing";
    } else if (inProgress.length > 0) {
      status = "running";
    }

    // Get current branch if gitOps available
    let currentBranch = "unknown";
    if (gitOps) {
      const branchInfo = await gitOps.status();
      currentBranch = branchInfo.branch || "unknown";
    }

    // Filter runs for current branch
    const branchRuns = runs.filter((r) => r.headBranch === currentBranch);
    const latestRun = branchRuns[0];

    return {
      status,
      branch: currentBranch,
      summary: {
        total: runs.length,
        failed: failures.length,
        running: inProgress.length,
        passed: successful.length,
      },
      latest: latestRun
        ? {
            id: latestRun.databaseId,
            title: latestRun.displayTitle,
            workflow: latestRun.workflowName,
            status: latestRun.status,
            conclusion: latestRun.conclusion,
            branch: latestRun.headBranch,
            createdAt: latestRun.createdAt,
          }
        : null,
      failures: failures.slice(0, 5).map((r) => ({
        id: r.databaseId,
        title: r.displayTitle,
        workflow: r.workflowName,
        branch: r.headBranch,
        createdAt: r.createdAt,
      })),
      message:
        status === "failing"
          ? `${failures.length} workflow(s) failing`
          : status === "running"
            ? `${inProgress.length} workflow(s) in progress`
            : "All workflows passing",
    };
  } catch (error) {
    console.error("[CI-MONITOR] Unexpected error:", error);
    return {
      status: "error",
      message: "Failed to check CI status",
      error: error.message,
    };
  }
}
