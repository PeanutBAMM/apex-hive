#!/usr/bin/env node

// debug-cache-keys.js - Debug cache key formats and content structure

import { fileCache } from "../modules/unified-cache.js";
import path from "path";

/**
 * Debug cache keys and content structure to understand why cache hits are low
 */
async function debugCacheKeys() {
  console.log("🔍 DEBUG: Cache Key Analysis");
  console.log("=" .repeat(50));
  
  try {
    // Get all cache keys
    const allKeys = await fileCache.getAllKeys();
    console.log(`📊 Total cache entries: ${allKeys.length}`);
    console.log();
    
    // Analyze key formats
    const keyAnalysis = {
      absolutePaths: 0,
      relativePaths: 0,
      windowsPaths: 0,
      other: 0,
      samples: {
        absolute: [],
        relative: [],
        windows: [],
        other: []
      }
    };
    
    // Current filtering logic from cached-search.js
    const currentlyFiltered = [];
    const currentlyAccepted = [];
    
    for (const key of allKeys) {
      // Analyze key format
      if (key.startsWith('/')) {
        keyAnalysis.absolutePaths++;
        if (keyAnalysis.samples.absolute.length < 3) {
          keyAnalysis.samples.absolute.push(key);
        }
      } else if (key.includes(':\\')) {
        keyAnalysis.windowsPaths++;
        if (keyAnalysis.samples.windows.length < 3) {
          keyAnalysis.samples.windows.push(key);
        }
      } else if (key.includes('/') || key.includes('\\')) {
        keyAnalysis.relativePaths++;
        if (keyAnalysis.samples.relative.length < 3) {
          keyAnalysis.samples.relative.push(key);
        }
      } else {
        keyAnalysis.other++;
        if (keyAnalysis.samples.other.length < 3) {
          keyAnalysis.samples.other.push(key);
        }
      }
      
      // Current filtering logic: Skip non-file entries
      if (!key.startsWith('/') && !key.includes(':\\')) {
        currentlyFiltered.push(key);
      } else {
        currentlyAccepted.push(key);
      }
    }
    
    // Print key format analysis
    console.log("📈 Key Format Analysis:");
    console.log(`  Absolute paths (starts with /): ${keyAnalysis.absolutePaths}`);
    console.log(`  Windows paths (contains :\\): ${keyAnalysis.windowsPaths}`);
    console.log(`  Relative paths: ${keyAnalysis.relativePaths}`);
    console.log(`  Other formats: ${keyAnalysis.other}`);
    console.log();
    
    // Print samples
    console.log("📝 Sample Keys:");
    if (keyAnalysis.samples.absolute.length > 0) {
      console.log("  Absolute paths:");
      keyAnalysis.samples.absolute.forEach(key => console.log(`    ${key}`));
    }
    if (keyAnalysis.samples.windows.length > 0) {
      console.log("  Windows paths:");
      keyAnalysis.samples.windows.forEach(key => console.log(`    ${key}`));
    }
    if (keyAnalysis.samples.relative.length > 0) {
      console.log("  Relative paths:");
      keyAnalysis.samples.relative.forEach(key => console.log(`    ${key}`));
    }
    if (keyAnalysis.samples.other.length > 0) {
      console.log("  Other formats:");
      keyAnalysis.samples.other.forEach(key => console.log(`    ${key}`));
    }
    console.log();
    
    // Current filtering impact
    console.log("🚨 CURRENT FILTERING IMPACT:");
    console.log(`  Keys ACCEPTED by current filter: ${currentlyAccepted.length}`);//

    console.log(`  Keys FILTERED OUT by current filter: ${currentlyFiltered.length}`);
    console.log(`  Acceptance rate: ${Math.round(currentlyAccepted.length / allKeys.length * 100)}%`);
    console.log();
    
    if (currentlyFiltered.length > 0) {
      console.log("⚠️  FILTERED OUT samples (these are LOST cache hits):");
      currentlyFiltered.slice(0, 5).forEach(key => console.log(`    ${key}`));
      if (currentlyFiltered.length > 5) {
        console.log(`    ... and ${currentlyFiltered.length - 5} more`);
      }
      console.log();
    }
    
    // Analyze content structure for a few entries
    console.log("🔍 Content Structure Analysis:");
    const contentSamples = currentlyAccepted.slice(0, 3);
    for (const key of contentSamples) {
      try {
        const content = await fileCache.get(key);
        const contentType = typeof content;
        const isString = contentType === 'string';
        const hasContentProperty = content && typeof content === 'object' && 'content' in content;
        
        console.log(`  Key: ${path.basename(key)}`);
        console.log(`    Type: ${contentType}`);
        console.log(`    Is string: ${isString}`);
        console.log(`    Has 'content' property: ${hasContentProperty}`);
        
        if (isString) {
          console.log(`    String length: ${content.length}`);
          console.log(`    First 100 chars: ${content.substring(0, 100).replace(/\n/g, '\\n')}`);
        } else if (hasContentProperty) {
          console.log(`    Content length: ${content.content?.length || 'N/A'}`);
          console.log(`    Content preview: ${content.content?.substring(0, 100).replace(/\n/g, '\\n') || 'N/A'}`);
        }
        console.log();
      } catch (error) {
        console.log(`    Error reading content: ${error.message}`);
      }
    }
    
    // Simulate "cache" search on filtered keys
    console.log("🔍 Simulate 'cache' search:");
    let cachePattern = /cache/gi;
    let simulatedCacheHits = 0;
    let simulatedFilteredHits = 0;
    
    for (const key of currentlyAccepted) {
      try {
        const content = await fileCache.get(key);
        if (!content) continue;
        
        const searchContent = typeof content === 'string' ? content : JSON.stringify(content);
        if (cachePattern.test(searchContent)) {
          simulatedCacheHits++;
        }
      } catch (e) {
        // Skip
      }
    }
    
    for (const key of currentlyFiltered) {
      try {
        const content = await fileCache.get(key);
        if (!content) continue;
        
        const searchContent = typeof content === 'string' ? content : JSON.stringify(content);
        if (cachePattern.test(searchContent)) {
          simulatedFilteredHits++;
        }
      } catch (e) {
        // Skip
      }
    }
    
    console.log(`  Hits in ACCEPTED keys: ${simulatedCacheHits}`);
    console.log(`  Hits in FILTERED keys: ${simulatedFilteredHits}`);
    console.log(`  Total potential hits: ${simulatedCacheHits + simulatedFilteredHits}`);
    console.log(`  Current miss rate: ${Math.round(simulatedFilteredHits / (simulatedCacheHits + simulatedFilteredHits) * 100)}%`);
    
  } catch (error) {
    console.error("❌ Error debugging cache keys:", error);
  }
}

// Run the debug
debugCacheKeys().catch(console.error);