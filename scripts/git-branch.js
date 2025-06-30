// git-branch.js - Manage git branches
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    create,
    delete: deleteBranch,
    rename,
    list = false,
    remote = false,
    merged = false,
    current = false,
    checkout = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[GIT-BRANCH] Managing git branches...");

  try {
    // List branches
    if (list || (!create && !deleteBranch && !rename)) {
      return listBranches({ remote, merged, current });
    }

    // Create new branch
    if (create) {
      return createBranch(create, { checkout, dryRun });
    }

    // Delete branch
    if (deleteBranch) {
      return deleteBranchAction(deleteBranch, { remote, dryRun });
    }

    // Rename branch
    if (rename) {
      return renameBranch(rename, { dryRun });
    }

    return {
      success: false,
      error: "No action specified",
      message: "Specify --create, --delete, --rename, or --list",
    };
  } catch (error) {
    console.error("[GIT-BRANCH] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to manage branches",
    };
  }
}

function listBranches(options) {
  try {
    const args = [];

    if (options.remote) {
      args.push("-r");
    } else if (options.all) {
      args.push("-a");
    }

    if (options.merged) {
      args.push("--merged");
    }

    const output = execSync(`git branch ${args.join(" ")}`, {
      encoding: "utf8",
    });
    const branches = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const current = line.startsWith("*");
        const name = line.replace(/^\*?\s+/, "").replace(/^remotes\//, "");
        return { name, current };
      });

    if (options.current) {
      const currentBranch = branches.find((b) => b.current);
      return {
        success: true,
        data: {
          current: currentBranch?.name || "HEAD detached",
        },
        message: currentBranch
          ? `On branch ${currentBranch.name}`
          : "Not on any branch",
      };
    }

    return {
      success: true,
      data: {
        branches,
        count: branches.length,
        current: branches.find((b) => b.current)?.name,
      },
      message: `Found ${branches.length} branches`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to list branches",
    };
  }
}

function createBranch(branchName, options) {
  try {
    // Check if branch already exists
    try {
      execSync(`git rev-parse --verify ${branchName}`, { stdio: "ignore" });
      return {
        success: false,
        error: "Branch exists",
        message: `Branch '${branchName}' already exists`,
      };
    } catch {
      // Branch doesn't exist, good to create
    }

    if (!options.dryRun) {
      // Create branch
      execSync(`git branch ${branchName}`, { stdio: "pipe" });

      // Checkout if requested
      if (options.checkout) {
        execSync(`git checkout ${branchName}`, { stdio: "pipe" });
      }
    }

    return {
      success: true,
      dryRun: options.dryRun,
      data: {
        branch: branchName,
        checkedOut: options.checkout,
      },
      message: options.dryRun
        ? `Would create branch '${branchName}'`
        : options.checkout
          ? `Created and switched to branch '${branchName}'`
          : `Created branch '${branchName}'`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to create branch '${branchName}'`,
    };
  }
}

function deleteBranchAction(branchName, options) {
  try {
    // Check if it's the current branch
    const current = execSync("git branch --show-current", {
      encoding: "utf8",
    }).trim();
    if (current === branchName) {
      return {
        success: false,
        error: "Cannot delete current branch",
        message: `Cannot delete branch '${branchName}' while on it`,
        hint: "Switch to another branch first",
      };
    }

    // Check if branch has unmerged changes
    let force = false;
    try {
      execSync(`git branch --merged | grep -w ${branchName}`, {
        stdio: "ignore",
      });
    } catch {
      // Branch not fully merged
      force = true;
    }

    if (!options.dryRun) {
      if (options.remote) {
        // Delete remote branch
        const [remote, branch] = branchName.includes("/")
          ? branchName.split("/", 2)
          : ["origin", branchName];

        execSync(`git push ${remote} --delete ${branch}`, { stdio: "pipe" });
      } else {
        // Delete local branch
        const flag = force ? "-D" : "-d";
        execSync(`git branch ${flag} ${branchName}`, { stdio: "pipe" });
      }
    }

    return {
      success: true,
      dryRun: options.dryRun,
      data: {
        branch: branchName,
        remote: options.remote,
        forced: force,
      },
      message: options.dryRun
        ? `Would delete branch '${branchName}'`
        : `Deleted branch '${branchName}'${force ? " (was not fully merged)" : ""}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to delete branch '${branchName}'`,
    };
  }
}

function renameBranch(newName, options) {
  try {
    // Get current branch
    const current = execSync("git branch --show-current", {
      encoding: "utf8",
    }).trim();

    if (!current) {
      return {
        success: false,
        error: "Not on a branch",
        message: "Cannot rename - not currently on a branch",
      };
    }

    // Check if new name already exists
    try {
      execSync(`git rev-parse --verify ${newName}`, { stdio: "ignore" });
      return {
        success: false,
        error: "Branch exists",
        message: `Branch '${newName}' already exists`,
      };
    } catch {
      // New name doesn't exist, good
    }

    if (!options.dryRun) {
      execSync(`git branch -m ${newName}`, { stdio: "pipe" });
    }

    return {
      success: true,
      dryRun: options.dryRun,
      data: {
        oldName: current,
        newName,
      },
      message: options.dryRun
        ? `Would rename branch '${current}' to '${newName}'`
        : `Renamed branch '${current}' to '${newName}'`,
      hint: "Remember to update the upstream branch if pushing to remote",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to rename branch",
    };
  }
}
