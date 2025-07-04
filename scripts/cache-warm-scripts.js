// cache-warm-scripts.js - Pre-cache frequently used scripts and recipes
import { readFile } from "../modules/file-ops.js";
import { commandCache, fileCache } from "../modules/unified-cache.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Frequently used scripts to cache
const FREQUENT_SCRIPTS = [
  "scripts/git-commit.js",
  "scripts/git-push.js",
  "scripts/ci-smart-push.js",
  "scripts/detect-issues.js",
  "scripts/quality-fix-all.js",
  "scripts/doc-generate.js",
  "scripts/backlog-display.js",
  "scripts/test-runner.js",
  "scripts/cache-status.js",
  "scripts/save-conversation.js",
];

// Write to stderr to avoid stdout pollution
function logError(message) {
  process.stderr.write(`[CACHE-WARM-SCRIPTS] ${message}\n`);
}

export async function run(args = {}) {
  const { dryRun = false, verbose = false, includeRecipes = true } = args;

  logError("Warming frequently used scripts and recipes...");

  const results = {
    scripts: { cached: 0, failed: 0, skipped: 0, size: 0 },
    recipes: { cached: 0, failed: 0, skipped: 0, size: 0 },
    errors: [],
  };

  try {
    // Cache frequent scripts
    for (const scriptPath of FREQUENT_SCRIPTS) {
      const fullPath = join(rootDir, scriptPath);

      try {
        // Check if file exists
        const exists = await fs
          .access(fullPath)
          .then(() => true)
          .catch(() => false);
        if (!exists) {
          results.scripts.skipped++;
          if (verbose) logError(`Skipped (not found): ${scriptPath}`);
          continue;
        }

        if (!dryRun) {
          // Check if already cached
          const cacheKey = `script:${scriptPath}`;
          const cached = await fileCache.get(cacheKey);

          if (!cached || cached.expired) {
            const content = await readFile(fullPath);
            const stats = await fs.stat(fullPath);

            await fileCache.set(cacheKey, {
              content,
              path: scriptPath,
              mtime: stats.mtime.toISOString(),
              size: stats.size,
            });

            results.scripts.cached++;
            results.scripts.size += stats.size;

            if (verbose)
              logError(`Cached: ${scriptPath} (${stats.size} bytes)`);
          } else {
            results.scripts.skipped++;
            if (verbose) logError(`Already cached: ${scriptPath}`);
          }
        } else {
          const stats = await fs.stat(fullPath);
          results.scripts.cached++;
          results.scripts.size += stats.size;
          if (verbose)
            logError(`Would cache: ${scriptPath} (${stats.size} bytes)`);
        }
      } catch (error) {
        results.scripts.failed++;
        results.errors.push(`${scriptPath}: ${error.message}`);
        if (verbose) logError(`Failed: ${scriptPath} - ${error.message}`);
      }
    }

    // Cache recipes
    if (includeRecipes) {
      const recipesPath = join(rootDir, "config/recipes.json");

      try {
        if (!dryRun) {
          const cacheKey = "config:recipes";
          const cached = await fileCache.get(cacheKey);

          if (!cached || cached.expired) {
            const content = await readFile(recipesPath);
            const stats = await fs.stat(recipesPath);

            await fileCache.set(cacheKey, {
              content,
              path: "config/recipes.json",
              mtime: stats.mtime.toISOString(),
              size: stats.size,
            });

            results.recipes.cached++;
            results.recipes.size += stats.size;

            if (verbose) logError(`Cached recipes.json (${stats.size} bytes)`);
          } else {
            results.recipes.skipped++;
            if (verbose) logError("Recipes already cached");
          }
        } else {
          const stats = await fs.stat(recipesPath);
          results.recipes.cached++;
          results.recipes.size += stats.size;
          if (verbose)
            logError(`Would cache recipes.json (${stats.size} bytes)`);
        }
      } catch (error) {
        results.recipes.failed++;
        results.errors.push(`recipes.json: ${error.message}`);
        if (verbose) logError(`Failed to cache recipes: ${error.message}`);
      }
    }

    const totalCached = results.scripts.cached + results.recipes.cached;
    const totalSize = results.scripts.size + results.recipes.size;
    const totalSkipped = results.scripts.skipped + results.recipes.skipped;
    const totalFailed = results.scripts.failed + results.recipes.failed;

    return {
      success: true,
      dryRun,
      data: {
        scripts: results.scripts,
        recipes: results.recipes,
        totalCached,
        totalSize: formatSize(totalSize),
        totalSkipped,
        totalFailed,
        errors: results.errors,
      },
      message: dryRun
        ? `Would cache ${totalCached} scripts/recipes (${formatSize(totalSize)})`
        : `Cached ${totalCached} scripts/recipes (${formatSize(totalSize)})`,
    };
  } catch (error) {
    logError(`Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm script cache",
    };
  }
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
