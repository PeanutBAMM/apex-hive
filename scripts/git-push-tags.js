// git-push-tags.js - Push git tags to remote repository
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    tags = [],
    all = false,
    force = false,
    remote = "origin",
    delete: deleteTags = false,
    followTags = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[GIT-PUSH-TAGS] Pushing tags to remote...");

  try {
    // Check if we're in a git repository
    try {
      execSync("git rev-parse --git-dir", { stdio: "ignore" });
    } catch {
      return {
        success: false,
        error: "Not in a git repository",
        message: "Current directory is not a git repository",
      };
    }

    // Get all local tags if needed
    let tagsToProcess = tags;
    if (all && !deleteTags) {
      const allTags = execSync("git tag -l", { encoding: "utf8" })
        .trim()
        .split("\n")
        .filter((t) => t);
      tagsToProcess = allTags;
    }

    // Get remote info
    let remoteUrl = "";
    try {
      remoteUrl = execSync(`git remote get-url ${remote}`, {
        encoding: "utf8",
      }).trim();
    } catch {
      return {
        success: false,
        error: `Remote '${remote}' not found`,
        message: `No remote named '${remote}' configured`,
      };
    }

    const results = {
      pushed: [],
      deleted: [],
      failed: [],
      skipped: [],
    };

    if (deleteTags) {
      // Delete tags from remote
      for (const tag of tagsToProcess) {
        try {
          // Check if tag exists locally
          try {
            execSync(`git rev-parse refs/tags/${tag}`, { stdio: "ignore" });
          } catch {
            results.skipped.push({
              tag,
              reason: "Tag does not exist locally",
            });
            continue;
          }

          // Delete from remote
          const deleteCmd = `git push ${remote} :refs/tags/${tag}`;

          if (!dryRun) {
            execSync(deleteCmd, { stdio: "pipe" });
          }

          results.deleted.push(tag);
          console.error(`[GIT-PUSH-TAGS] Deleted tag: ${tag}`);
        } catch (error) {
          results.failed.push({
            tag,
            error: error.message,
          });
        }
      }
    } else if (all || followTags) {
      // Push all tags or follow tags
      let pushCmd = `git push ${remote}`;

      if (all) {
        pushCmd += " --tags";
      } else if (followTags) {
        pushCmd += " --follow-tags";
      }

      if (force) {
        pushCmd += " --force";
      }

      try {
        if (!dryRun) {
          const output = execSync(pushCmd, { encoding: "utf8", stdio: "pipe" });

          // Parse output to find pushed tags
          const pushedTags = output.match(/\[new tag\]\s+(\S+)/g) || [];
          pushedTags.forEach((match) => {
            const tag = match.replace(/\[new tag\]\s+/, "");
            results.pushed.push(tag);
          });

          // Also check for up-to-date tags
          const upToDateTags = output.match(/\[up to date\]\s+(\S+)/g) || [];
          upToDateTags.forEach((match) => {
            const tag = match.replace(/\[up to date\]\s+/, "");
            results.skipped.push({
              tag,
              reason: "Already up to date",
            });
          });
        } else {
          // In dry run, assume all tags would be pushed
          results.pushed = tagsToProcess;
        }

        console.error(`[GIT-PUSH-TAGS] Pushed ${all ? "all" : "follow"} tags`);
      } catch (error) {
        results.failed.push({
          tag: "all",
          error: error.message,
        });
      }
    } else {
      // Push specific tags
      for (const tag of tagsToProcess) {
        try {
          // Check if tag exists locally
          let tagInfo;
          try {
            tagInfo = execSync(`git show-ref --tags ${tag}`, {
              encoding: "utf8",
            }).trim();
          } catch {
            results.skipped.push({
              tag,
              reason: "Tag does not exist locally",
            });
            continue;
          }

          // Check if tag already exists on remote
          try {
            const remoteTag = execSync(
              `git ls-remote --tags ${remote} ${tag}`,
              { encoding: "utf8" },
            ).trim();
            if (remoteTag && !force) {
              results.skipped.push({
                tag,
                reason: "Already exists on remote (use --force to overwrite)",
              });
              continue;
            }
          } catch {
            // Tag doesn't exist on remote, proceed
          }

          // Push the tag
          let pushCmd = `git push ${remote} refs/tags/${tag}`;
          if (force) {
            pushCmd += " --force";
          }

          if (!dryRun) {
            execSync(pushCmd, { stdio: "pipe" });
          }

          results.pushed.push(tag);
          console.error(`[GIT-PUSH-TAGS] Pushed tag: ${tag}`);
        } catch (error) {
          results.failed.push({
            tag,
            error: error.message,
          });
        }
      }
    }

    // Get summary
    const totalProcessed =
      results.pushed.length +
      results.deleted.length +
      results.failed.length +
      results.skipped.length;

    return {
      success: results.failed.length === 0,
      dryRun,
      data: {
        remote,
        remoteUrl,
        pushed: results.pushed,
        deleted: results.deleted,
        failed: results.failed.length,
        skipped: results.skipped.length,
        total: totalProcessed,
      },
      message: dryRun
        ? `Would push ${results.pushed.length} tags to ${remote}`
        : `Pushed ${results.pushed.length} tags, deleted ${results.deleted.length}, ` +
          `failed ${results.failed.length}, skipped ${results.skipped.length}`,
    };
  } catch (error) {
    console.error("[GIT-PUSH-TAGS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to push tags",
    };
  }
}
