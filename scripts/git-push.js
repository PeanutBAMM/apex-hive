// git-push.js - Push commits to remote repository
import { readFile, writeFile, listFiles, pathExists } from "../modules/file-ops.js";
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    remote = "origin",
    branch,
    force = false,
    tags = false,
    setUpstream = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[GIT-PUSH] Pushing to remote repository...");

  try {
    // Get current branch if not specified
    let targetBranch = branch;
    if (!targetBranch) {
      try {
        targetBranch = execSync("git branch --show-current", {
          encoding: "utf8",
        }).trim();
      } catch {
        return {
          success: false,
          error: "Not on a branch",
          message: "Could not determine current branch",
        };
      }
    }

    // Check if there are commits to push
    try {
      const ahead = execSync(
        `git rev-list --count ${remote}/${targetBranch}..HEAD 2>/dev/null`,
        {
          encoding: "utf8",
        },
      ).trim();

      if (ahead === "0" && !tags && !force) {
        return {
          success: true,
          data: {
            branch: targetBranch,
            remote,
            ahead: 0,
          },
          message: "Already up to date",
        };
      }
    } catch {
      // Remote branch might not exist yet
      console.error("[GIT-PUSH] Remote branch may not exist yet");
    }

    // Build push command
    const pushArgs = [remote, targetBranch];

    if (force) {
      pushArgs.unshift("--force-with-lease");
    }

    if (setUpstream) {
      pushArgs.unshift("--set-upstream");
    }

    if (tags) {
      pushArgs.push("--tags");
    }

    // Dry run
    if (dryRun) {
      pushArgs.unshift("--dry-run");
    }

    // Execute push
    try {
      const output = execSync(`git push ${pushArgs.join(" ")} 2>&1`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Parse output for information
      const created = output.includes("* [new branch]");
      const forced = output.includes("(forced update)");
      const upToDate = output.includes("Everything up-to-date");

      // Count objects pushed
      const objectMatch = output.match(/(\d+) objects/);
      const objects = objectMatch ? parseInt(objectMatch[1]) : 0;

      return {
        success: true,
        dryRun,
        data: {
          branch: targetBranch,
          remote,
          created,
          forced,
          upToDate,
          objects,
        },
        message: dryRun
          ? `Would push ${targetBranch} to ${remote}`
          : created
            ? `Created new branch ${targetBranch} on ${remote}`
            : upToDate
              ? "Everything up-to-date"
              : `Pushed ${objects} objects to ${remote}/${targetBranch}`,
      };
    } catch (error) {
      // Check for specific errors
      if (error.message.includes("no upstream branch")) {
        return {
          success: false,
          error: "No upstream branch",
          message: `No upstream branch set. Use --set-upstream to set it.`,
          hint: `apex git:push --set-upstream`,
        };
      } else if (error.message.includes("rejected")) {
        return {
          success: false,
          error: "Push rejected",
          message: "Remote has changes that are not in local branch",
          hint: "Pull changes first or use --force (with caution)",
        };
      } else {
        return {
          success: false,
          error: error.message,
          message: "Push failed",
        };
      }
    }
  } catch (error) {
    console.error("[GIT-PUSH] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to push to remote",
    };
  }
}
