// ci-watch.js - Watch CI progress in real-time
import { execSync, spawn } from "child_process";

export async function run(args) {
  const { runId, follow = true, modules } = args;

  console.error("[CI-WATCH] Starting CI watcher...");

  // Get the run ID if not provided
  let watchRunId = runId;
  if (!watchRunId) {
    try {
      // Get the most recent run
      const output = execSync(
        'gh run list --limit 1 --json databaseId --jq ".[0].databaseId"',
        {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      ).trim();

      if (!output) {
        return {
          status: "no-runs",
          message: "No CI runs found to watch",
        };
      }

      watchRunId = output;
    } catch (error) {
      return {
        status: "error",
        message: "Failed to find recent runs",
        error: error.message,
      };
    }
  }

  console.error(`[CI-WATCH] Watching run ID: ${watchRunId}`);

  // Get initial run status
  let runInfo;
  try {
    const output = execSync(
      `gh run view ${watchRunId} --json displayTitle,status,conclusion,workflowName,headBranch,jobs`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    runInfo = JSON.parse(output);
  } catch (error) {
    return {
      status: "error",
      message: `Failed to get run info for ${watchRunId}`,
      error: error.message,
    };
  }

  // If not following, just return current status
  if (!follow) {
    return formatRunStatus(runInfo, watchRunId);
  }

  // Watch the run progress
  console.error(
    "[CI-WATCH] Following run progress (press Ctrl+C to stop)...\n",
  );

  // Start watching with gh run watch
  return new Promise((resolve, reject) => {
    const watchProcess = spawn("gh", ["run", "watch", watchRunId], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let lastStatus = "";

    watchProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;

      // Parse status updates
      if (text.includes("✓") || text.includes("✗") || text.includes("•")) {
        process.stderr.write(text);
      }

      // Check for completion
      if (
        text.includes("completed") ||
        text.includes("failure") ||
        text.includes("success")
      ) {
        lastStatus = text;
      }
    });

    watchProcess.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    watchProcess.on("close", async (code) => {
      // Get final status
      try {
        const finalOutput = execSync(
          `gh run view ${watchRunId} --json displayTitle,status,conclusion,workflowName,headBranch,jobs`,
          {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          },
        );
        const finalInfo = JSON.parse(finalOutput);

        const result = formatRunStatus(finalInfo, watchRunId);

        // If it failed, offer to parse logs
        if (finalInfo.conclusion === "failure") {
          console.error(
            '\n[CI-WATCH] Run failed! Use "apex ci:parse" to analyze errors.',
          );
          result.nextSteps = ["ci:parse", "ci:fix", "ci:heal"];
        }

        resolve(result);
      } catch (error) {
        resolve({
          status: "completed",
          runId: watchRunId,
          message: "Watch completed",
          output: lastStatus,
        });
      }
    });

    watchProcess.on("error", (error) => {
      reject({
        status: "error",
        message: "Failed to watch run",
        error: error.message,
      });
    });

    // Handle Ctrl+C
    process.on("SIGINT", () => {
      watchProcess.kill();
      resolve({
        status: "interrupted",
        runId: watchRunId,
        message: "Watch interrupted by user",
      });
    });
  });
}

function formatRunStatus(runInfo, runId) {
  const jobs = runInfo.jobs || [];
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const failedJobs = jobs.filter((j) => j.conclusion === "failure");
  const runningJobs = jobs.filter((j) => j.status === "in_progress");

  const progress =
    jobs.length > 0
      ? Math.round((completedJobs.length / jobs.length) * 100)
      : 0;

  return {
    status: runInfo.status,
    conclusion: runInfo.conclusion,
    runId,
    title: runInfo.displayTitle,
    workflow: runInfo.workflowName,
    branch: runInfo.headBranch,
    progress: `${progress}%`,
    jobs: {
      total: jobs.length,
      completed: completedJobs.length,
      running: runningJobs.length,
      failed: failedJobs.length,
    },
    failedJobs: failedJobs.map((j) => ({
      name: j.name,
      conclusion: j.conclusion,
    })),
    message:
      runInfo.status === "completed"
        ? runInfo.conclusion === "success"
          ? "✅ Run succeeded!"
          : "❌ Run failed!"
        : `⏳ Run in progress (${progress}% complete)`,
  };
}
