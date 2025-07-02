// cache-warm-all.js - Combined cache warming for READMEs, high-value documentation, conversations, and scripts
import { run as warmReadmes } from "./cache-warm-readmes.js";
import { run as warmDocs } from "./cache-warm-docs.js";
import { run as warmConversations } from "./cache-warm-conversations.js";
import { run as warmScripts } from "./cache-warm-scripts.js";

export async function run(args = {}) {
  const {
    dryRun = false,
    verbose = false,
    maxSize = 1048576, // 1MB default
    encoding = "utf8",
  } = args;

  process.stderr.write("[CACHE-WARM-ALL] Starting comprehensive cache warming...\n");

  try {
    const results = {
      readmes: null,
      docs: null,
      conversations: null,
      scripts: null,
      combined: {
        success: true,
        totalCached: 0,
        totalSize: 0,
        totalSkipped: 0,
        totalFailed: 0,
        categories: {},
      },
    };

    // Step 1: Warm README files
    if (verbose) {
      process.stderr.write("[CACHE-WARM-ALL] Phase 1: Warming README files...\n");
    }

    results.readmes = await warmReadmes({
      dryRun,
      maxSize,
      encoding,
      verbose,
    });

    if (!results.readmes.success) {
      process.stderr.write(
        `[CACHE-WARM-ALL] README warming failed: ${results.readmes.error}\n`
      );
      results.combined.success = false;
    } else {
      results.combined.totalCached += results.readmes.data.cached;
      results.combined.totalSkipped += results.readmes.data.skipped;
      results.combined.totalFailed += results.readmes.data.failed;
      results.combined.categories.readmes = results.readmes.data.cached;

      // Parse size if it's a string
      const readmeSize = parseSizeString(results.readmes.data.totalSize);
      results.combined.totalSize += readmeSize;
    }

    // Step 2: Warm high-value documentation
    if (verbose) {
      process.stderr.write(
        "[CACHE-WARM-ALL] Phase 2: Warming high-value documentation...\n"
      );
    }

    results.docs = await warmDocs({
      dryRun,
      maxSize,
      encoding,
      verbose,
    });

    if (!results.docs.success) {
      process.stderr.write(
        `[CACHE-WARM-ALL] Documentation warming failed: ${results.docs.error}\n`
      );
      results.combined.success = false;
    } else {
      results.combined.totalCached += results.docs.data.cached;
      results.combined.totalSkipped += results.docs.data.skipped;
      results.combined.totalFailed += results.docs.data.failed;

      // Merge category stats
      Object.assign(
        results.combined.categories,
        results.docs.data.categoryStats,
      );

      // Parse size if it's a string
      const docsSize = parseSizeString(results.docs.data.totalSize);
      results.combined.totalSize += docsSize;
    }

    // Step 3: Warm conversations
    if (verbose) {
      process.stderr.write("[CACHE-WARM-ALL] Phase 3: Warming conversations...\n");
    }

    results.conversations = await warmConversations({
      dryRun,
      verbose,
      limit: 5, // Warm last 5 conversations (reduced for size)
    });

    if (!results.conversations.success) {
      process.stderr.write(
        `[CACHE-WARM-ALL] Conversation warming failed: ${results.conversations.error}\n`
      );
      results.combined.success = false;
    } else {
      // Include both newly warmed AND already cached conversations in total
      const conversationCount =
        results.conversations.data.warmed +
        results.conversations.data.alreadyCached;
      results.combined.totalCached += conversationCount;
      results.combined.categories.conversations = conversationCount;

      // Parse size if it's a string
      const convoSize = parseSizeString(results.conversations.data.totalSize);
      results.combined.totalSize += convoSize;
    }

    // Step 4: Warm frequently used scripts and recipes
    if (verbose) {
      process.stderr.write("[CACHE-WARM-ALL] Phase 4: Warming scripts and recipes...\n");
    }

    results.scripts = await warmScripts({
      dryRun,
      verbose,
      includeRecipes: true,
    });

    if (!results.scripts.success) {
      process.stderr.write(
        `[CACHE-WARM-ALL] Script warming failed: ${results.scripts.error}\n`
      );
      results.combined.success = false;
    } else {
      results.combined.totalCached += results.scripts.data.totalCached;
      results.combined.totalSkipped += results.scripts.data.totalSkipped;
      results.combined.totalFailed += results.scripts.data.totalFailed;
      results.combined.categories.scripts = results.scripts.data.scripts.cached;
      results.combined.categories.recipes = results.scripts.data.recipes.cached;

      // Parse size if it's a string
      const scriptsSize = parseSizeString(results.scripts.data.totalSize);
      results.combined.totalSize += scriptsSize;
    }

    // Generate summary
    const summary = {
      success: results.combined.success,
      dryRun,
      data: {
        phases: {
          readmes: results.readmes
            ? {
                success: results.readmes.success,
                cached: results.readmes.data?.cached || 0,
                message: results.readmes.message,
              }
            : null,
          docs: results.docs
            ? {
                success: results.docs.success,
                cached: results.docs.data?.cached || 0,
                message: results.docs.message,
              }
            : null,
          conversations: results.conversations
            ? {
                success: results.conversations.success,
                cached:
                  (results.conversations.data?.warmed || 0) +
                  (results.conversations.data?.alreadyCached || 0),
                message: results.conversations.message,
              }
            : null,
          scripts: results.scripts
            ? {
                success: results.scripts.success,
                cached: results.scripts.data?.totalCached || 0,
                message: results.scripts.message,
              }
            : null,
        },
        totals: {
          cached: results.combined.totalCached,
          skipped: results.combined.totalSkipped,
          failed: results.combined.totalFailed,
          totalSize: formatSize(results.combined.totalSize),
          categories: results.combined.categories,
        },
      },
      message: dryRun
        ? `Would cache ${results.combined.totalCached} items (${formatSize(results.combined.totalSize)}) across READMEs, documentation, conversations, and scripts`
        : `Successfully cached ${results.combined.totalCached} items (${formatSize(results.combined.totalSize)}) - READMEs, high-value documentation, conversations, and scripts`,
    };

    if (verbose) {
      process.stderr.write("[CACHE-WARM-ALL] Cache warming summary:\n");
      process.stderr.write(`  READMEs: ${results.readmes?.data?.cached || 0} files\n`);
      process.stderr.write(
        `  Documentation: ${results.docs?.data?.cached || 0} files\n`,
      );
      process.stderr.write(
        `  Conversations: ${results.conversations?.data?.warmed || 0} warmed, ${results.conversations?.data?.alreadyCached || 0} already cached\n`,
      );
      process.stderr.write(
        `  Scripts: ${results.scripts?.data?.scripts?.cached || 0} scripts, ${results.scripts?.data?.recipes?.cached || 0} recipes\n`,
      );
      process.stderr.write(
        `  Total: ${results.combined.totalCached} items (${formatSize(results.combined.totalSize)})\n`,
      );
      process.stderr.write(`  Categories: ${JSON.stringify(results.combined.categories)}\n`);
    }

    process.stderr.write(`[CACHE-WARM-ALL] ${summary.message}\n`);

    return summary;
  } catch (error) {
    process.stderr.write(`[CACHE-WARM-ALL] Error: ${error.message}\n`);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm cache (combined operation)",
    };
  }
}

function parseSizeString(sizeStr) {
  if (typeof sizeStr === "number") return sizeStr;
  if (!sizeStr || typeof sizeStr !== "string") return 0;

  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  const multipliers = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] || 1);
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
