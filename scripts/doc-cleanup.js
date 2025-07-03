// doc-cleanup.js - Clean up documentation structure (remove prefixes, merge duplicates)
import {
  readFile,
  writeFile,
  pathExists,
  listFiles,
  batchRead,
} from "../modules/file-ops.js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export async function run(args) {
  const { source = "docs", dryRun = false, verbose = false } = args;

  console.error("[DOC-CLEANUP] Starting documentation cleanup...");
  if (dryRun) {
    console.error("[DOC-CLEANUP] DRY RUN - No changes will be made");
  }

  try {
    // Step 1: Find all folders that need renaming (numbered prefixes)
    const folderRenames = await findNumberedFolders(source);

    // Step 2: Find duplicate folders that can be merged
    const folderMerges = await findDuplicateFolders(source, folderRenames);

    // Step 3: Find all files that need renaming (prefixes)
    const fileRenames = await findFilesWithPrefixes(source);

    // Step 4: Execute operations
    let stats = {
      foldersRenamed: 0,
      foldersMerged: 0,
      filesRenamed: 0,
      duplicatesRemoved: 0,
      errors: [],
    };

    if (!dryRun) {
      // Execute folder merges first (includes duplicate detection)
      stats = await executeFolderMerges(folderMerges, stats, verbose);

      // Then rename folders
      stats = await executeFolderRenames(folderRenames, stats, verbose);

      // Finally rename files
      stats = await executeFileRenames(fileRenames, stats, verbose);

      // Clean up empty directories
      await cleanEmptyDirs(source);
    } else {
      // Show what would be done
      console.error("\n[DOC-CLEANUP] Would perform:");
      console.error(`  - Rename ${folderRenames.length} folders`);
      console.error(`  - Merge ${folderMerges.length} folder pairs`);
      console.error(`  - Rename ${fileRenames.length} files`);

      if (verbose) {
        console.error("\nFolder renames:");
        folderRenames.forEach((r) =>
          console.error(`  ${r.oldName} → ${r.newName}`),
        );

        console.error("\nFolder merges:");
        folderMerges.forEach((m) =>
          console.error(`  ${m.sources.join(" + ")} → ${m.target}`),
        );

        console.error("\nFile renames:");
        fileRenames.forEach((r) =>
          console.error(`  ${path.basename(r.from)} → ${path.basename(r.to)}`),
        );
      }
    }

    return {
      status: dryRun ? "dry-run" : "cleaned",
      stats,
      message: dryRun
        ? `Would clean ${folderRenames.length + folderMerges.length} folders and ${fileRenames.length} files`
        : `Cleaned ${stats.foldersRenamed + stats.foldersMerged} folders and ${stats.filesRenamed} files`,
    };
  } catch (error) {
    console.error("[DOC-CLEANUP] Error:", error.message);
    return {
      status: "error",
      message: "Failed to clean documentation",
      error: error.message,
    };
  }
}

// Find folders that need renaming (numbered prefixes and scripts-* folders)
async function findNumberedFolders(sourceDir) {
  const renames = [];

  // Folder mappings for cleanup
  const FOLDER_MAPPINGS = {
    "cache-warm": "cache",
    "scripts-ci": "ci",
    "scripts-doc": "doc",
    "scripts-cache": "cache",
    "scripts-quality": "quality",
    "scripts-git": "git",
    "scripts-backlog": "backlog",
    "scripts-deploy": "deploy",
    "scripts-build": "build",
    "scripts-test": "test",
    "scripts-release": "release",
    "scripts-version": "version",
    "scripts-changelog": "changelog",
    "scripts-commit": "commit",
    "scripts-push": "push",
    "scripts-report": "report",
    "scripts-search": "search",
    "scripts-init": "init",
    "scripts-code": "code",
    "scripts-save-conversation": "save-conversation",
    "scripts-fix-detected": "fix-detected",
    "scripts-detect-issues": "detect-issues",
    "scripts-xml": "xml",
  };

  async function scan(dir) {
    const entries = await listFiles(dir, {
      withFileTypes: true,
      includeDirectories: true,
    });

    for (const entry of entries) {
      if (isDirectory(entry) && !entry.name.startsWith(".")) {
        const oldName = entry.name;
        let newName = oldName;

        // Check for numbered prefix pattern
        if (/^\d{2}-/.test(oldName)) {
          newName = oldName.replace(/^\d{2}-/, "");
        }

        // Check for folder mappings (e.g., scripts-ci → ci)
        if (FOLDER_MAPPINGS[oldName]) {
          newName = FOLDER_MAPPINGS[oldName];
        }

        if (newName !== oldName) {
          const oldPath = path.join(dir, oldName);
          const newPath = path.join(dir, newName);

          renames.push({
            from: oldPath,
            to: newPath,
            oldName,
            newName,
          });
        }

        // Don't scan inside folders that will be renamed
        if (newName === oldName) {
          await scan(path.join(dir, oldName));
        }
      }
    }
  }

  await scan(sourceDir);
  return renames;
}

// Find duplicate folders (after cleaning names)
async function findDuplicateFolders(sourceDir, plannedRenames) {
  const merges = [];
  const folderMap = new Map();

  // Build map of clean folder names
  async function scan(dir) {
    const entries = await listFiles(dir, {
      withFileTypes: true,
      includeDirectories: true,
    });

    for (const entry of entries) {
      if (isDirectory(entry) && !entry.name.startsWith(".")) {
        const fullPath = path.join(dir, entry.name);
        const cleanName = entry.name.replace(/^\d{2}-/, "");

        const key = `${dir}/${cleanName}`;
        if (!folderMap.has(key)) {
          folderMap.set(key, []);
        }
        folderMap.get(key).push({
          path: fullPath,
          originalName: entry.name,
        });
      }
    }
  }

  await scan(sourceDir);

  // Find duplicates
  for (const [key, folders] of folderMap.entries()) {
    if (folders.length > 1) {
      // Sort to ensure consistent merge order (prefer non-numbered names)
      folders.sort((a, b) => {
        const aHasNumber = /^\d{2}-/.test(a.originalName);
        const bHasNumber = /^\d{2}-/.test(b.originalName);
        if (aHasNumber && !bHasNumber) return 1;
        if (!aHasNumber && bHasNumber) return -1;
        return a.originalName.localeCompare(b.originalName);
      });

      merges.push({
        target: folders[0].path.replace(/^\d{2}-/, ""),
        sources: folders.map((f) => f.path),
        cleanName: key.split("/").pop(),
      });
    }
  }

  return merges;
}

// Find files with prefixes to clean
async function findFilesWithPrefixes(sourceDir) {
  const renames = [];

  async function scan(dir) {
    const entries = await listFiles(dir, {
      withFileTypes: true,
      includeDirectories: true,
    });

    for (const entry of entries) {
      if (isDirectory(entry) && !entry.name.startsWith(".")) {
        await scan(path.join(dir, entry.name));
      } else if (entry.name.endsWith(".md")) {
        const oldName = entry.name;
        const cleanName = cleanupFileName(oldName);

        if (oldName !== cleanName) {
          renames.push({
            from: path.join(dir, oldName),
            to: path.join(dir, cleanName),
            oldName,
            newName: cleanName,
          });
        }
      }
    }
  }

  await scan(sourceDir);
  return renames;
}

// Clean up file names (but keep descriptive names)
function cleanupFileName(fileName) {
  let clean = fileName;

  // Define all prefix patterns to remove (EXCEPT api- which is useful)
  const PREFIXES_TO_REMOVE = [
    /^\d{2}-[^-]+-/, // "99-misc-api-utils.md" → "api-utils.md"
    /^\d{2}-/, // "05-" → ""
    /^changes-scripts-/, // "changes-scripts-" → ""
    /^scripts-/, // "scripts-" → ""
    /^restructuring-/, // "restructuring-" → ""
    /^changes-/, // "changes-" → ""
    /^fix-/, // "fix-" → ""
    /^troubleshoot-/, // "troubleshoot-" → ""
    /^reference-/, // "reference-" → ""
    /^development-/, // "development-" → ""
    /^guides-/, // "guides-" → ""
    /^misc-/, // "misc-" → ""
  ];

  // Apply all prefix removals
  for (const pattern of PREFIXES_TO_REMOVE) {
    clean = clean.replace(pattern, "");
  }

  // Special handling for script files - keep descriptive names
  // "scripts-ci-monitor.md" → "ci-monitor.md" NOT "ci.md"
  if (clean.includes("-scripts")) {
    // Only remove the -scripts suffix if it's really a suffix
    clean = clean.replace(/-scripts\.md$/, ".md");
    // Handle double scripts pattern: "scripts-ci-scripts.md" → "ci-scripts.md"
    clean = clean.replace(/^(.+)-scripts-scripts/, "$1-scripts");
  }

  return clean;
}

// Execute folder merges with duplicate detection
async function executeFolderMerges(merges, stats, verbose) {
  for (const merge of merges) {
    try {
      if (verbose) {
        console.error(
          `[DOC-CLEANUP] Merging ${merge.sources.length} folders into ${merge.cleanName}`,
        );
      }

      // Create target folder if needed
      const targetPath = merge.sources[0].replace(/^\d{2}-/, "");
      await fs.mkdir(targetPath, { recursive: true });

      // Collect all files from source folders
      const fileMap = new Map(); // filename -> [{path, hash}]

      for (const sourceFolder of merge.sources) {
        if (sourceFolder === targetPath) continue; // Skip if source is target

        const files = await listFiles(sourceFolder, { withFileTypes: true });

        for (const file of files) {
          if (file.name.endsWith(".md")) {
            const filePath = path.join(sourceFolder, file.name);
            const content = await readFile(filePath);
            const hash = crypto.createHash("md5").update(content).digest("hex");
            const cleanName = cleanupFileName(file.name);

            if (!fileMap.has(cleanName)) {
              fileMap.set(cleanName, []);
            }

            fileMap.get(cleanName).push({
              path: filePath,
              hash,
              content,
            });
          }
        }
      }

      // Process files - handle duplicates
      for (const [fileName, fileInfos] of fileMap.entries()) {
        const targetFile = path.join(targetPath, fileName);

        if (fileInfos.length === 1) {
          // Unique file - just move it
          await writeFile(targetFile, fileInfos[0].content);
          if (verbose) {
            console.error(`  - Moved ${fileName}`);
          }
        } else {
          // Multiple files with same name
          const uniqueHashes = new Map();

          fileInfos.forEach((info) => {
            if (!uniqueHashes.has(info.hash)) {
              uniqueHashes.set(info.hash, info);
            } else if (verbose) {
              console.error(
                `  - Skipped duplicate ${fileName} from ${path.dirname(info.path)}`,
              );
              stats.duplicatesRemoved++;
            }
          });

          // Write unique versions
          const unique = Array.from(uniqueHashes.values());
          if (unique.length === 1) {
            // All copies are identical
            await writeFile(targetFile, unique[0].content);
            stats.duplicatesRemoved += fileInfos.length - 1;
          } else {
            // Different content - create numbered versions
            for (let i = 0; i < unique.length; i++) {
              const name =
                i === 0 ? fileName : fileName.replace(".md", `-${i + 1}.md`);
              await writeFile(path.join(targetPath, name), unique[i].content);
              if (verbose) {
                console.error(
                  `  - Created ${name} (variant ${i + 1} of ${unique.length})`,
                );
              }
            }
          }
        }
      }

      // Remove source folders (except target)
      for (const sourceFolder of merge.sources) {
        if (sourceFolder !== targetPath) {
          await fs.rm(sourceFolder, { recursive: true });
        }
      }

      stats.foldersMerged++;
    } catch (error) {
      console.error(`[DOC-CLEANUP] Failed to merge folders:`, error.message);
      stats.errors.push(`Merge ${merge.cleanName}: ${error.message}`);
    }
  }

  return stats;
}

// Execute folder renames
async function executeFolderRenames(renames, stats, verbose) {
  // Sort by path depth (deepest first) to avoid conflicts
  renames.sort(
    (a, b) => b.from.split(path.sep).length - a.from.split(path.sep).length,
  );

  for (const rename of renames) {
    try {
      // Check if target already exists
      if (await pathExists(rename.to)) {
        if (verbose) {
          console.error(
            `[DOC-CLEANUP] Skipping ${rename.oldName} - target exists`,
          );
        }
        continue;
      }

      await fs.rename(rename.from, rename.to);
      stats.foldersRenamed++;

      if (verbose) {
        console.error(
          `[DOC-CLEANUP] Renamed folder: ${rename.oldName} → ${rename.newName}`,
        );
      }
    } catch (error) {
      console.error(
        `[DOC-CLEANUP] Failed to rename ${rename.from}:`,
        error.message,
      );
      stats.errors.push(`Rename ${rename.oldName}: ${error.message}`);
    }
  }

  return stats;
}

// Execute file renames
async function executeFileRenames(renames, stats, verbose) {
  for (const rename of renames) {
    try {
      // Check if target already exists
      if (await pathExists(rename.to)) {
        // Read both files to check if they're identical
        const [content1, content2] = await Promise.all([
          readFile(rename.from),
          readFile(rename.to),
        ]);

        if (content1 === content2) {
          // Identical - remove the prefixed version
          await fs.unlink(rename.from);
          stats.duplicatesRemoved++;
          if (verbose) {
            console.error(`[DOC-CLEANUP] Removed duplicate: ${rename.oldName}`);
          }
        } else {
          // Different content - create numbered version
          const base = path.basename(rename.to, ".md");
          const newName = `${base}-2.md`;
          await fs.rename(
            rename.from,
            path.join(path.dirname(rename.to), newName),
          );
          if (verbose) {
            console.error(
              `[DOC-CLEANUP] Renamed to ${newName} (different content)`,
            );
          }
        }
      } else {
        await fs.rename(rename.from, rename.to);
        stats.filesRenamed++;

        if (verbose) {
          console.error(
            `[DOC-CLEANUP] Renamed file: ${rename.oldName} → ${rename.newName}`,
          );
        }
      }
    } catch (error) {
      console.error(
        `[DOC-CLEANUP] Failed to rename ${rename.from}:`,
        error.message,
      );
      stats.errors.push(`Rename ${rename.oldName}: ${error.message}`);
    }
  }

  return stats;
}

// Clean up empty directories
async function cleanEmptyDirs(dir) {
  try {
    const entries = await listFiles(dir, {
      withFileTypes: true,
      includeDirectories: true,
    });

    // Recursively clean subdirectories first
    for (const entry of entries) {
      if (isDirectory(entry) && !entry.name.startsWith(".")) {
        await cleanEmptyDirs(path.join(dir, entry.name));
      }
    }

    // Check if current directory is empty
    const remaining = await listFiles(dir);
    if (remaining.length === 0 && dir !== "docs") {
      await fs.rmdir(dir);
      console.error(`[DOC-CLEANUP] Removed empty directory: ${dir}`);
    }
  } catch (error) {
    // Ignore errors - directory might have been removed already
  }
}

// Helper to check if entry is directory
function isDirectory(entry) {
  return typeof entry.isDirectory === "function"
    ? entry.isDirectory()
    : entry._isDirectory;
}
