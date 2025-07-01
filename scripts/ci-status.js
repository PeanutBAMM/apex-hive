// ci-status.js - Check CI status across different platforms
import { execSync } from "child_process";
import { readFile, pathExists, listFiles } from "../modules/file-ops.js";
import { promises as fs } from "fs"; // Still need for readdir in some cases
import path from "path";

export async function run(args = {}) {
  const {
    platform = "auto",
    branch,
    commit,
    detailed = false,
    json = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[CI-STATUS] Checking CI status...");

  try {
    // Detect CI platform
    const detectedPlatform =
      platform === "auto" ? await detectCIPlatform() : platform;

    if (!detectedPlatform) {
      return {
        success: false,
        error: "No CI platform detected",
        message: "Could not detect CI platform. Specify with --platform",
      };
    }

    console.error(`[CI-STATUS] Using platform: ${detectedPlatform}`);

    // Get status based on platform
    let statusData;

    switch (detectedPlatform) {
      case "github":
        statusData = await getGitHubStatus({ branch, commit, detailed });
        break;

      case "gitlab":
        statusData = await getGitLabStatus({ branch, commit, detailed });
        break;

      case "jenkins":
        statusData = await getJenkinsStatus({ branch, commit, detailed });
        break;

      case "circleci":
        statusData = await getCircleCIStatus({ branch, commit, detailed });
        break;

      case "travis":
        statusData = await getTravisStatus({ branch, commit, detailed });
        break;

      case "local":
        statusData = await getLocalStatus({ detailed });
        break;

      default:
        return {
          success: false,
          error: "Unsupported platform",
          message: `Platform '${detectedPlatform}' is not supported`,
        };
    }

    // Format output
    const output = json
      ? JSON.stringify(statusData, null, 2)
      : formatStatusOutput(statusData, detectedPlatform);

    if (!json) {
      // console.log(output);
    }

    return {
      success: true,
      dryRun,
      data: statusData,
      message: `CI status: ${statusData.summary.status}`,
    };
  } catch (error) {
    console.error("[CI-STATUS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to check CI status",
    };
  }
}

async function detectCIPlatform() {
  // Check environment variables
  if (process.env.GITHUB_ACTIONS) return "github";
  if (process.env.GITLAB_CI) return "gitlab";
  if (process.env.JENKINS_URL) return "jenkins";
  if (process.env.CIRCLECI) return "circleci";
  if (process.env.TRAVIS) return "travis";

  // Check for config files
  const configChecks = [
    { file: ".github/workflows", platform: "github" },
    { file: ".gitlab-ci.yml", platform: "gitlab" },
    { file: "Jenkinsfile", platform: "jenkins" },
    { file: ".circleci/config.yml", platform: "circleci" },
    { file: ".travis.yml", platform: "travis" },
  ];

  for (const { file, platform } of configChecks) {
    try {
      const exists = await pathExists(file);
      if (!exists) throw new Error("File not found");
      return platform;
    } catch {
      // File doesn't exist
    }
  }

  // Default to local if no CI detected
  return "local";
}

async function getGitHubStatus(options) {
  const status = {
    platform: "github",
    runs: [],
    summary: {
      status: "unknown",
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
    },
  };

  try {
    // Get current branch and commit
    const currentBranch =
      options.branch ||
      execSync("git branch --show-current", { encoding: "utf8" }).trim();
    const currentCommit =
      options.commit ||
      execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();

    // Try using GitHub CLI if available
    try {
      execSync("gh --version", { stdio: "ignore" });

      // Get workflow runs
      const runsOutput = execSync(
        `gh run list --branch ${currentBranch} --limit 10 --json conclusion,status,name,headSha,createdAt,url`,
        { encoding: "utf8" },
      );

      const runs = JSON.parse(runsOutput);

      for (const run of runs) {
        const runData = {
          name: run.name,
          status: mapGitHubStatus(run.status, run.conclusion),
          commit: run.headSha.substring(0, 7),
          created: run.createdAt,
          url: run.url,
        };

        status.runs.push(runData);

        // Update summary
        status.summary.total++;
        if (runData.status === "success") status.summary.passed++;
        else if (runData.status === "failure") status.summary.failed++;
        else if (runData.status === "pending") status.summary.pending++;
      }

      // Get detailed info for latest run if requested
      if (options.detailed && runs.length > 0) {
        const latestRun = runs[0];
        try {
          const jobsOutput = execSync(
            `gh run view ${latestRun.url} --json jobs`,
            { encoding: "utf8" },
          );

          const jobsData = JSON.parse(jobsOutput);
          status.latestRun = {
            ...runData,
            jobs: jobsData.jobs.map((job) => ({
              name: job.name,
              status: mapGitHubStatus(job.status, job.conclusion),
              duration: job.completedAt
                ? Math.round(
                    (new Date(job.completedAt) - new Date(job.startedAt)) /
                      1000,
                  )
                : null,
            })),
          };
        } catch {
          // Couldn't get job details
        }
      }
    } catch {
      // GitHub CLI not available, try API
      console.error(
        "[CI-STATUS] GitHub CLI not available, limited functionality",
      );

      // Check for workflow files
      const workflowsDir = ".github/workflows";
      try {
        const workflowList = await listFiles(workflowsDir);
        const workflows = workflowList.map(f => f.name);
        status.workflows = workflows.filter(
          (f) => f.endsWith(".yml") || f.endsWith(".yaml"),
        );
        status.summary.status = "unknown";
        status.message = "Install GitHub CLI for full status";
      } catch {
        status.summary.status = "not-configured";
      }
    }

    // Determine overall status
    if (status.summary.failed > 0) {
      status.summary.status = "failure";
    } else if (status.summary.pending > 0) {
      status.summary.status = "pending";
    } else if (status.summary.passed > 0) {
      status.summary.status = "success";
    }
  } catch (error) {
    status.error = error.message;
  }

  return status;
}

async function getGitLabStatus(options) {
  const status = {
    platform: "gitlab",
    pipelines: [],
    summary: {
      status: "unknown",
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
    },
  };

  try {
    // Check if gitlab-ci.yml exists
    const gitlabExists = await pathExists(".gitlab-ci.yml");
    if (!gitlabExists) throw new Error("GitLab CI config not found");

    // Try using GitLab CLI if available
    try {
      execSync("glab --version", { stdio: "ignore" });

      const pipelinesOutput = execSync("glab pipeline list --per-page 10", {
        encoding: "utf8",
      });

      // Parse pipeline output
      const lines = pipelinesOutput.trim().split("\n").slice(1); // Skip header

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          const pipelineData = {
            id: parts[0],
            status: parts[1].toLowerCase(),
            branch: parts[2],
            commit: parts[3],
          };

          status.pipelines.push(pipelineData);
          status.summary.total++;

          if (pipelineData.status === "success") status.summary.passed++;
          else if (pipelineData.status === "failed") status.summary.failed++;
          else if (["pending", "running"].includes(pipelineData.status))
            status.summary.pending++;
        }
      }
    } catch {
      console.error("[CI-STATUS] GitLab CLI not available");
      status.message = "Install glab CLI for full status";
    }

    // Determine overall status
    if (status.summary.failed > 0) {
      status.summary.status = "failure";
    } else if (status.summary.pending > 0) {
      status.summary.status = "pending";
    } else if (status.summary.passed > 0) {
      status.summary.status = "success";
    } else {
      status.summary.status = "configured";
    }
  } catch {
    status.summary.status = "not-configured";
  }

  return status;
}

async function getJenkinsStatus(options) {
  const status = {
    platform: "jenkins",
    builds: [],
    summary: {
      status: "unknown",
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
    },
  };

  try {
    // Check for Jenkinsfile
    const jenkinsExists = await pathExists("Jenkinsfile");
    if (!jenkinsExists) throw new Error("Jenkinsfile not found");
    status.summary.status = "configured";
    status.message =
      "Jenkins configured, but status requires Jenkins API access";

    // If JENKINS_URL is set, we might be running in Jenkins
    if (process.env.JENKINS_URL && process.env.JOB_NAME) {
      status.currentBuild = {
        job: process.env.JOB_NAME,
        build: process.env.BUILD_NUMBER,
        url: process.env.BUILD_URL,
      };
    }
  } catch {
    status.summary.status = "not-configured";
  }

  return status;
}

async function getCircleCIStatus(options) {
  const status = {
    platform: "circleci",
    workflows: [],
    summary: {
      status: "unknown",
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
    },
  };

  try {
    // Check for config
    const circleExists = await pathExists(".circleci/config.yml");
    if (!circleExists) throw new Error("CircleCI config not found");
    status.summary.status = "configured";

    // Try using CircleCI CLI if available
    try {
      execSync("circleci --version", { stdio: "ignore" });

      // Validate config
      const validateOutput = execSync("circleci config validate", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (validateOutput.includes("Config file is valid")) {
        status.configValid = true;
      }

      status.message = "CircleCI configured and valid";
    } catch {
      status.message = "CircleCI configured, install CLI for validation";
    }
  } catch {
    status.summary.status = "not-configured";
  }

  return status;
}

async function getTravisStatus(options) {
  const status = {
    platform: "travis",
    builds: [],
    summary: {
      status: "unknown",
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
    },
  };

  try {
    // Check for .travis.yml
    const travisExists = await pathExists(".travis.yml");
    if (!travisExists) throw new Error("Travis config not found");
    status.summary.status = "configured";

    // Try using Travis CLI if available
    try {
      execSync("travis --version", { stdio: "ignore" });

      // Check if logged in
      try {
        execSync("travis whoami", { stdio: "ignore" });

        // Get recent builds
        const buildsOutput = execSync("travis history --limit 10", {
          encoding: "utf8",
        });

        // Parse builds output
        const lines = buildsOutput.trim().split("\n").slice(1); // Skip header

        for (const line of lines) {
          const match = line.match(/#(\d+)\s+(\w+):\s+(.+)/);
          if (match) {
            const buildData = {
              number: match[1],
              status: match[2].toLowerCase(),
              description: match[3],
            };

            status.builds.push(buildData);
            status.summary.total++;

            if (buildData.status === "passed") status.summary.passed++;
            else if (buildData.status === "failed") status.summary.failed++;
            else if (["started", "created"].includes(buildData.status))
              status.summary.pending++;
          }
        }
      } catch {
        status.message = "Travis CLI available but not logged in";
      }
    } catch {
      status.message = "Travis configured, install CLI for status";
    }
  } catch {
    status.summary.status = "not-configured";
  }

  return status;
}

async function getLocalStatus(options) {
  const status = {
    platform: "local",
    tests: {},
    scripts: {},
    summary: {
      status: "unknown",
      hasTests: false,
      testCommand: null,
    },
  };

  try {
    // Check package.json for test scripts
    const pkg = JSON.parse(await readFile("package.json"));

    if (pkg.scripts) {
      // Check for test script
      if (pkg.scripts.test && !pkg.scripts.test.includes("no test")) {
        status.summary.hasTests = true;
        status.summary.testCommand = pkg.scripts.test;

        // Check for other CI-related scripts
        const ciScripts = ["lint", "typecheck", "build", "test:ci"];
        for (const script of ciScripts) {
          if (pkg.scripts[script]) {
            status.scripts[script] = pkg.scripts[script];
          }
        }
      }
    }

    // Try to run tests if detailed
    if (options.detailed && status.summary.hasTests) {
      try {
        console.error("[CI-STATUS] Running tests...");
        const testOutput = execSync("npm test -- --passWithNoTests", {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });

        status.tests.passed = true;
        status.tests.output = testOutput.substring(0, 500); // First 500 chars
        status.summary.status = "success";
      } catch (error) {
        status.tests.passed = false;
        status.tests.error = error.message;
        status.summary.status = "failure";
      }
    } else if (status.summary.hasTests) {
      status.summary.status = "configured";
    } else {
      status.summary.status = "not-configured";
    }
  } catch {
    status.summary.status = "no-package-json";
  }

  return status;
}

function mapGitHubStatus(status, conclusion) {
  if (status === "completed") {
    switch (conclusion) {
      case "success":
        return "success";
      case "failure":
        return "failure";
      case "cancelled":
        return "cancelled";
      case "skipped":
        return "skipped";
      default:
        return "unknown";
    }
  } else if (status === "in_progress" || status === "queued") {
    return "pending";
  }
  return "unknown";
}

function formatStatusOutput(statusData, platform) {
  let output = `\n🚀 CI Status Report - ${platform.toUpperCase()}\n`;
  output += "═".repeat(50) + "\n\n";

  // Summary
  const statusEmoji = {
    success: "✅",
    failure: "❌",
    pending: "⏳",
    configured: "⚙️",
    "not-configured": "❓",
    unknown: "❓",
  };

  output += `Overall Status: ${statusEmoji[statusData.summary.status] || "❓"} ${statusData.summary.status.toUpperCase()}\n`;

  if (statusData.summary.total > 0) {
    output += `\nRecent Runs:\n`;
    output += `  • Total: ${statusData.summary.total}\n`;
    output += `  • Passed: ${statusData.summary.passed} ✅\n`;
    output += `  • Failed: ${statusData.summary.failed} ❌\n`;
    output += `  • Pending: ${statusData.summary.pending} ⏳\n`;
  }

  // Platform-specific details
  output += "\nDetails:\n";

  switch (platform) {
    case "github":
      if (statusData.runs && statusData.runs.length > 0) {
        output += "\nRecent Workflow Runs:\n";
        for (const run of statusData.runs.slice(0, 5)) {
          output += `  ${statusEmoji[run.status]} ${run.name} - ${run.commit} (${new Date(run.created).toLocaleDateString()})\n`;
        }
      }

      if (statusData.workflows) {
        output += `\nWorkflows: ${statusData.workflows.join(", ")}\n`;
      }
      break;

    case "gitlab":
      if (statusData.pipelines && statusData.pipelines.length > 0) {
        output += "\nRecent Pipelines:\n";
        for (const pipeline of statusData.pipelines.slice(0, 5)) {
          output += `  ${statusEmoji[pipeline.status] || "❓"} #${pipeline.id} - ${pipeline.branch} (${pipeline.commit})\n`;
        }
      }
      break;

    case "local":
      if (statusData.summary.hasTests) {
        output += `  Test Command: ${statusData.summary.testCommand}\n`;

        if (statusData.scripts && Object.keys(statusData.scripts).length > 0) {
          output += "\n  Available CI Scripts:\n";
          for (const [name, command] of Object.entries(statusData.scripts)) {
            output += `    • ${name}: ${command}\n`;
          }
        }

        if (statusData.tests.passed !== undefined) {
          output += `\n  Test Result: ${statusData.tests.passed ? "✅ PASSED" : "❌ FAILED"}\n`;
        }
      } else {
        output += "  No tests configured\n";
      }
      break;

    default:
      if (statusData.message) {
        output += `  ${statusData.message}\n`;
      }
  }

  // Additional messages
  if (statusData.message) {
    output += `\n💡 ${statusData.message}\n`;
  }

  if (statusData.error) {
    output += `\n⚠️  Error: ${statusData.error}\n`;
  }

  output += "\n" + "═".repeat(50) + "\n";

  return output;
}
