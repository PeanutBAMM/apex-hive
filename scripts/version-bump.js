// version-bump.js - Bump version numbers in package.json and other files
import { promises as fs } from "fs";
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    type = "patch",
    preid,
    exact,
    commit = true,
    tag = true,
    push = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[VERSION-BUMP] Bumping version...");

  try {
    // Read current package.json
    const packagePath = "./package.json";
    const packageContent = await fs.readFile(packagePath, "utf8");
    const packageJson = JSON.parse(packageContent);
    const currentVersion = packageJson.version || "0.0.0";

    // Calculate new version
    let newVersion;
    if (exact) {
      // Use exact version provided
      newVersion = exact;
      if (!isValidVersion(newVersion)) {
        return {
          success: false,
          error: "Invalid version",
          message: `Version '${newVersion}' is not a valid semver`,
        };
      }
    } else {
      // Bump based on type
      newVersion = bumpVersion(currentVersion, type, preid);
    }

    if (newVersion === currentVersion) {
      return {
        success: true,
        data: {
          current: currentVersion,
          new: newVersion,
        },
        message: "Version unchanged",
      };
    }

    // Find all files to update
    const filesToUpdate = await findVersionFiles();

    // Update versions
    const updatedFiles = [];

    if (!dryRun) {
      for (const file of filesToUpdate) {
        const updated = await updateVersionInFile(
          file,
          currentVersion,
          newVersion,
        );
        if (updated) {
          updatedFiles.push(file);
        }
      }
    }

    // Git operations
    let commitHash = null;
    let tagCreated = false;
    let pushed = false;

    if (!dryRun && updatedFiles.length > 0) {
      // Commit changes
      if (commit) {
        try {
          execSync("git add -A", { stdio: "pipe" });
          execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
            stdio: "pipe",
          });

          const output = execSync("git rev-parse HEAD", { encoding: "utf8" });
          commitHash = output.trim().substring(0, 7);
        } catch (error) {
          console.error("[VERSION-BUMP] Failed to commit:", error.message);
        }
      }

      // Create tag
      if (tag && commitHash) {
        try {
          execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
            stdio: "pipe",
          });
          tagCreated = true;
        } catch (error) {
          console.error("[VERSION-BUMP] Failed to create tag:", error.message);
        }
      }

      // Push changes
      if (push && commitHash) {
        try {
          execSync("git push", { stdio: "pipe" });
          if (tagCreated) {
            execSync(`git push origin v${newVersion}`, { stdio: "pipe" });
          }
          pushed = true;
        } catch (error) {
          console.error("[VERSION-BUMP] Failed to push:", error.message);
        }
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        previous: currentVersion,
        current: newVersion,
        type,
        files: updatedFiles,
        commit: commitHash,
        tag: tagCreated ? `v${newVersion}` : null,
        pushed,
      },
      message: dryRun
        ? `Would bump version from ${currentVersion} to ${newVersion}`
        : `Bumped version from ${currentVersion} to ${newVersion}`,
    };
  } catch (error) {
    console.error("[VERSION-BUMP] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to bump version",
    };
  }
}

function isValidVersion(version) {
  return /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(version);
}

function bumpVersion(current, type, preid) {
  const parts = current.match(/^(\d+)\.(\d+)\.(\d+)(-(.+))?/);
  if (!parts) return current;

  let [, major, minor, patch, , prerelease] = parts;
  major = parseInt(major);
  minor = parseInt(minor);
  patch = parseInt(patch);

  switch (type) {
    case "major":
      major++;
      minor = 0;
      patch = 0;
      prerelease = "";
      break;

    case "minor":
      minor++;
      patch = 0;
      prerelease = "";
      break;

    case "patch":
      if (!prerelease) {
        patch++;
      }
      prerelease = "";
      break;

    case "premajor":
      major++;
      minor = 0;
      patch = 0;
      prerelease = `${preid || "beta"}.0`;
      break;

    case "preminor":
      minor++;
      patch = 0;
      prerelease = `${preid || "beta"}.0`;
      break;

    case "prepatch":
      patch++;
      prerelease = `${preid || "beta"}.0`;
      break;

    case "prerelease":
      if (prerelease) {
        // Increment prerelease version
        const preParts = prerelease.split(".");
        const lastPart = preParts[preParts.length - 1];
        const num = parseInt(lastPart);

        if (!isNaN(num)) {
          preParts[preParts.length - 1] = (num + 1).toString();
          prerelease = preParts.join(".");
        } else {
          prerelease = `${prerelease}.1`;
        }
      } else {
        prerelease = `${preid || "beta"}.0`;
      }
      break;

    default:
      return current;
  }

  return `${major}.${minor}.${patch}${prerelease ? "-" + prerelease : ""}`;
}

async function findVersionFiles() {
  const files = ["package.json"];

  // Check for other common version files
  const possibleFiles = [
    "package-lock.json",
    "manifest.json",
    "bower.json",
    "version.json",
    "version.txt",
    "VERSION",
    "pubspec.yaml",
    "Cargo.toml",
    "pyproject.toml",
    "setup.py",
  ];

  for (const file of possibleFiles) {
    try {
      await fs.access(file);
      files.push(file);
    } catch {
      // File doesn't exist
    }
  }

  return files;
}

async function updateVersionInFile(filepath, oldVersion, newVersion) {
  try {
    const content = await fs.readFile(filepath, "utf8");
    let updated = false;
    let newContent = content;

    if (filepath.endsWith(".json")) {
      // JSON files
      try {
        const json = JSON.parse(content);
        if (json.version === oldVersion) {
          json.version = newVersion;
          newContent = JSON.stringify(json, null, 2) + "\n";
          updated = true;
        }
      } catch {
        // Not valid JSON or no version field
      }
    } else if (filepath === "VERSION" || filepath === "version.txt") {
      // Simple version files
      if (content.trim() === oldVersion) {
        newContent = newVersion + "\n";
        updated = true;
      }
    } else {
      // Other files - use regex
      const versionRegex = new RegExp(
        `(version\\s*[:=]\\s*["']?)${oldVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(["']?)`,
        "gi",
      );

      if (versionRegex.test(content)) {
        newContent = content.replace(versionRegex, `$1${newVersion}$2`);
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(filepath, newContent);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
