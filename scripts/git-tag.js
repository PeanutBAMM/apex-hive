// git-tag.js - Create and manage git tags
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    create,
    delete: deleteTag,
    list = false,
    message,
    annotated = true,
    force = false,
    push = false,
    pattern,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[GIT-TAG] Managing git tags...");

  try {
    // List tags
    if (list || (!create && !deleteTag)) {
      return listTags({ pattern });
    }

    // Create tag
    if (create) {
      return createTag(create, { message, annotated, force, push, dryRun });
    }

    // Delete tag
    if (deleteTag) {
      return deleteTagAction(deleteTag, { push, dryRun });
    }

    return {
      success: false,
      error: "No action specified",
      message: "Specify --create, --delete, or --list",
    };
  } catch (error) {
    console.error("[GIT-TAG] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to manage tags",
    };
  }
}

function listTags(options) {
  try {
    const args = ["--sort=-version:refname"];

    if (options.pattern) {
      args.push("-l", options.pattern);
    }

    const output = execSync(`git tag ${args.join(" ")}`, { encoding: "utf8" });
    const tags = output.split("\n").filter((line) => line.trim());

    // Get details for recent tags
    const tagDetails = [];
    for (const tag of tags.slice(0, 10)) {
      try {
        const details = execSync(
          `git show ${tag} --no-patch --format="%ai|%an|%s"`,
          {
            encoding: "utf8",
          },
        ).trim();

        const [date, author, subject] = details.split("|");
        tagDetails.push({
          name: tag,
          date: date.split(" ")[0],
          author,
          message: subject,
        });
      } catch {
        tagDetails.push({ name: tag });
      }
    }

    return {
      success: true,
      data: {
        tags: tagDetails,
        total: tags.length,
      },
      message: `Found ${tags.length} tags`,
    };
  } catch (error) {
    if (error.message.includes("No names found")) {
      return {
        success: true,
        data: { tags: [], total: 0 },
        message: "No tags found",
      };
    }
    throw error;
  }
}

function createTag(tagName, options) {
  try {
    // Validate tag name
    if (
      !tagName.match(/^v?\d+\.\d+\.\d+/) &&
      !tagName.match(/^[a-zA-Z0-9._-]+$/)
    ) {
      return {
        success: false,
        error: "Invalid tag name",
        message:
          "Tag name should follow semver (e.g., v1.0.0) or be alphanumeric",
      };
    }

    // Check if tag exists
    try {
      execSync(`git rev-parse ${tagName}`, { stdio: "ignore" });
      if (!options.force) {
        return {
          success: false,
          error: "Tag exists",
          message: `Tag '${tagName}' already exists. Use --force to overwrite.`,
        };
      }
    } catch {
      // Tag doesn't exist, good
    }

    if (!options.dryRun) {
      const args = [];

      if (options.annotated && options.message) {
        args.push("-a", tagName, "-m", options.message);
      } else if (options.annotated) {
        // Generate default message
        const defaultMessage = `Release ${tagName}`;
        args.push("-a", tagName, "-m", defaultMessage);
      } else {
        // Lightweight tag
        args.push(tagName);
      }

      if (options.force) {
        args.push("-f");
      }

      execSync(`git tag ${args.join(" ")}`, { stdio: "pipe" });

      // Push if requested
      if (options.push) {
        try {
          execSync(`git push origin ${tagName}`, { stdio: "pipe" });
        } catch (pushError) {
          console.error("[GIT-TAG] Failed to push tag:", pushError.message);
        }
      }
    }

    return {
      success: true,
      dryRun: options.dryRun,
      data: {
        tag: tagName,
        annotated: options.annotated,
        pushed: options.push && !options.dryRun,
      },
      message: options.dryRun
        ? `Would create tag '${tagName}'`
        : `Created tag '${tagName}'${options.push ? " and pushed to origin" : ""}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to create tag '${tagName}'`,
    };
  }
}

function deleteTagAction(tagName, options) {
  try {
    // Check if tag exists locally
    let existsLocally = true;
    try {
      execSync(`git rev-parse ${tagName}`, { stdio: "ignore" });
    } catch {
      existsLocally = false;
    }

    if (!existsLocally && !options.push) {
      return {
        success: false,
        error: "Tag not found",
        message: `Tag '${tagName}' does not exist locally`,
      };
    }

    if (!options.dryRun) {
      // Delete local tag
      if (existsLocally) {
        execSync(`git tag -d ${tagName}`, { stdio: "pipe" });
      }

      // Delete remote tag if requested
      if (options.push) {
        try {
          execSync(`git push origin :refs/tags/${tagName}`, { stdio: "pipe" });
        } catch (pushError) {
          if (!pushError.message.includes("remote ref does not exist")) {
            throw pushError;
          }
        }
      }
    }

    return {
      success: true,
      dryRun: options.dryRun,
      data: {
        tag: tagName,
        deletedLocal: existsLocally,
        deletedRemote: options.push,
      },
      message: options.dryRun
        ? `Would delete tag '${tagName}'`
        : `Deleted tag '${tagName}'${options.push ? " from local and remote" : " locally"}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Failed to delete tag '${tagName}'`,
    };
  }
}
