#!/usr/bin/env node

// debug-cache-coverage.js - Analyze why cache has so few files vs disk

import { execSync } from 'child_process';
import { fileCache } from "../modules/unified-cache.js";
import path from "path";

/**
 * Analyze cache coverage vs disk files to understand the gap
 */
async function debugCacheCoverage() {
  console.log("🔍 DEBUG: Cache Coverage Analysis");
  console.log("=" .repeat(60));
  
  try {
    // Get all files that ripgrep finds (with "cache" pattern)
    console.log("1️⃣ Getting all files that contain 'cache'...");
    const ripgrepOutput = execSync('rg cache . --files-with-matches', { encoding: 'utf8' });
    const diskFiles = ripgrepOutput.trim().split('\n').filter(f => f.trim());
    console.log(`📄 Files on disk with 'cache': ${diskFiles.length}`);
    
    // Get all cache keys
    console.log("2️⃣ Getting all cache entries...");
    const cacheKeys = await fileCache.getAllKeys();
    console.log(`💾 Cache entries: ${cacheKeys.length}`);
    
    // Filter cache keys to file-like entries
    const cacheFiles = cacheKeys.filter(key => {
      return key.startsWith('/') || key.includes('./') || key.includes('\\') || /\.[a-zA-Z0-9]{1,10}$/.test(key);
    });
    console.log(`📁 File-like cache entries: ${cacheFiles.length}`);
    
    console.log();
    console.log("3️⃣ COVERAGE ANALYSIS:");
    
    // Normalize paths for comparison
    const normalizedDiskFiles = new Set(diskFiles.map(f => {
      return f.startsWith('./') ? f : './' + f;
    }));
    
    const normalizedCacheFiles = new Set();
    cacheFiles.forEach(key => {
      // Convert absolute paths to relative
      if (key.includes('/apex-hive/')) {
        normalizedCacheFiles.add('./' + key.split('/apex-hive/')[1]);
      } else if (key.startsWith('./')) {
        normalizedCacheFiles.add(key);
      } else {
        normalizedCacheFiles.add(key);
      }
    });
    
    console.log(`📊 Normalized disk files: ${normalizedDiskFiles.size}`);
    console.log(`📊 Normalized cache files: ${normalizedCacheFiles.size}`);
    
    // Find files in disk but NOT in cache
    const uncachedFiles = [];
    for (const diskFile of normalizedDiskFiles) {
      if (!normalizedCacheFiles.has(diskFile)) {
        uncachedFiles.push(diskFile);
      }
    }
    
    // Find files in cache but NOT on disk
    const cachedOnlyFiles = [];
    for (const cacheFile of normalizedCacheFiles) {
      if (!normalizedDiskFiles.has(cacheFile)) {
        cachedOnlyFiles.push(cacheFile);
      }
    }
    
    // Find overlapping files
    const overlappingFiles = [];
    for (const diskFile of normalizedDiskFiles) {
      if (normalizedCacheFiles.has(diskFile)) {
        overlappingFiles.push(diskFile);
      }
    }
    
    console.log();
    console.log("📈 COVERAGE BREAKDOWN:");
    console.log(`✅ Files in BOTH cache and disk: ${overlappingFiles.length}`);
    console.log(`❌ Files on disk but NOT cached: ${uncachedFiles.length}`);
    console.log(`🗃️  Files cached but not on disk: ${cachedOnlyFiles.length}`);
    console.log();
    
    console.log(`🎯 CACHE COVERAGE: ${Math.round(overlappingFiles.length / normalizedDiskFiles.size * 100)}%`);
    console.log();
    
    if (uncachedFiles.length > 0) {
      console.log("❌ TOP 10 UNCACHED FILES (contain 'cache' but not in cache):");
      uncachedFiles.slice(0, 10).forEach((file, i) => {
        console.log(`   ${i + 1}. ${file}`);
      });
      console.log();
    }
    
    if (cachedOnlyFiles.length > 0) {
      console.log("🗃️  TOP 10 CACHE-ONLY FILES (in cache but don't contain 'cache'):");
      cachedOnlyFiles.slice(0, 10).forEach((file, i) => {
        console.log(`   ${i + 1}. ${file}`);
      });
      console.log();
    }
    
    // Analyze file types
    console.log("📊 UNCACHED FILE TYPES:");
    const uncachedTypes = {};
    uncachedFiles.forEach(file => {
      const ext = path.extname(file) || '[no extension]';
      uncachedTypes[ext] = (uncachedTypes[ext] || 0) + 1;
    });
    
    Object.entries(uncachedTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([ext, count]) => {
        console.log(`   ${ext}: ${count} files`);
      });
    
    console.log();
    console.log("🎯 ROOT CAUSE ANALYSIS:");
    if (uncachedFiles.length > overlappingFiles.length) {
      console.log(`❌ MAIN ISSUE: Cache missing ${uncachedFiles.length} files that contain 'cache'`);
      console.log(`   Cache coverage is only ${Math.round(overlappingFiles.length / normalizedDiskFiles.size * 100)}%`);
      console.log(`   Need to improve cache warming to include these file types/locations`);
    } else {
      console.log(`✅ Cache coverage is good: ${Math.round(overlappingFiles.length / normalizedDiskFiles.size * 100)}%`);
      console.log(`   The low cache hit rate might be due to other factors`);
    }
    
  } catch (error) {
    console.error("❌ Error analyzing cache coverage:", error);
  }
}

// Run the analysis
debugCacheCoverage().catch(console.error);