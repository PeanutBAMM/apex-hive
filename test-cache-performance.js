#!/usr/bin/env node

// test-cache-performance.js - Test the performance improvements from cached file operations

import { execSync } from "child_process";
import { performance } from "perf_hooks";

console.log("🧪 Testing Cache Performance Improvements\n");

// Test 1: Single command performance
console.log("Test 1: Single Command (quality:console-clean)");
console.log("=" .repeat(50));

const test1Start = performance.now();
try {
  execSync("apex quality:console-clean --dry-run", { stdio: "pipe" });
  const test1End = performance.now();
  console.log(`✅ Execution time: ${(test1End - test1Start).toFixed(2)}ms\n`);
} catch (error) {
  console.error("❌ Test 1 failed:", error.message);
}

// Test 2: Recipe performance (commit-push without actual commit)
console.log("Test 2: Recipe Performance (start-day)");
console.log("=" .repeat(50));

const test2Start = performance.now();
try {
  execSync("apex start-day", { stdio: "pipe" });
  const test2End = performance.now();
  console.log(`✅ Recipe execution time: ${(test2End - test2Start).toFixed(2)}ms\n`);
} catch (error) {
  console.error("❌ Test 2 failed:", error.message);
}

// Test 3: Cache hit rate
console.log("Test 3: Cache Statistics");
console.log("=" .repeat(50));

try {
  const cacheStats = execSync("node apex.js cache:status", { encoding: "utf8" });
  console.log("Cache status:");
  const statsData = JSON.parse(cacheStats);
  if (statsData.data) {
    console.log(`- Total items: ${statsData.data.totalItems}`);
    console.log(`- Total size: ${statsData.data.totalSize}`);
    console.log(`- Hit rate: ${statsData.data.averageHitRate}%`);
    console.log(`- Files cached: ${statsData.data.caches.files.items}`);
  }
} catch (error) {
  console.error("❌ Test 3 failed:", error.message);
}

// Test 4: Detect issues performance (biggest token user)
console.log("\nTest 4: Heavy Command Performance (detect-issues)");
console.log("=" .repeat(50));

const test4Start = performance.now();
try {
  execSync("apex detect-issues --page 1 --limit 5", { stdio: "pipe" });
  const test4End = performance.now();
  console.log(`✅ Execution time: ${(test4End - test4Start).toFixed(2)}ms\n`);
} catch (error) {
  console.error("❌ Test 4 failed:", error.message);
}

console.log("\n📊 Performance Summary");
console.log("=" .repeat(50));
console.log("All tests completed. Check execution times above.");
console.log("\n💡 Tips:");
console.log("- First run may be slower due to cache warming");
console.log("- Subsequent runs should show improved performance");
console.log("- Run 'apex cache:clear' to test cold cache performance");