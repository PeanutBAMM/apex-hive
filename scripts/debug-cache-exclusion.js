#!/usr/bin/env node

// debug-cache-exclusion.js - Debug why cache exclusion isn't working for disk search

import { cachedSearch } from "../modules/cached-search.js";
import { fileCache } from "../modules/unified-cache.js";

/**
 * Debug cache exclusion logic to understand why disk hits are still high
 */
async function debugCacheExclusion() {
  console.log("🔍 DEBUG: Cache Exclusion Analysis");
  console.log("=" .repeat(50));
  
  try {
    // Run the actual cached search
    console.log("🚀 Running cached search for 'cache'...");
    const results = await cachedSearch("cache", {
      contentSearch: true,
      maxDiskResults: 500
    });
    
    console.log(`📊 Search Results:`);
    console.log(`  Cache hits: ${results.stats.cacheHits}`);
    console.log(`  Disk hits: ${results.stats.diskHits}`);
    console.log(`  Total matches: ${results.stats.totalMatches}`);
    console.log(`  Cache time: ${results.stats.cacheTime}ms`);
    console.log(`  Disk time: ${results.stats.diskTime}ms`);
    console.log();
    
    // Analyze cache results
    const cacheResults = results.results.filter(r => r.cached);
    const diskResults = results.results.filter(r => !r.cached);
    
    console.log("🔍 Cache Result Analysis:");
    console.log(`  Files found in cache: ${cacheResults.length}`);
    if (cacheResults.length > 0) {
      console.log("  Sample cache files:");
      cacheResults.slice(0, 3).forEach(r => {
        console.log(`    ${r.file} (${r.matches?.length || 0} matches)`);
      });
    }
    console.log();
    
    console.log("🔍 Disk Result Analysis:");
    console.log(`  Files found on disk: ${diskResults.length}`);
    if (diskResults.length > 0) {
      console.log("  Sample disk files:");
      diskResults.slice(0, 3).forEach(r => {
        console.log(`    ${r.file}`);
      });
    }
    console.log();
    
    // Check for overlap between cache and disk results
    const cacheFilePaths = new Set(cacheResults.map(r => r.file));
    const diskFilePaths = new Set(diskResults.map(r => r.file));
    
    // Check overlap by comparing normalized paths
    const overlaps = [];
    for (const diskPath of diskFilePaths) {
      // Check if this disk path matches any cached path
      for (const cachePath of cacheFilePaths) {
        // Different ways files might be stored vs found
        const normalizedDisk = diskPath.replace(/^\.\//, '');
        const normalizedCache = cachePath.replace(/^.*\/apex-hive\//, '');
        
        if (normalizedCache.endsWith(normalizedDisk) || normalizedDisk.endsWith(normalizedCache)) {
          overlaps.push({ disk: diskPath, cache: cachePath });
          break;
        }
      }
    }
    
    console.log("⚠️  OVERLAP ANALYSIS (files found in BOTH cache and disk):");
    console.log(`  Overlapping files: ${overlaps.length}`);
    if (overlaps.length > 0) {
      console.log("  Sample overlaps:");
      overlaps.slice(0, 5).forEach(overlap => {
        console.log(`    Cache: ${overlap.cache}`);
        console.log(`    Disk:  ${overlap.disk}`);
        console.log();
      });
      
      console.log(`🚨 EXCLUSION FAILURE: ${overlaps.length} files found in both cache AND disk!`);
      console.log(`   This explains why cache hit rate is low - exclusion patterns not working.`);
    } else {
      console.log("✅ No overlaps found - exclusion working correctly");
    }
    
    // Get all cache keys to see what formats we have
    const allCacheKeys = await fileCache.getAllKeys();
    console.log(`📊 Total cache entries: ${allCacheKeys.length}`);
    console.log(`   Cache search found: ${cacheResults.length} matches`);
    console.log(`   Efficiency: ${Math.round(cacheResults.length / allCacheKeys.length * 100)}%`);
    
  } catch (error) {
    console.error("❌ Error debugging cache exclusion:", error);
  }
}

// Run the debug
debugCacheExclusion().catch(console.error);