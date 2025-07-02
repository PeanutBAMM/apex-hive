#!/usr/bin/env node

/**
 * Performance test runner to compare apex cache vs native operations
 */

import { execSync } from "child_process";

console.log("🏁 Performance Test Suite: Apex Cache vs Native Operations\n");

async function runTest(name, apexCommand, nativeScript) {
  console.log(`\n📊 Test: ${name}`);
  console.log("=".repeat(60));
  
  // Clear cache before each test set
  console.log("Clearing cache...");
  execSync("node apex-router.js cache:clear", { stdio: 'ignore' });
  
  // Run apex version (cold cache)
  console.log("\n1️⃣ Apex Version (Cold Cache):");
  const apexStart1 = Date.now();
  const apexResult1 = JSON.parse(execSync(`node apex-router.js ${apexCommand}`, { encoding: 'utf8' }));
  const apexTime1 = Date.now() - apexStart1;
  
  // Run apex version again (warm cache)
  console.log("\n2️⃣ Apex Version (Warm Cache):");
  const apexStart2 = Date.now();
  const apexResult2 = JSON.parse(execSync(`node apex-router.js ${apexCommand}`, { encoding: 'utf8' }));
  const apexTime2 = Date.now() - apexStart2;
  
  // Run native version
  console.log("\n3️⃣ Native Version (No Cache):");
  const nativeStart = Date.now();
  const nativeResult = JSON.parse(execSync(`node ${nativeScript}`, { encoding: 'utf8' }));
  const nativeTime = Date.now() - nativeStart;
  
  // Calculate improvements
  const coldVsNative = ((nativeTime - apexTime1) / nativeTime * 100).toFixed(1);
  const warmVsNative = ((nativeTime - apexTime2) / nativeTime * 100).toFixed(1);
  const cacheHitImprovement = ((apexTime1 - apexTime2) / apexTime1 * 100).toFixed(1);
  
  // Display results
  console.log("\n📈 Results:");
  console.log(`├─ Apex (cold):  ${apexTime1}ms ${apexResult1.data.performance ? `(${apexResult1.data.performance.filesRead || 0} files)` : ''}`);
  console.log(`├─ Apex (warm):  ${apexTime2}ms ${apexResult2.data.performance ? `(cache hits: ${apexResult2.data.performance.cacheHits || 'N/A'})` : ''}`);
  console.log(`├─ Native:       ${nativeTime}ms ${nativeResult.data.performance ? `(${nativeResult.data.performance.filesRead} files)` : ''}`);
  console.log(`├─ Cold vs Native: ${coldVsNative}% ${coldVsNative > 0 ? 'faster' : 'slower'}`);
  console.log(`├─ Warm vs Native: ${warmVsNative}% ${warmVsNative > 0 ? 'faster' : 'slower'}`);
  console.log(`└─ Cache benefit:  ${cacheHitImprovement}% improvement`);
  
  // Token comparison if available
  if (nativeResult.data.performance?.estimatedTokens) {
    const apexTokens = apexResult2.data.performance?.estimatedTokens || 0;
    const nativeTokens = nativeResult.data.performance.estimatedTokens;
    const tokenSavings = ((nativeTokens - apexTokens) / nativeTokens * 100).toFixed(1);
    console.log(`\n💰 Token Usage:`);
    console.log(`├─ Apex:   ${apexTokens.toLocaleString()} tokens`);
    console.log(`├─ Native: ${nativeTokens.toLocaleString()} tokens`);
    console.log(`└─ Savings: ${tokenSavings}% reduction`);
  }
  
  // Special notes for specific tests
  if (nativeResult.data.performance?.claudePatternOccurrences) {
    console.log(`\n⚠️  Claude Pattern: Read→Edit→Read→Edit occurred ${nativeResult.data.performance.claudePatternOccurrences} times`);
  }
  
  return {
    name,
    apexCold: apexTime1,
    apexWarm: apexTime2,
    native: nativeTime,
    improvement: warmVsNative,
    tokens: {
      apex: apexResult2.data.performance?.estimatedTokens || 0,
      native: nativeResult.data.performance?.estimatedTokens || 0
    }
  };
}

async function main() {
  const results = [];
  
  // Test 1: Cache warming READMEs
  results.push(await runTest(
    "Cache Warm READMEs",
    "cache:warm-readmes",
    "scripts/cache-warm-readmes-native.js"
  ));
  
  // Test 2: Detect issues
  results.push(await runTest(
    "Detect Issues",
    "detect-issues --limit 20",
    "scripts/detect-issues-native.js"
  ));
  
  // Test 3: Doc generate changed
  results.push(await runTest(
    "Doc Generate Changed",
    "doc:generate-changed --dry-run",
    "scripts/doc-generate-changed-native.js"
  ));
  
  // Test 4: Quality console clean (Claude pattern)
  results.push(await runTest(
    "Quality Console Clean",
    "quality:console-clean --dry-run",
    "scripts/quality-console-clean-native.js"
  ));
  
  // Test 5: Startup context
  results.push(await runTest(
    "Startup Context",
    "startup-context",
    "scripts/startup-context-native.js"
  ));
  
  // Final summary
  console.log("\n\n🏆 FINAL PERFORMANCE MATRIX");
  console.log("=".repeat(80));
  console.log("| Test                    | Apex Cold | Apex Warm | Native  | Improvement | Tokens Saved |");
  console.log("|" + "-".repeat(79) + "|");
  
  let totalTokensApex = 0;
  let totalTokensNative = 0;
  
  results.forEach(r => {
    const tokenSaved = r.tokens.native > 0 
      ? ((r.tokens.native - r.tokens.apex) / r.tokens.native * 100).toFixed(0) + '%'
      : 'N/A';
    
    console.log(
      `| ${r.name.padEnd(23)} | ${(r.apexCold + 'ms').padEnd(9)} | ${(r.apexWarm + 'ms').padEnd(9)} | ${(r.native + 'ms').padEnd(7)} | ${(r.improvement + '%').padEnd(11)} | ${tokenSaved.padEnd(12)} |`
    );
    
    totalTokensApex += r.tokens.apex;
    totalTokensNative += r.tokens.native;
  });
  
  console.log("|" + "-".repeat(79) + "|");
  
  const avgImprovement = (results.reduce((sum, r) => sum + parseFloat(r.improvement), 0) / results.length).toFixed(1);
  const totalTokenSaving = totalTokensNative > 0 
    ? ((totalTokensNative - totalTokensApex) / totalTokensNative * 100).toFixed(0)
    : 0;
  
  console.log(`\n📊 Summary:`);
  console.log(`├─ Average Performance Improvement: ${avgImprovement}%`);
  console.log(`├─ Total Tokens (Apex): ${totalTokensApex.toLocaleString()}`);
  console.log(`├─ Total Tokens (Native): ${totalTokensNative.toLocaleString()}`);
  console.log(`└─ Total Token Savings: ${totalTokenSaving}%`);
  
  console.log("\n✅ Performance tests completed!");
}

// Add error handling
process.on('unhandledRejection', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

main().catch(console.error);