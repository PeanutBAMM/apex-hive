// git-pull.js - Pull changes from remote repository
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    remote = "origin",
    branch,
    rebase = false,
    autostash = true,
    all = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[GIT-PULL] Pulling from remote repository...");

  try {
    // Check for uncommitted changes
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    const hasChanges = status.trim().length > 0;

    if (hasChanges && !autostash && !dryRun) {
      return {
        success: false,
        error: "Uncommitted changes",
        message: "You have uncommitted changes. Commit or stash them first.",
        hint: "Use --autostash to automatically stash changes",
      };
    }

    // Get current branch if not specified
    let targetBranch = branch;
    if (!targetBranch && !all) {
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

    // Check remote status
    let behind = 0;
    try {
      // Fetch first to get latest remote info
      execSync(`git fetch ${remote} ${targetBranch || ""} --quiet`, {
        stdio: "pipe",
      });

      if (targetBranch) {
        behind =
          parseInt(
            execSync(
              `git rev-list --count HEAD..${remote}/${targetBranch} 2>/dev/null`,
              { encoding: "utf8" },
            ).trim(),
          ) || 0;

        if (behind === 0 && !all) {
          return {
            success: true,
            data: {
              branch: targetBranch,
              remote,
              behind: 0,
              updated: false,
            },
            message: "Already up to date",
          };
        }
      }
    } catch {
      console.error("[GIT-PULL] Could not check remote status");
    }

    // Build pull command
    const pullArgs = [];

    if (rebase) {
      pullArgs.push("--rebase");
    }

    if (autostash) {
      pullArgs.push("--autostash");
    }

    if (all) {
      pullArgs.push("--all");
    } else {
      pullArgs.push(remote);
      if (targetBranch) {
        pullArgs.push(targetBranch);
      }
    }

    // Execute pull
    if (!dryRun) {
      try {
        const output = execSync(`git pull ${pullArgs.join(" ")} 2>&1`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });

        // Parse output
        const updated = !output.includes("Already up to date");
        const conflicts = output.includes("CONFLICT");
        const merged = output.includes("Merge made");
        const rebased = output.includes("rewinding head");
        const fastForward = output.includes("Fast-forward");

        // Count changes
        const fileMatch = output.match(/(\d+) files? changed/);
        const filesChanged = fileMatch ? parseInt(fileMatch[1]) : 0;

        const insertMatch = output.match(/(\d+) insertions?\(\+\)/);
        const insertions = insertMatch ? parseInt(insertMatch[1]) : 0;

        const deleteMatch = output.match(/(\d+) deletions?\(-\)/);
        const deletions = deleteMatch ? parseInt(deleteMatch[1]) : 0;

        if (conflicts) {
          return {
            success: false,
            error: "Merge conflicts",
            data: {
              branch: targetBranch,
              remote,
              conflicts: true,
            },
            message: "Pull resulted in conflicts. Resolve them and commit.",
            hint: "Use git status to see conflicted files",
          };
        }

        return {
          success: true,
          data: {
            branch: targetBranch,
            remote,
            updated,
            merged,
            rebased,
            fastForward,
            filesChanged,
            insertions,
            deletions,
          },
          message: updated
            ? `Pulled ${filesChanged} file changes (+${insertions}/-${deletions})`
            : "Already up to date",
        };
      } catch (error) {
        if (error.message.includes("no tracking information")) {
          return {
            success: false,
            error: "No tracking branch",
            message: "No remote tracking branch configured",
            hint: `Set upstream with: git branch --set-upstream-to=${remote}/${targetBranch}`,
          };
        }
        throw error;
      }
    } else {
      return {
        success: true,
        dryRun: true,
        data: {
          wouldPull: `${remote}/${targetBranch || "current"}`,
          behind,
          hasChanges,
          autostash,
        },
        message: `Would pull ${behind} commits from ${remote}`,
      };
    }
  } catch (error) {
    console.error("[GIT-PULL] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to pull from remote",
    };
  }
}
