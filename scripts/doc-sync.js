// doc-sync.js - Sync documentation across repositories
import { readFile, writeFile, pathExists, listFiles, getFileStats } from "../modules/file-ops.js";
import { promises as fs } from "fs"; // Still need for mkdir
import path from "path";
import { execSync } from "child_process";

export async function run(args) {
  const {
    source = ".",
    targets = [],
    pattern = "**/*.md",
    dryRun = false,
    modules,
  } = args;

  console.error("[DOC-SYNC] Syncing documentation...");

  try {
    // Get target repositories from config if not specified
    let syncTargets = targets;
    if (syncTargets.length === 0) {
      syncTargets = await getSyncTargets();
    }

    if (syncTargets.length === 0) {
      return {
        status: "no-targets",
        message: "No sync targets configured",
        hint: "Add targets to .apex-hive/config.json or specify with --targets",
      };
    }

    // Find documentation files to sync
    const docsToSync = await findDocsToSync(source, pattern);

    if (docsToSync.length === 0) {
      return {
        status: "no-docs",
        message: "No documentation files found to sync",
        pattern,
      };
    }

    // Sync to each target
    const results = [];
    for (const target of syncTargets) {
      const result = await syncToTarget(
        docsToSync,
        source,
        target,
        dryRun,
        modules,
      );
      results.push(result);
    }

    // Summary
    const successful = results.filter((r) => r.status === "synced").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return {
      status: failed === 0 ? "synced" : "partial",
      source,
      targets: syncTargets,
      files: docsToSync.length,
      results,
      summary: {
        successful,
        failed,
        total: results.length,
      },
      message: dryRun
        ? `Would sync ${docsToSync.length} file(s) to ${syncTargets.length} target(s)`
        : `Synced ${docsToSync.length} file(s) to ${successful}/${syncTargets.length} target(s)`,
    };
  } catch (error) {
    console.error("[DOC-SYNC] Error:", error.message);
    return {
      status: "error",
      message: "Failed to sync documentation",
      error: error.message,
    };
  }
}

async function getSyncTargets() {
  try {
    const configPath = ".apex-hive/config.json";
    const config = JSON.parse(await readFile(configPath));
    return config.docSync?.targets || [];
  } catch {
    return [];
  }
}

async function findDocsToSync(source, pattern) {
  const docs = [];

  // Use git ls-files if in a git repo
  try {
    const gitFiles = execSync(`git ls-files "${pattern}"`, {
      cwd: source,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
      .trim()
      .split("\n")
      .filter(Boolean);

    for (const file of gitFiles) {
      if (file.endsWith(".md")) {
        docs.push(file);
      }
    }
  } catch {
    // Fallback to manual search
    docs.push(...(await findMarkdownFiles(source)));
  }

  // Filter out files that shouldn't be synced
  const excludePatterns = [
    /node_modules/,
    /\.git/,
    /CHANGELOG\.md$/,
    /CONTRIBUTING\.md$/,
    /CODE_OF_CONDUCT\.md$/,
  ];

  return docs.filter((doc) => {
    return !excludePatterns.some((pattern) => pattern.test(doc));
  });
}

async function syncToTarget(docs, source, target, dryRun, modules) {
  console.error(`[DOC-SYNC] Syncing to ${target}...`);

  try {
    // Check if target exists and is accessible
    const targetPath = path.resolve(target);
    try {
      const exists = await pathExists(targetPath);
      if (!exists) throw new Error("File not found");
    } catch {
      return {
        target,
        status: "failed",
        error: "Target directory not accessible",
      };
    }

    const synced = [];
    const failed = [];
    const skipped = [];

    for (const doc of docs) {
      const sourcePath = path.join(source, doc);
      const targetPath = path.join(target, doc);

      try {
        // Check if file needs syncing
        const needsSync = await shouldSync(sourcePath, targetPath);

        if (!needsSync) {
          skipped.push(doc);
          continue;
        }

        if (!dryRun) {
          // Ensure target directory exists
          await fs.mkdir(path.dirname(targetPath), { recursive: true });

          // Copy file
          await fs.copyFile(sourcePath, targetPath);

          // Update relative links
          const content = await readFile(targetPath);
          const updated = await updateRelativeLinks(
            content,
            doc,
            source,
            target,
          );

          if (content !== updated) {
            await writeFile(targetPath, updated);
          }
        }

        synced.push(doc);
      } catch (error) {
        console.error(`[DOC-SYNC] Failed to sync ${doc}:`, error.message);
        failed.push({
          file: doc,
          error: error.message,
        });
      }
    }

    return {
      target,
      status: failed.length === 0 ? "synced" : "partial",
      synced: synced.length,
      failed: failed.length,
      skipped: skipped.length,
      details: {
        synced,
        failed,
        skipped: skipped.slice(0, 5), // Limit skipped list
      },
    };
  } catch (error) {
    return {
      target,
      status: "failed",
      error: error.message,
    };
  }
}

async function shouldSync(sourcePath, targetPath) {
  try {
    const [sourceStat, targetStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(targetPath).catch(() => null),
    ]);

    // Target doesn't exist
    if (!targetStat) {
      return true;
    }

    // Source is newer
    if (sourceStat.mtime > targetStat.mtime) {
      return true;
    }

    // Check content hash
    const [sourceContent, targetContent] = await Promise.all([
      fs.readFile(sourcePath, "utf8"),
      fs.readFile(targetPath, "utf8"),
    ]);

    // Normalize line endings for comparison
    const normalizedSource = sourceContent.replace(/\r\n/g, "\n");
    const normalizedTarget = targetContent.replace(/\r\n/g, "\n");

    return normalizedSource !== normalizedTarget;
  } catch {
    return true; // Sync on any error
  }
}

async function updateRelativeLinks(content, docPath, sourceRoot, targetRoot) {
  let updated = content;

  // Calculate relative path difference
  const sourceDepth = docPath.split("/").length - 1;
  const targetDepth = docPath.split("/").length - 1;
  const depthDiff = targetDepth - sourceDepth;

  // Update relative links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  updated = updated.replace(linkRegex, (match, text, url) => {
    // Skip external links
    if (url.includes("://") || url.startsWith("#")) {
      return match;
    }

    // Skip absolute paths
    if (url.startsWith("/")) {
      return match;
    }

    // Update relative paths
    if (url.startsWith("./") || url.startsWith("../")) {
      const updatedUrl = adjustRelativePath(
        url,
        sourceRoot,
        targetRoot,
        docPath,
      );
      return `[${text}](${updatedUrl})`;
    }

    return match;
  });

  // Update image paths
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  updated = updated.replace(imgRegex, (match, alt, src) => {
    if (!src.includes("://") && !src.startsWith("/")) {
      const updatedSrc = adjustRelativePath(
        src,
        sourceRoot,
        targetRoot,
        docPath,
      );
      return `![${alt}](${updatedSrc})`;
    }
    return match;
  });

  return updated;
}

function adjustRelativePath(relativePath, sourceRoot, targetRoot, docPath) {
  // This is a simplified implementation
  // In a real scenario, would need more complex path resolution

  // Check if the referenced file exists in target
  const resolvedSource = path.resolve(
    path.dirname(path.join(sourceRoot, docPath)),
    relativePath,
  );
  const relativeToSource = path.relative(sourceRoot, resolvedSource);
  const targetResolved = path.join(targetRoot, relativeToSource);

  // Calculate new relative path from target doc location
  const targetDocDir = path.dirname(path.join(targetRoot, docPath));
  const newRelative = path.relative(targetDocDir, targetResolved);

  // Convert to forward slashes for markdown
  return newRelative.split(path.sep).join("/");
}

async function findMarkdownFiles(dir) {
  const files = [];

  async function scan(directory, base = "") {
    const fileList = await listFiles(directory, { includeDirectories: true });
    const entries = fileList;

    for (const entry of entries) {
      const relativePath = path.join(base, entry.name);
      const fullPath = path.join(directory, entry.name);

      if (
        (typeof entry.isDirectory === "function" ? entry.isDirectory() : entry._isDirectory) &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules"
      ) {
        await scan(fullPath, relativePath);
      } else if (entry.name.endsWith(".md")) {
        files.push(relativePath);
      }
    }
  }

  await scan(dir);
  return files;
}
