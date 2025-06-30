// ci-parse.js - Parse CI logs and extract error information
import { execSync } from "child_process";

export async function run(args) {
  const { runId, logs, modules } = args;

  console.error("[CI-PARSE] Parsing CI logs...");

  // If logs are provided directly, parse them
  if (logs) {
    return parseLogsContent(logs);
  }

  if (!runId) {
    // Try to get the latest failed run
    try {
      const output = execSync(
        'gh run list --limit 1 --json databaseId,conclusion --jq ".[0] | select(.conclusion==\"failure\") | .databaseId"',
        {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      ).trim();

      if (!output) {
        return {
          status: "no-failures",
          message: "No recent failed runs found",
          errors: [],
        };
      }

      args.runId = output;
    } catch (error) {
      return {
        status: "error",
        message: "Failed to find recent runs",
        error: error.message,
      };
    }
  }

  try {
    // Get run details
    let runDetails;
    try {
      const output = execSync(
        `gh run view ${args.runId} --json jobs,conclusion,displayTitle,workflowName`,
        {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      runDetails = JSON.parse(output);
    } catch (error) {
      return {
        status: "error",
        message: `Failed to get run details for ${args.runId}`,
        error: error.message,
      };
    }

    // Find failed jobs
    const failedJobs = runDetails.jobs.filter(
      (job) => job.conclusion === "failure",
    );

    if (failedJobs.length === 0) {
      return {
        status: "no-failures",
        runId: args.runId,
        title: runDetails.displayTitle,
        workflow: runDetails.workflowName,
        message: "No failed jobs in this run",
      };
    }

    // Parse errors from each failed job
    const errors = [];

    for (const job of failedJobs) {
      console.error(`[CI-PARSE] Analyzing job: ${job.name}`);

      // Get job logs
      let logs = "";
      try {
        logs = execSync(
          `gh run view ${args.runId} --log-failed --job ${job.databaseId}`,
          {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          },
        );
      } catch (error) {
        console.error(`[CI-PARSE] Failed to get logs for job ${job.name}`);
        continue;
      }

      // Parse common error patterns
      const errorPatterns = [
        // TypeScript errors
        {
          pattern: /error TS\d+: (.+)/g,
          type: "typescript",
          extract: (match) => ({
            message: match[1],
            code: match[0].match(/TS\d+/)[0],
          }),
        },
        // ESLint errors
        {
          pattern:
            /(\S+\.(?:js|ts|jsx|tsx))[\s\S]*?(\d+):(\d+)\s+error\s+(.+?)\s+(.+)/g,
          type: "eslint",
          extract: (match) => ({
            file: match[1],
            line: match[2],
            column: match[3],
            message: match[4],
            rule: match[5],
          }),
        },
        // Test failures
        {
          pattern: /FAIL\s+(.+\.test\.(?:js|ts))\s*\n\s*●(.+)/g,
          type: "test",
          extract: (match) => ({ file: match[1], test: match[2].trim() }),
        },
        // Module not found
        {
          pattern: /Cannot find module '(.+)'/g,
          type: "module",
          extract: (match) => ({ module: match[1] }),
        },
        // Generic errors
        {
          pattern: /Error: (.+)/g,
          type: "generic",
          extract: (match) => ({ message: match[1] }),
        },
        // npm/yarn errors
        {
          pattern: /npm ERR! (.+)/g,
          type: "npm",
          extract: (match) => ({ message: match[1] }),
        },
      ];

      // Extract errors
      for (const { pattern, type, extract } of errorPatterns) {
        let match;
        while ((match = pattern.exec(logs)) !== null) {
          errors.push({
            job: job.name,
            type,
            ...extract(match),
          });
        }
      }

      // Look for failed steps
      const failedSteps = job.steps.filter((s) => s.conclusion === "failure");
      for (const step of failedSteps) {
        if (!errors.some((e) => e.job === job.name && e.step === step.name)) {
          errors.push({
            job: job.name,
            step: step.name,
            type: "step-failure",
            message: `Step '${step.name}' failed`,
          });
        }
      }
    }

    // Group errors by type
    const errorsByType = errors.reduce((acc, error) => {
      if (!acc[error.type]) acc[error.type] = [];
      acc[error.type].push(error);
      return acc;
    }, {});

    return {
      status: "parsed",
      runId: args.runId,
      title: runDetails.displayTitle,
      workflow: runDetails.workflowName,
      failedJobs: failedJobs.map((j) => j.name),
      errorCount: errors.length,
      errorTypes: Object.keys(errorsByType),
      errors: errors.slice(0, 20), // Limit to first 20 errors
      errorsByType,
      message: `Found ${errors.length} errors in ${failedJobs.length} failed job(s)`,
    };
  } catch (error) {
    console.error("[CI-PARSE] Unexpected error:", error);
    return {
      status: "error",
      message: "Failed to parse CI logs",
      error: error.message,
    };
  }
}

// Helper function to parse logs content directly
function parseLogsContent(logsContent) {
  const errors = [];

  // Parse common error patterns
  const errorPatterns = [
    // TypeScript errors
    {
      pattern: /error TS\d+: (.+)/g,
      type: "typescript",
      extract: (match) => ({
        message: match[1],
        code: match[0].match(/TS\d+/)[0],
      }),
    },
    // ESLint errors
    {
      pattern:
        /(\S+\.(?:js|ts|jsx|tsx))[\s\S]*?(\d+):(\d+)\s+error\s+(.+?)\s+(.+)/g,
      type: "eslint",
      extract: (match) => ({
        file: match[1],
        line: match[2],
        column: match[3],
        message: match[4],
        rule: match[5],
      }),
    },
    // Test failures
    {
      pattern: /FAIL\s+(.+\.test\.(?:js|ts))\s*\n\s*●(.+)/g,
      type: "test",
      extract: (match) => ({ file: match[1], test: match[2].trim() }),
    },
    // Module not found
    {
      pattern: /Cannot find module '(.+)'/g,
      type: "module",
      extract: (match) => ({ module: match[1] }),
    },
    // Generic errors
    {
      pattern: /Error: (.+)/g,
      type: "generic",
      extract: (match) => ({ message: match[1] }),
    },
    // npm/yarn errors
    {
      pattern: /npm ERR! (.+)/g,
      type: "npm",
      extract: (match) => ({ message: match[1] }),
    },
    // Simple error detection for test
    {
      pattern: /TypeError: (.+)/g,
      type: "type-error",
      extract: (match) => ({ message: match[1] }),
    },
  ];

  // Extract errors
  for (const { pattern, type, extract } of errorPatterns) {
    let match;
    while ((match = pattern.exec(logsContent)) !== null) {
      errors.push({
        type,
        ...extract(match),
      });
    }
  }

  return {
    status: "parsed",
    errorCount: errors.length,
    errors: errors,
    message: `Found ${errors.length} errors in provided logs`,
  };
}
