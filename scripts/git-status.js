// git-status.js - Enhanced git status with detailed information
import { execSync } from "child_process";

export async function run(args) {
  const { modules, verbose = false, showIgnored = false } = args;

  console.error("[GIT-STATUS] Getting repository status...");

  try {
    // Get basic status information
    const status = await getGitStatus(verbose, showIgnored);

    // Get additional info if modules available
    if (modules?.gitOps) {
      const gitOpsStatus = await modules.gitOps.status();
      status.branch = gitOpsStatus.branch || status.branch;
      status.ahead = gitOpsStatus.ahead || status.ahead;
      status.behind = gitOpsStatus.behind || status.behind;
    }

    // Format the output
    const formatted = formatStatus(status, verbose);

    return {
      ...status,
      formatted,
      message: status.clean
        ? "Working tree clean"
        : `${status.totalChanges} changes`,
    };
  } catch (error) {
    console.error("[GIT-STATUS] Error:", error.message);
    return {
      status: "error",
      message: "Not a git repository or git not available",
      error: error.message,
    };
  }
}

async function getGitStatus(verbose, showIgnored) {
  const status = {
    branch: "unknown",
    ahead: 0,
    behind: 0,
    clean: true,
    staged: [],
    unstaged: [],
    untracked: [],
    ignored: [],
    conflicts: [],
    totalChanges: 0,
  };

  try {
    // Get current branch
    try {
      status.branch = execSync("git branch --show-current", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();

      if (!status.branch) {
        // Might be in detached HEAD
        status.branch =
          execSync("git rev-parse --short HEAD", {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          }).trim() + " (detached)";
      }
    } catch {
      status.branch = "unknown";
    }

    // Get ahead/behind info
    try {
      const upstream = execSync(
        "git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null",
        {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      ).trim();

      if (upstream) {
        const aheadBehind = execSync(
          `git rev-list --left-right --count ${upstream}...HEAD`,
          {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          },
        ).trim();

        const [behind, ahead] = aheadBehind.split("\t").map(Number);
        status.ahead = ahead || 0;
        status.behind = behind || 0;
      }
    } catch {
      // No upstream configured
    }

    // Get file status
    const statusFlags = showIgnored ? "--ignored" : "";
    const gitStatusOutput = execSync(`git status --porcelain ${statusFlags}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (gitStatusOutput.trim()) {
      status.clean = false;
      const lines = gitStatusOutput.split("\n").filter(Boolean);

      for (const line of lines) {
        const statusCode = line.substring(0, 2);
        const file = line.substring(3);

        // Parse status codes
        const indexStatus = statusCode[0];
        const workingStatus = statusCode[1];

        const fileInfo = {
          file,
          status: statusCode.trim(),
        };

        // Conflicts
        if (statusCode === "UU" || statusCode === "AA" || statusCode === "DD") {
          fileInfo.type = "conflict";
          status.conflicts.push(fileInfo);
        }
        // Staged changes
        else if (indexStatus !== " " && indexStatus !== "?") {
          fileInfo.type = getChangeType(indexStatus);
          fileInfo.staged = true;
          status.staged.push(fileInfo);
        }
        // Unstaged changes
        if (workingStatus !== " " && workingStatus !== "?") {
          const unstagedInfo = { ...fileInfo };
          unstagedInfo.type = getChangeType(workingStatus);
          unstagedInfo.staged = false;
          status.unstaged.push(unstagedInfo);
        }
        // Untracked
        else if (statusCode === "??") {
          fileInfo.type = "untracked";
          status.untracked.push(fileInfo);
        }
        // Ignored
        else if (statusCode === "!!") {
          fileInfo.type = "ignored";
          status.ignored.push(fileInfo);
        }
      }
    }

    // Get stash count if verbose
    if (verbose) {
      try {
        const stashList = execSync("git stash list", {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        status.stashCount = stashList.split("\n").filter(Boolean).length;
      } catch {
        status.stashCount = 0;
      }

      // Get last commit info
      try {
        status.lastCommit = execSync("git log -1 --oneline", {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
      } catch {
        status.lastCommit = "No commits yet";
      }
    }

    // Calculate total changes
    status.totalChanges =
      status.staged.length +
      status.unstaged.length +
      status.untracked.length +
      status.conflicts.length;

    return status;
  } catch (error) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

function getChangeType(statusCode) {
  switch (statusCode) {
    case "M":
      return "modified";
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "U":
      return "updated";
    default:
      return "changed";
  }
}

function formatStatus(status, verbose) {
  const output = [];

  // Header
  output.push(`📍 Branch: ${status.branch}`);

  // Remote status
  if (status.ahead > 0 || status.behind > 0) {
    const remote = [];
    if (status.ahead > 0) remote.push(`↑${status.ahead}`);
    if (status.behind > 0) remote.push(`↓${status.behind}`);
    output.push(`📡 Remote: ${remote.join(" ")}`);
  }

  // Clean or changes
  if (status.clean) {
    output.push("\n✅ Working tree clean");
  } else {
    output.push(`\n📊 Changes: ${status.totalChanges} total`);

    // Conflicts first (most important)
    if (status.conflicts.length > 0) {
      output.push("\n❗ Conflicts:");
      status.conflicts.forEach((f) => {
        output.push(`   ${f.file}`);
      });
    }

    // Staged changes
    if (status.staged.length > 0) {
      output.push("\n✅ Staged:");
      status.staged.forEach((f) => {
        const icon = getStatusIcon(f.type);
        output.push(`   ${icon} ${f.file}`);
      });
    }

    // Unstaged changes
    if (status.unstaged.length > 0) {
      output.push("\n📝 Unstaged:");
      status.unstaged.forEach((f) => {
        const icon = getStatusIcon(f.type);
        output.push(`   ${icon} ${f.file}`);
      });
    }

    // Untracked files
    if (status.untracked.length > 0) {
      output.push("\n❓ Untracked:");
      if (status.untracked.length > 10 && !verbose) {
        output.push(
          `   ${status.untracked.length} files (use --verbose to see all)`,
        );
      } else {
        status.untracked.forEach((f) => {
          output.push(`   ${f.file}`);
        });
      }
    }
  }

  // Verbose info
  if (verbose) {
    if (status.stashCount > 0) {
      output.push(`\n📦 Stashes: ${status.stashCount}`);
    }

    if (status.lastCommit) {
      output.push(`\n🔖 Last commit: ${status.lastCommit}`);
    }

    if (status.ignored.length > 0) {
      output.push(`\n🚫 Ignored: ${status.ignored.length} files`);
    }
  }

  return output.join("\n");
}

function getStatusIcon(type) {
  switch (type) {
    case "modified":
      return "M";
    case "added":
      return "+";
    case "deleted":
      return "-";
    case "renamed":
      return "→";
    case "copied":
      return "©";
    default:
      return "•";
  }
}
