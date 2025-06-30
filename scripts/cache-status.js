// cache-status.js - Display cache statistics and status
import { commandCache, fileCache, searchCache, formatBytes } from "../modules/unified-cache.js";

export async function run(args = {}) {
  const {
    detailed = false,
    clear = false,
    namespace = null,
    modules = {},
  } = args;

  console.error("[CACHE-STATUS] Checking cache status...");

  try {
    const caches = {
      commands: commandCache,
      files: fileCache,
      search: searchCache
    };

    // If specific namespace requested
    if (namespace && caches[namespace]) {
      const cache = caches[namespace];
      
      if (clear) {
        const cleared = await cache.clear();
        return {
          success: true,
          data: {
            namespace,
            cleared
          },
          message: `Cleared ${cleared} items from ${namespace} cache`
        };
      }
      
      const stats = await cache.stats();
      return {
        success: true,
        data: stats,
        message: `Cache status for ${namespace}`
      };
    }

    // Get stats for all caches
    const allStats = {};
    let totalItems = 0;
    let totalSize = 0;
    let totalHits = 0;

    for (const [name, cache] of Object.entries(caches)) {
      const stats = await cache.stats();
      allStats[name] = stats;
      totalItems += stats.items;
      totalSize += stats.totalSize;
      totalHits += stats.totalHits;
    }

    // Build summary
    const summary = {
      totalCaches: Object.keys(caches).length,
      totalItems,
      totalSize: formatBytes(totalSize),
      totalHits,
      averageHitRate: totalItems > 0 ? (totalHits / totalItems).toFixed(2) : "0.00",
      caches: {}
    };

    // Add cache-specific summaries
    for (const [name, stats] of Object.entries(allStats)) {
      summary.caches[name] = {
        items: stats.items,
        size: formatBytes(stats.totalSize),
        hits: stats.totalHits,
        hitRate: stats.hitRate,
        expired: stats.expired
      };

      if (detailed) {
        summary.caches[name].topItems = stats.active.map(item => ({
          key: item.key.length > 50 ? item.key.substring(0, 47) + "..." : item.key,
          hits: item.hits,
          size: formatBytes(item.size),
          age: formatDuration(item.age),
          lastAccess: formatDuration(item.lastAccess) + " ago"
        }));
      }
    }

    return {
      success: true,
      data: summary,
      message: `Cache system status: ${totalItems} items, ${formatBytes(totalSize)}, ${totalHits} hits`
    };
  } catch (error) {
    console.error("[CACHE-STATUS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to get cache status"
    };
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}