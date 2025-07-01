#!/usr/bin/env node

// Test file-ops caching
import { readFile, batchRead } from "./modules/file-ops.js";
import { fileCache } from "./modules/unified-cache.js";

console.log("Testing file-ops cache...");

// Test 1: Read a file twice
console.log("\nTest 1: Reading same file twice");
const file1 = "./README.md";

console.time("First read");
const content1 = await readFile(file1);
console.timeEnd("First read");

console.time("Second read (should be cached)");
const content2 = await readFile(file1);
console.timeEnd("Second read (should be cached)");

console.log(`File size: ${content1.length} bytes`);
console.log(`Cache hit: ${content1 === content2}`);

// Get cache stats
const stats = await fileCache.stats();
console.log("\nCache stats after reads:");
console.log(`- Items: ${stats.items}`);
console.log(`- Hits: ${stats.hits}`);
console.log(`- Hit rate: ${stats.hitRate}%`);

// Test 2: Batch read
console.log("\nTest 2: Batch reading multiple files");
const files = ["./README.md", "./package.json", "./CLAUDE.md"];

console.time("Batch read");
const { results, errors } = await batchRead(files);
console.timeEnd("Batch read");

console.log(`Successfully read: ${Object.keys(results).length} files`);
console.log(`Errors: ${Object.keys(errors).length}`);

// Final stats
const finalStats = await fileCache.stats();
console.log("\nFinal cache stats:");
console.log(`- Items: ${finalStats.items}`);
console.log(`- Hits: ${finalStats.hits}`);
console.log(`- Hit rate: ${finalStats.hitRate}%`);