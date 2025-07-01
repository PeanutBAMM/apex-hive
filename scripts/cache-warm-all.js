// cache-warm-all.js - Combined cache warming for READMEs and high-value documentation
import { run as warmReadmes } from "./cache-warm-readmes.js";
import { run as warmDocs } from "./cache-warm-docs.js";

export async function run(args = {}) {
  const {
    dryRun = false,
    verbose = false,
    maxSize = 1048576, // 1MB default
    encoding = "utf8",
  } = args;

  console.error("[CACHE-WARM-ALL] Starting comprehensive cache warming...");

  try {
    const results = {
      readmes: null,
      docs: null,
      combined: {
        success: true,
        totalCached: 0,
        totalSize: 0,
        totalSkipped: 0,
        totalFailed: 0,
        categories: {}
      }
    };

    // Step 1: Warm README files
    if (verbose) {
      console.error("[CACHE-WARM-ALL] Phase 1: Warming README files...");
    }
    
    results.readmes = await warmReadmes({
      dryRun,
      maxSize,
      encoding,
      verbose
    });

    if (!results.readmes.success) {
      console.error("[CACHE-WARM-ALL] README warming failed:", results.readmes.error);
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
      console.error("[CACHE-WARM-ALL] Phase 2: Warming high-value documentation...");
    }
    
    results.docs = await warmDocs({
      dryRun,
      maxSize,
      encoding,
      verbose
    });

    if (!results.docs.success) {
      console.error("[CACHE-WARM-ALL] Documentation warming failed:", results.docs.error);
      results.combined.success = false;
    } else {
      results.combined.totalCached += results.docs.data.cached;
      results.combined.totalSkipped += results.docs.data.skipped;
      results.combined.totalFailed += results.docs.data.failed;
      
      // Merge category stats
      Object.assign(results.combined.categories, results.docs.data.categoryStats);
      
      // Parse size if it's a string  
      const docsSize = parseSizeString(results.docs.data.totalSize);
      results.combined.totalSize += docsSize;
    }

    // Generate summary
    const summary = {
      success: results.combined.success,
      dryRun,
      data: {
        phases: {
          readmes: results.readmes ? {
            success: results.readmes.success,
            cached: results.readmes.data?.cached || 0,
            message: results.readmes.message
          } : null,
          docs: results.docs ? {
            success: results.docs.success,
            cached: results.docs.data?.cached || 0,
            message: results.docs.message
          } : null
        },
        totals: {
          cached: results.combined.totalCached,
          skipped: results.combined.totalSkipped,
          failed: results.combined.totalFailed,
          totalSize: formatSize(results.combined.totalSize),
          categories: results.combined.categories
        }
      },
      message: dryRun 
        ? `Would cache ${results.combined.totalCached} files (${formatSize(results.combined.totalSize)}) across READMEs and documentation`
        : `Successfully cached ${results.combined.totalCached} files (${formatSize(results.combined.totalSize)}) - READMEs and high-value documentation`
    };

    if (verbose) {
      console.error("[CACHE-WARM-ALL] Cache warming summary:");
      console.error(`  READMEs: ${results.readmes?.data?.cached || 0} files`);
      console.error(`  Documentation: ${results.docs?.data?.cached || 0} files`);
      console.error(`  Total: ${results.combined.totalCached} files (${formatSize(results.combined.totalSize)})`);
      console.error(`  Categories:`, results.combined.categories);
    }

    console.error(`[CACHE-WARM-ALL] ${summary.message}`);

    return summary;

  } catch (error) {
    console.error("[CACHE-WARM-ALL] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm cache (combined operation)"
    };
  }
}

function parseSizeString(sizeStr) {
  if (typeof sizeStr === 'number') return sizeStr;
  if (!sizeStr || typeof sizeStr !== 'string') return 0;
  
  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  const multipliers = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
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