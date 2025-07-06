// cache-warm-all-docs.js - Warm cache for all documentation files
import { glob } from "glob";
import { readFile } from "../modules/file-ops.js";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const { 
    dryRun = false,
    verbose = false,
    maxSize = 1048576,  // 1MB default
    encoding = "utf8"
  } = args;
  
  console.error("[CACHE-WARM-ALL-DOCS] Warming all documentation cache...");
  
  try {
    // Find all MD files dynamically
    const mdFiles = await glob("**/*.md", {
      ignore: ["node_modules/**", "dist/**", "build/**", ".git/**"]
    });
    
    let cached = 0;
    let skipped = 0;
    let totalSize = 0;
    const categoryStats = {};
    
    if (verbose) {
      console.error(`[CACHE-WARM-ALL-DOCS] Found ${mdFiles.length} documentation files`);
    }
    
    // Process in chunks for memory safety
    const CHUNK_SIZE = 20;
    for (let i = 0; i < mdFiles.length; i += CHUNK_SIZE) {
      const chunk = mdFiles.slice(i, i + CHUNK_SIZE);
      
      for (const file of chunk) {
        try {
          const stats = await fs.stat(file);
          
          // Skip files that are too large
          if (stats.size > maxSize) {
            skipped++;
            if (verbose) {
              console.error(`[CACHE-WARM-ALL-DOCS] Skipped ${file}: Too large (${formatSize(stats.size)} > ${formatSize(maxSize)})`);
            }
            continue;
          }
          
          // Determine category based on path
          const category = determineCategory(file);
          categoryStats[category] = (categoryStats[category] || 0) + 1;
          
          if (verbose) {
            console.error(`[CACHE-WARM-ALL-DOCS] Processing ${file} (${formatSize(stats.size)}, category: ${category})`);
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
            console.error(`[CACHE-WARM-ALL-DOCS] Skipped ${file}: ${error.message}`);
          }
        }
      }
      
      // Show progress for large operations
      if (verbose && i + CHUNK_SIZE < mdFiles.length) {
        console.error(`[CACHE-WARM-ALL-DOCS] Progress: ${i + CHUNK_SIZE}/${mdFiles.length} files processed`);
      }
    }
    
    if (verbose && Object.keys(categoryStats).length > 0) {
      console.error(`[CACHE-WARM-ALL-DOCS] Category breakdown:`, categoryStats);
    }
    
    return {
      success: true,
      dryRun,
      data: { 
        found: mdFiles.length,
        cached,
        skipped,
        totalSize: formatSize(totalSize),
        categoryStats
      },
      message: dryRun 
        ? `Would cache ${cached} documentation files (${formatSize(totalSize)})`
        : `Cached ${cached} documentation files (${formatSize(totalSize)})`
    };
  } catch (error) {
    console.error("[CACHE-WARM-ALL-DOCS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm documentation cache"
    };
  }
}

function determineCategory(filePath) {
  if (filePath.includes("/docs/")) {
    if (filePath.includes("/architecture/")) return "architecture";
    if (filePath.includes("/getting-started/")) return "getting-started";
    if (filePath.includes("/development/")) return "development";
    if (filePath.includes("/troubleshooting/")) return "troubleshooting";
    if (filePath.includes("/reference/")) return "reference";
    if (filePath.includes("/guides/")) return "guides";
    if (filePath.includes("/misc/")) return "misc";
    if (filePath.includes("/conversations/")) return "conversations";
    return "docs-other";
  }
  if (filePath.toUpperCase().includes("README")) return "readme";
  if (filePath.toUpperCase().includes("CHANGELOG")) return "changelog";
  if (filePath.toUpperCase().includes("LICENSE")) return "license";
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