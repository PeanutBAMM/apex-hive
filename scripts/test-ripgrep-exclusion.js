#!/usr/bin/env node

// test-ripgrep-exclusion.js - Test ripgrep exclusion patterns directly

import { execSync } from 'child_process';
import { fileCache } from "../modules/unified-cache.js";

/**
 * Test ripgrep exclusion patterns to understand why they're not working
 */
async function testRipgrepExclusion() {
  console.log("🔍 Testing Ripgrep Exclusion Patterns");
  console.log("=" .repeat(50));
  
  try {
    // Get cache results for comparison
    const cacheKeys = await fileCache.getAllKeys();
    const sampleCacheFiles = cacheKeys
      .filter(key => key.includes('/apex-hive/'))
      .slice(0, 5)
      .map(key => './' + key.split('/apex-hive/')[1]);
    
    console.log("📂 Sample cache files (converted to relative):");
    sampleCacheFiles.forEach(file => console.log(`   ${file}`));
    console.log();
    
    // Test 1: No exclusions
    console.log("1️⃣ Test: No exclusions");
    const noExclusions = execSync('rg cache . --json', { encoding: 'utf8' });
    const noExclusionLines = noExclusions.split('\n').filter(line => {
      try {
        const parsed = JSON.parse(line);
        return parsed.type === 'match';
      } catch { return false; }
    });
    console.log(`   Matches found: ${noExclusionLines.length}`);
    
    // Test 2: Single file exclusion
    console.log("2️⃣ Test: Single file exclusion (./CLAUDE.md)");
    try {
      const singleExclusion = execSync("rg cache . --json --glob '!./CLAUDE.md'", { encoding: 'utf8' });
      const singleExclusionLines = singleExclusion.split('\n').filter(line => {
        try {
          const parsed = JSON.parse(line);
          return parsed.type === 'match';
        } catch { return false; }
      });
      console.log(`   Matches found: ${singleExclusionLines.length}`);
    } catch (error) {
      console.log(`   Error or no matches: ${error.message.split('\n')[0]}`);
    }
    
    // Test 3: Multiple file exclusions (like our cache would do)
    const excludePattern = sampleCacheFiles.map(f => `--glob '!${f}'`).join(' ');
    console.log("3️⃣ Test: Multiple file exclusions");
    console.log(`   Exclude pattern: ${excludePattern}`);
    
    try {
      const multiExclusion = execSync(`rg cache . --json ${excludePattern}`, { encoding: 'utf8' });
      const multiExclusionLines = multiExclusion.split('\n').filter(line => {
        try {
          const parsed = JSON.parse(line);
          return parsed.type === 'match';
        } catch { return false; }
      });
      console.log(`   Matches found: ${multiExclusionLines.length}`);
    } catch (error) {
      console.log(`   Error or no matches: ${error.message.split('\n')[0]}`);
    }
    
    // Test 4: Check if excluded files actually contain "cache"
    console.log("4️⃣ Test: Check if excluded files contain 'cache'");
    let actualMatches = 0;
    for (const file of sampleCacheFiles) {
      try {
        const fileContent = execSync(`rg cache "${file}"`, { encoding: 'utf8' });
        if (fileContent.trim()) {
          actualMatches++;
          console.log(`   ✅ ${file} contains "cache"`);
        }
      } catch {
        console.log(`   ❌ ${file} does NOT contain "cache"`);
      }
    }
    console.log(`   Files that actually contain "cache": ${actualMatches}/${sampleCacheFiles.length}`);
    
    // Test 5: Test exclusion pattern syntax variations
    console.log("5️⃣ Test: Different exclusion syntax");
    
    const testFile = './CLAUDE.md';
    const variations = [
      `--glob '!${testFile}'`,
      `--glob='!${testFile}'`,
      `--exclude '${testFile}'`
    ];
    
    for (const variation of variations) {
      try {
        const result = execSync(`rg cache . --json ${variation}`, { encoding: 'utf8' });
        const lines = result.split('\n').filter(line => {
          try {
            const parsed = JSON.parse(line);
            return parsed.type === 'match';
          } catch { return false; }
        });
        console.log(`   ${variation}: ${lines.length} matches`);
      } catch (error) {
        console.log(`   ${variation}: Error or no matches`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error testing ripgrep exclusion:", error);
  }
}

// Run the test
testRipgrepExclusion().catch(console.error);