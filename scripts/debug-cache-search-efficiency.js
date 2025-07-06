#!/usr/bin/env node

// debug-cache-search-efficiency.js - Analyze why cache search only finds 147/324 entries

import { fileCache } from "../modules/unified-cache.js";
import { searchInCache } from "../modules/cached-search.js";

/**
 * Deep analysis of cache search efficiency
 */
async function debugCacheSearchEfficiency() {
  console.log("🔍 DEBUG: Cache Search Efficiency Analysis");
  console.log("=" .repeat(60));
  
  try {
    // Get all cache keys
    const allKeys = await fileCache.getAllKeys();
    console.log(`📊 Total cache entries: ${allKeys.length}`);
    
    // Run cache search for "cache" pattern
    console.log("🚀 Running cache search for pattern 'cache'...");
    const cacheResults = await searchInCache("cache", {
      contentSearch: true,
      ignoreCase: true,
      maxMatches: 5
    });
    
    console.log(`✅ Cache search found: ${cacheResults.results.length} matches`);
    console.log(`⚡ Search efficiency: ${Math.round(cacheResults.results.length / allKeys.length * 100)}%`);
    console.log();
    
    // Analyze what was found vs not found
    const foundKeys = new Set(cacheResults.results.map(r => r.file));
    const notFoundKeys = allKeys.filter(key => !foundKeys.has(key));
    
    console.log("📈 Found vs Not Found Analysis:");
    console.log(`  Found: ${foundKeys.size}`);
    console.log(`  Not found: ${notFoundKeys.length}`);
    console.log();
    
    // Analyze the first 10 not-found keys to understand why
    console.log("🔍 Analysis of NOT FOUND keys (first 10):");
    for (let i = 0; i < Math.min(10, notFoundKeys.length); i++) {
      const key = notFoundKeys[i];
      try {
        const cachedData = await fileCache.get(key);
        
        // Check if key passes current filtering
        const passesFilter = isFileKey(key);
        
        // Check if content contains "cache"
        const content = extractContent(cachedData);
        const containsCache = /cache/i.test(content);
        
        console.log(`  ${i + 1}. Key: ${key}`);
        console.log(`     Passes filter: ${passesFilter}`);
        console.log(`     Contains "cache": ${containsCache}`);
        console.log(`     Content length: ${content.length}`);
        console.log(`     Content preview: ${content.substring(0, 100).replace(/\n/g, '\\n')}...`);
        console.log();
        
        if (!passesFilter && containsCache) {
          console.log(`⚠️  MISSED HIT: Key filtered out but contains "cache"!`);
        }
        
      } catch (error) {
        console.log(`     Error reading: ${error.message}`);
      }
    }
    
    // Count how many filtered keys actually contain "cache"
    let missedHits = 0;
    let checkedKeys = 0;
    
    console.log("🔍 Scanning ALL not-found keys for missed 'cache' matches...");
    for (const key of notFoundKeys) {
      try {
        const cachedData = await fileCache.get(key);
        const content = extractContent(cachedData);
        
        if (/cache/i.test(content)) {
          missedHits++;
          const passesFilter = isFileKey(key);
          if (!passesFilter) {
            console.log(`⚠️  FILTER MISS: ${key} (contains cache but filtered out)`);
          }
        }
        checkedKeys++;
        
        // Progress indicator
        if (checkedKeys % 50 === 0) {
          console.log(`   Checked ${checkedKeys}/${notFoundKeys.length} keys...`);
        }
      } catch (error) {
        // Skip invalid entries
      }
    }
    
    console.log();
    console.log("📊 FINAL ANALYSIS:");
    console.log(`  Current cache hits: ${foundKeys.size}`);
    console.log(`  Missed cache hits: ${missedHits}`);
    console.log(`  Potential total hits: ${foundKeys.size + missedHits}`);
    console.log(`  Potential efficiency: ${Math.round((foundKeys.size + missedHits) / allKeys.length * 100)}%`);
    console.log();
    
    if (missedHits > 0) {
      console.log(`🎯 TARGET: Fix filtering to capture ${missedHits} missed hits`);
      console.log(`   This would bring us from ${Math.round(foundKeys.size / allKeys.length * 100)}% to ${Math.round((foundKeys.size + missedHits) / allKeys.length * 100)}% efficiency`);
    }
    
  } catch (error) {
    console.error("❌ Error analyzing cache search efficiency:", error);
  }
}

// Helper functions (duplicated from cached-search.js for this debug)
function isFileKey(key) {
  // Accept absolute paths (Linux/WSL)
  if (key.startsWith('/')) return true;
  
  // Accept Windows paths
  if (key.includes(':\\')) return true;
  
  // Accept relative paths that look like files
  if (key.includes('./') || key.includes('../')) return true;
  
  // Accept paths with file extensions
  if (/\.[a-zA-Z0-9]{1,10}$/.test(key)) return true;
  
  // Accept specific prefixed keys that contain file paths
  if (key.startsWith('script:')) return true;
  if (key.startsWith('docs/') || key.includes('/docs/')) return true;
  
  // Accept any key that contains a path separator (likely a file)
  if (key.includes('/') || key.includes('\\')) return true;
  
  // For now, be very liberal - only skip obvious non-file keys
  if (key === 'config:recipes' || key.startsWith('config:') && !key.includes('/')) return false;
  
  // Default: accept (better to have false positives than miss cache hits)
  return true;
}

function extractContent(cachedData) {
  // If it's already a string, use as-is
  if (typeof cachedData === 'string') {
    return cachedData;
  }
  
  // If it's an object with 'content' property, use that
  if (cachedData && typeof cachedData === 'object' && 'content' in cachedData) {
    return typeof cachedData.content === 'string' ? cachedData.content : '';
  }
  
  // Fallback: stringify the whole object
  return JSON.stringify(cachedData);
}

// Run the analysis
debugCacheSearchEfficiency().catch(console.error);