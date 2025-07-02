// git-commit.js - Create a git commit with smart message generation
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    message,
    type = "auto",
    scope,
    breaking = false,
    amend = false,
    noVerify = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[GIT-COMMIT] Creating git commit...");

  try {
    // Check git status
    const status = execSync("git status --porcelain", { encoding: "utf8" });

    if (!status.trim() && !amend) {
      return {
        success: false,
        error: "No changes to commit",
        message: "Working directory is clean",
      };
    }

    // Stage all changes if not already staged
    if ((!amend && status.includes("??")) || status.includes(" M ")) {
      if (!dryRun) {
        execSync("git add -A", { stdio: "pipe" });
      }
    }

    // Generate or format commit message
    let commitMessage = message;

    if (!commitMessage && !amend) {
      // Auto-generate message based on changes
      commitMessage = await generateCommitMessage(
        status,
        type,
        scope,
        breaking,
      );
    } else if (commitMessage && type !== "auto") {
      // Format as conventional commit
      commitMessage = formatConventionalCommit(
        type,
        scope,
        commitMessage,
        breaking,
      );
    }

    if (!commitMessage && !amend) {
      return {
        success: false,
        error: "No commit message",
        message: "Could not generate commit message",
      };
    }

    // Build commit command
    const commitArgs = [];

    if (amend) {
      commitArgs.push("--amend");
      if (!message) {
        commitArgs.push("--no-edit");
      }
    }

    if (noVerify) {
      commitArgs.push("--no-verify");
    }

    if (commitMessage) {
      commitArgs.push("-m", commitMessage);
    }

    // Execute commit
    if (!dryRun) {
      try {
        const output = execSync(`git commit ${commitArgs.join(" ")}`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });

        // Extract commit hash
        const hashMatch = output.match(/\[[\w\s-]+\s+([a-f0-9]+)\]/);
        const commitHash = hashMatch ? hashMatch[1] : "unknown";

        return {
          success: true,
          data: {
            hash: commitHash,
            message: commitMessage,
            amend,
            files: status.trim().split("\n").length,
          },
          message: amend
            ? "Commit amended successfully"
            : `Created commit ${commitHash}`,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "Commit failed",
        };
      }
    } else {
      return {
        success: true,
        dryRun: true,
        data: {
          wouldCommit: commitMessage,
          files: status.trim().split("\n").length,
          amend,
        },
        message: "Would create commit with message: " + commitMessage,
      };
    }
  } catch (error) {
    console.error("[GIT-COMMIT] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to create commit",
    };
  }
}

async function generateCommitMessage(status, type, scope, breaking) {
  const changes = parseGitStatus(status);

  // Determine commit type if auto
  let commitType = type;
  if (type === "auto") {
    if (
      changes.deleted.length >
      changes.added.length + changes.modified.length
    ) {
      commitType = "chore";
    } else if (changes.added.some((f) => f.includes("test"))) {
      commitType = "test";
    } else if (
      changes.modified.some((f) => f.includes("README") || f.includes(".md"))
    ) {
      commitType = "docs";
    } else if (changes.added.length > 0 && changes.modified.length === 0) {
      commitType = "feat";
    } else if (
      changes.modified.some((f) => f.includes("fix") || f.includes("bug"))
    ) {
      commitType = "fix";
    } else {
      commitType = "chore";
    }
  }

  // Generate description
  let description = "";

  if (changes.added.length === 1) {
    description = `add ${path.basename(changes.added[0])}`;
  } else if (changes.added.length > 1) {
    description = `add ${changes.added.length} new files`;
  } else if (changes.modified.length === 1) {
    description = `update ${path.basename(changes.modified[0])}`;
  } else if (changes.modified.length > 1) {
    const commonDir = findCommonDirectory(changes.modified);
    description = commonDir
      ? `update ${commonDir}`
      : `update ${changes.modified.length} files`;
  } else if (changes.deleted.length > 0) {
    description = `remove ${changes.deleted.length} files`;
  }

  // Add scope if determined
  if (!scope && changes.all.length > 0) {
    const commonScope = determineScope(changes.all);
    if (commonScope) {
      scope = commonScope;
    }
  }

  return formatConventionalCommit(commitType, scope, description, breaking);
}

function parseGitStatus(status) {
  const lines = status
    .trim()
    .split("\n")
    .filter((line) => line);
  const changes = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
    all: [],
  };

  for (const line of lines) {
    const [flags, ...pathParts] = line.trim().split(/\s+/);
    const filepath = pathParts.join(" ");

    if (flags.includes("A") || flags === "??") {
      changes.added.push(filepath);
    } else if (flags.includes("M")) {
      changes.modified.push(filepath);
    } else if (flags.includes("D")) {
      changes.deleted.push(filepath);
    } else if (flags.includes("R")) {
      changes.renamed.push(filepath);
    }

    changes.all.push(filepath);
  }

  return changes;
}

function formatConventionalCommit(type, scope, description, breaking) {
  let message = type;

  if (scope) {
    message += `(${scope})`;
  }

  if (breaking) {
    message += "!";
  }

  message += `: ${description}`;

  return message;
}

function findCommonDirectory(files) {
  if (files.length === 0) return null;
  if (files.length === 1) return path.dirname(files[0]);

  const dirs = files.map((f) => path.dirname(f).split("/"));
  const commonParts = [];

  for (let i = 0; i < dirs[0].length; i++) {
    const part = dirs[0][i];
    if (dirs.every((d) => d[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  return commonParts.length > 0 ? commonParts.join("/") : null;
}

function determineScope(files) {
  // Common scopes based on file paths
  const scopePatterns = [
    { pattern: /scripts?\//, scope: "scripts" },
    { pattern: /tests?\//, scope: "test" },
    { pattern: /docs?\//, scope: "docs" },
    { pattern: /configs?\//, scope: "config" },
    { pattern: /modules?\//, scope: "core" },
    { pattern: /packages?\//, scope: "packages" },
    { pattern: /\.github\//, scope: "ci" },
  ];

  for (const { pattern, scope } of scopePatterns) {
    if (files.some((f) => pattern.test(f))) {
      return scope;
    }
  }

  return null;
}
