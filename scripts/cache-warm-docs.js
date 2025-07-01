// cache-warm-docs.js - Pre-cache high-value documentation files for fast access
import { promises as fs } from "fs";
import path from "path";
import { fileCache } from "../modules/unified-cache.js";

// High-value documentation files prioritized for caching
const HIGH_VALUE_DOCS = [
  "docs/03-reference/commands-reference.md",
  "docs/02-guides/architecture.md",
  "docs/02-guides/troubleshooting.md",
  "docs/02-guides/development.md",
  "docs/02-guides/unified-cache-system-complete.md",
  "docs/02-guides/natural-language.md",
  "docs/02-guides/recipes.md",
  "docs/99-misc/getting-started.md",
];

export async function run(args = {}) {
  const {
    files = HIGH_VALUE_DOCS,
    maxSize = 1048576, // 1MB default
    encoding = "utf8",
    dryRun = false,
    verbose = false,
  } = args;

  console.error("[CACHE-WARM-DOCS] Warming high-value documentation cache...");

  try {
    const cached = [];
    const skipped = [];
    const failed = [];

    if (verbose) {
      console.error(
        `[CACHE-WARM-DOCS] Processing ${files.length} high-value documentation files`,
      );
    }

    // Process each documentation file
    for (const file of files) {
      try {
        // Check if file exists
        try {
          await fs.access(file, fs.constants.R_OK);
        } catch {
          failed.push({
            file,
            error: "File not found or not readable",
          });
          continue;
        }

        const stats = await fs.stat(file);

        // Skip files that are too large
        if (stats.size > maxSize) {
          skipped.push({
            file,
            reason: `File too large (${formatSize(stats.size)} > ${formatSize(maxSize)})`,
          });
          continue;
        }

        // Read file content
        const content = await fs.readFile(file, encoding);

        // Cache metadata for documentation files
        const metadata = {
          path: file,
          type: "documentation",
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          encoding,
          lines: content.split("\n").length,
          hasToC: detectTableOfContents(content),
          sections: extractSections(content),
          cached: new Date().toISOString(),
          category: determineCategory(file),
        };

        if (verbose) {
          console.error(
            `[CACHE-WARM-DOCS] Processing ${file} (${formatSize(stats.size)}, ${metadata.lines} lines)`,
          );
        }

        if (!dryRun) {
          // Cache content with metadata using unified cache
          const cacheData = {
            content,
            metadata,
          };

          const cacheSuccess = await fileCache.set(file, cacheData, {
            ttl: 24 * 60 * 60 * 1000, // 24 hours for documentation files
          });

          if (!cacheSuccess) {
            throw new Error("Failed to cache file");
          }
        }

        cached.push({
          file,
          size: stats.size,
          sections: metadata.sections.length,
          category: metadata.category,
        });
      } catch (error) {
        failed.push({
          file,
          error: error.message,
        });
      }
    }

    // Calculate statistics
    const totalSize = cached.reduce((sum, item) => sum + item.size, 0);
    const categoryStats = cached.reduce((stats, item) => {
      stats[item.category] = (stats[item.category] || 0) + 1;
      return stats;
    }, {});

    if (verbose) {
      console.error(`[CACHE-WARM-DOCS] Category breakdown:`, categoryStats);
      if (skipped.length > 0) {
        console.error(`[CACHE-WARM-DOCS] Skipped files:`, skipped);
      }
      if (failed.length > 0) {
        console.error(`[CACHE-WARM-DOCS] Failed files:`, failed);
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        processed: files.length,
        cached: cached.length,
        skipped: skipped.length,
        failed: failed.length,
        totalSize: formatSize(totalSize),
        categoryStats,
        examples: cached.slice(0, 3).map((c) => c.file),
      },
      message: dryRun
        ? `Would cache ${cached.length} documentation files (${formatSize(totalSize)})`
        : `Cached ${cached.length} high-value documentation files (${formatSize(totalSize)})`,
    };
  } catch (error) {
    console.error("[CACHE-WARM-DOCS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm documentation cache",
    };
  }
}

function detectTableOfContents(content) {
  // Check for common ToC patterns
  const tocPatterns = [
    /^#+\s*table\s+of\s+contents/im,
    /^#+\s*contents/im,
    /^#+\s*toc/im,
    /^\*\*Table of Contents\*\*/im,
    /^## <a name="toc">/im,
    /<!-- TOC -->/im,
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

function determineCategory(filePath) {
  if (filePath.includes("reference")) return "reference";
  if (filePath.includes("guides")) return "guides";
  if (filePath.includes("concepts")) return "concepts";
  if (filePath.includes("troubleshooting")) return "troubleshooting";
  if (filePath.includes("misc")) return "misc";
  return "other";
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
