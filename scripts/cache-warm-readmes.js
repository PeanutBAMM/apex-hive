// cache-warm-readmes.js - Pre-cache README files for fast access
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";
import os from "os";
import { readFile, getFileStats, pathExists, batchRead } from "../modules/file-ops.js";
import { fileCache } from "../modules/unified-cache.js";

export async function run(args = {}) {
  const {
    directories = ["."],
    recursive = true,
    pattern = "README*",
    maxSize = 1048576, // 1MB default
    encoding = "utf8",
    includeMarkdown = true,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[CACHE-WARM-READMES] Warming README cache...");

  try {
    const readmeFiles = [];
    const cached = [];
    const skipped = [];
    const failed = [];

    // Find all README files
    for (const dir of directories) {
      const files = await findReadmeFiles(dir, {
        recursive,
        pattern,
        includeMarkdown,
      });
      readmeFiles.push(...files);
    }

    if (readmeFiles.length === 0) {
      return {
        success: true,
        data: {
          found: 0,
          cached: 0,
          skipped: 0,
          failed: 0,
        },
        message: "No README files found",
      };
    }

    console.error(
      `[CACHE-WARM-READMES] Found ${readmeFiles.length} README files`,
    );

    // Cache directory is handled by unified cache

    // Process each README
    for (const file of readmeFiles) {
      try {
        const stats = await getFileStats(file);

        // Skip files that are too large
        if (stats.size > maxSize) {
          skipped.push({
            file,
            reason: `File too large (${formatSize(stats.size)} > ${formatSize(maxSize)})`,
          });
          continue;
        }

        // Read file content (already uses cache)
        const content = await readFile(file);

        // Cache metadata
        const metadata = {
          path: file,
          size: stats.size,
          mtime: stats.modified.toISOString(),
          encoding,
          lines: content.split("\n").length,
          hasToC: detectTableOfContents(content),
          sections: extractSections(content),
          cached: new Date().toISOString(),
        };

        if (!dryRun) {
          // Cache content with metadata using unified cache
          const cacheData = {
            content,
            metadata,
          };

          const cacheSuccess = await fileCache.set(file, cacheData, {
            ttl: 24 * 60 * 60 * 1000, // 24 hours for README files
          });

          if (!cacheSuccess) {
            throw new Error("Failed to cache file");
          }
        }

        cached.push({
          file,
          size: stats.size,
          sections: metadata.sections.length,
        });
      } catch (error) {
        failed.push({
          file,
          error: error.message,
        });
      }
    }

    // Index is now handled by unified cache stats

    // Calculate total cached size
    const totalSize = cached.reduce((sum, item) => sum + item.size, 0);

    return {
      success: true,
      dryRun,
      data: {
        found: readmeFiles.length,
        cached: cached.length,
        skipped: skipped.length,
        failed: failed.length,
        totalSize: formatSize(totalSize),
        examples: cached.slice(0, 5).map((c) => c.file),
      },
      message: dryRun
        ? `Would cache ${cached.length} README files (${formatSize(totalSize)})`
        : `Cached ${cached.length} README files (${formatSize(totalSize)})`,
    };
  } catch (error) {
    console.error("[CACHE-WARM-READMES] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm README cache",
    };
  }
}

async function findReadmeFiles(directory, options) {
  const files = [];

  try {
    // Build find command
    let findCmd = `find ${directory}`;

    if (!options.recursive) {
      findCmd += " -maxdepth 1";
    }

    // Pattern for README files
    findCmd += ` -type f -iname "${options.pattern}"`;

    // Include markdown files with readme in name
    if (options.includeMarkdown) {
      findCmd += ` -o -type f -iname "*readme*.md"`;
    }

    // Exclude common non-README patterns
    findCmd +=
      " | grep -v node_modules | grep -v .git | grep -v dist | grep -v build";

    const output = execSync(findCmd, { encoding: "utf8" });
    const foundFiles = output
      .trim()
      .split("\n")
      .filter((f) => f);

    // Verify files exist and are readable
    for (const file of foundFiles) {
      try {
        const exists = await pathExists(file);
        if (exists) {
          files.push(file);
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch (error) {
    console.error(
      `[CACHE-WARM-READMES] Error finding files in ${directory}:`,
      error.message,
    );
  }

  return files;
}

function detectTableOfContents(content) {
  // Check for common ToC patterns
  const tocPatterns = [
    /^#+\s*table\s+of\s+contents/im,
    /^#+\s*contents/im,
    /^#+\s*toc/im,
    /^\*\*Table of Contents\*\*/im,
    /^## <a name="toc">/im,
  ];

  return tocPatterns.some((pattern) => pattern.test(content));
}

function extractSections(content) {
  const sections = [];
  const lines = content.split("\n");

  // Extract markdown headers
  const headerRegex = /^(#{1,6})\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(headerRegex);
    if (match) {
      sections.push({
        level: match[1].length,
        title: match[2].trim(),
        line: i + 1,
      });
    }
  }

  return sections;
}

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
