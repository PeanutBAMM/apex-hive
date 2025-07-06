// cache-warm-js.js - Warm cache for all JavaScript files
import { glob } from "glob";
import { readFile } from "../modules/file-ops.js";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const { 
    dryRun = false,
    verbose = false,
    maxSize = 1048576  // 1MB default
  } = args;
  
  console.error("[CACHE-WARM-JS] Warming JavaScript files cache...");
  
  try {
    // Find all JS files dynamically
    const jsFiles = await glob("**/*.js", {
      ignore: ["node_modules/**", "dist/**", "build/**", ".git/**", "coverage/**"]
    });
    
    let cached = 0;
    let skipped = 0;
    let totalSize = 0;
    
    if (verbose) {
      console.error(`[CACHE-WARM-JS] Found ${jsFiles.length} JavaScript files`);
    }
    
    // Process in chunks of 20 files for memory safety
    const CHUNK_SIZE = 20;
    for (let i = 0; i < jsFiles.length; i += CHUNK_SIZE) {
      const chunk = jsFiles.slice(i, i + CHUNK_SIZE);
      
      for (const file of chunk) {
        try {
          // Check file size
          const stats = await fs.stat(file);
          
          if (stats.size > maxSize) {
            skipped++;
            if (verbose) {
              console.error(`[CACHE-WARM-JS] Skipped ${file}: Too large (${formatSize(stats.size)})`);
            }
            continue;
          }
          
          if (verbose) {
            console.error(`[CACHE-WARM-JS] Processing ${file} (${formatSize(stats.size)})`);
          }
          
          if (!dryRun) {
            // readFile automatically caches with the new 6-hour TTL
            await readFile(file);
          }
          
          cached++;
          totalSize += stats.size;
        } catch (error) {
          skipped++;
          if (verbose) {
            console.error(`[CACHE-WARM-JS] Skipped ${file}: ${error.message}`);
          }
        }
      }
      
      // Show progress for large operations
      if (verbose && i + CHUNK_SIZE < jsFiles.length) {
        console.error(`[CACHE-WARM-JS] Progress: ${i + CHUNK_SIZE}/${jsFiles.length} files processed`);
      }
    }
    
    return {
      success: true,
      dryRun,
      data: { 
        found: jsFiles.length,
        cached,
        skipped,
        totalSize: formatSize(totalSize)
      },
      message: dryRun 
        ? `Would cache ${cached} JavaScript files (${formatSize(totalSize)})`
        : `Cached ${cached} JavaScript files (${formatSize(totalSize)})`
    };
  } catch (error) {
    console.error("[CACHE-WARM-JS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm JavaScript cache"
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