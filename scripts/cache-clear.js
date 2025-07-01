// cache-clear.js - Clear the apex cache using unified cache system
import {
  commandCache,
  fileCache,
  searchCache,
  conversationCache,
  formatBytes,
} from "../modules/unified-cache.js";

export async function run(args = {}) {
  const { dryRun = false, verbose = false, modules = {} } = args;

  console.error("[CACHE-CLEAR] Clearing unified cache...");

  try {
    const results = {
      files: 0,
      conversations: 0,
      commands: 0,
      search: 0,
      total: 0,
      totalSize: 0,
    };

    // Declare clear results in outer scope
    let fileClear, convClear, cmdClear, searchClear;

    // Get stats before clearing
    const statsBefore = await Promise.all([
      fileCache.stats(),
      conversationCache.stats(),
      commandCache.stats(),
      searchCache.stats(),
    ]);

    // Calculate total size before
    results.totalSize = statsBefore.reduce(
      (sum, stats) => sum + stats.totalSize,
      0,
    );

    if (verbose) {
      console.error("[CACHE-CLEAR] Current cache stats:");
      console.error(
        `  Files: ${statsBefore[0].items} items, ${formatBytes(statsBefore[0].totalSize)}`,
      );
      console.error(
        `  Conversations: ${statsBefore[1].items} items, ${formatBytes(statsBefore[1].totalSize)}`,
      );
      console.error(
        `  Commands: ${statsBefore[2].items} items, ${formatBytes(statsBefore[2].totalSize)}`,
      );
      console.error(
        `  Search: ${statsBefore[3].items} items, ${formatBytes(statsBefore[3].totalSize)}`,
      );
    }

    if (!dryRun) {
      // Clear all caches - now returns {cleared, errors, totalSize}
      fileClear = await fileCache.clear();
      convClear = await conversationCache.clear();
      cmdClear = await commandCache.clear();
      searchClear = await searchCache.clear();

      results.files = fileClear.cleared;
      results.conversations = convClear.cleared;
      results.commands = cmdClear.cleared;
      results.search = searchClear.cleared;

      results.total =
        results.files +
        results.conversations +
        results.commands +
        results.search;

      if (verbose) {
        console.error("[CACHE-CLEAR] Cleared:");
        console.error(`  Files: ${results.files} entries`);
        console.error(`  Conversations: ${results.conversations} entries`);
        console.error(`  Commands: ${results.commands} entries`);
        console.error(`  Search: ${results.search} entries`);
      }
    } else {
      // In dry run, just count what would be cleared
      results.files = statsBefore[0].items * 2; // .cache + .meta files
      results.conversations = statsBefore[1].items * 2;
      results.commands = statsBefore[2].items * 2;
      results.search = statsBefore[3].items * 2;
      results.total =
        results.files +
        results.conversations +
        results.commands +
        results.search;
    }

    return {
      success: true,
      dryRun,
      data: {
        cleared: {
          files: dryRun ? results.files : fileClear,
          conversations: dryRun ? results.conversations : convClear,
          commands: dryRun ? results.commands : cmdClear,
          search: dryRun ? results.search : searchClear,
          total: results.total,
        },
        totalCleared: results.total,
        size: formatBytes(results.totalSize),
        locations: [
          "~/.apex-cache/files",
          "~/.apex-cache/conversations",
          "~/.apex-cache/commands",
          "~/.apex-cache/search",
        ],
      },
      message: dryRun
        ? `Would clear ${results.total} cache entries (${formatBytes(results.totalSize)})`
        : `Cleared ${results.total} cache entries (${formatBytes(results.totalSize)})`,
    };
  } catch (error) {
    console.error("[CACHE-CLEAR] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to clear cache",
    };
  }
}
