#!/usr/bin/env node
// test-scripts.js - Comprehensive testing of all 20 implemented scripts

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const { default: ApexRouter } = await import('./apex-router.js');

// Test results storage
const results = {
  ci: [],
  core: [],
  doc: []
};

// Initialize router
const router = new ApexRouter();
await router.initialize();

// Helper to test a script
async function testScript(category, name, testCases) {
  console.log(`\n📋 Testing ${name}...`);
  const scriptResults = {
    name,
    tests: [],
    passed: 0,
    failed: 0
  };
  
  for (const testCase of testCases) {
    try {
      const start = Date.now();
      const result = await router.execute(testCase.command, testCase.args || {});
      const duration = Date.now() - start;
      
      // Basic validation
      const success = testCase.validate ? testCase.validate(result) : (result && !result.error);
      
      scriptResults.tests.push({
        name: testCase.name,
        success,
        duration,
        error: success ? null : 'Validation failed'
      });
      
      if (success) {
        console.log(`  ✅ ${testCase.name} (${duration}ms)`);
        scriptResults.passed++;
      } else {
        console.log(`  ❌ ${testCase.name} - Validation failed`);
        scriptResults.failed++;
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.name} - ${error.message}`);
      scriptResults.tests.push({
        name: testCase.name,
        success: false,
        error: error.message
      });
      scriptResults.failed++;
    }
  }
  
  results[category].push(scriptResults);
  return scriptResults;
}

// Test CI Scripts
console.log('\n🔧 Testing CI Scripts (6)');

await testScript('ci', 'ci-monitor', [
  {
    name: 'Basic status check',
    command: 'ci:monitor',
    validate: (result) => result && (result.status || result.message)
  }
]);

await testScript('ci', 'ci-parse', [
  {
    name: 'Parse empty logs',
    command: 'ci:parse',
    validate: (result) => result && Array.isArray(result.errors)
  },
  {
    name: 'Parse with sample log',
    command: 'ci:parse',
    args: { logs: 'Error: Test failed\nTypeError: undefined' },
    validate: (result) => result && result.errors && result.errors.length > 0
  }
]);

await testScript('ci', 'ci-fix', [
  {
    name: 'Fix without errors',
    command: 'ci:fix',
    validate: (result) => result && result.hasOwnProperty('fixed')
  }
]);

await testScript('ci', 'ci-heal', [
  {
    name: 'Self-heal check',
    command: 'ci:heal',
    validate: (result) => result && result.hasOwnProperty('healed')
  }
]);

await testScript('ci', 'ci-watch', [
  {
    name: 'Watch status',
    command: 'ci:watch',
    args: { once: true },
    validate: (result) => result !== undefined
  }
]);

await testScript('ci', 'ci-smart-push', [
  {
    name: 'Smart push check',
    command: 'ci:smart-push',
    args: { dryRun: true },
    validate: (result) => result && result.hasOwnProperty('canPush')
  }
]);

// Test Core Scripts
console.log('\n🔧 Testing Core Scripts (4)');

await testScript('core', 'test-runner', [
  {
    name: 'List available tests',
    command: 'test:run',
    args: { list: true },
    validate: (result) => result !== undefined
  }
]);

await testScript('core', 'search', [
  {
    name: 'Search for "router"',
    command: 'search',
    args: { query: 'router' },
    validate: (result) => result && result.matches
  },
  {
    name: 'Search with file pattern',
    command: 'search',
    args: { query: 'async', filePattern: '*.js' },
    validate: (result) => result && result.hasOwnProperty('matches')
  }
]);

await testScript('core', 'git-status', [
  {
    name: 'Get git status',
    command: 'git:status',
    validate: (result) => result && result.hasOwnProperty('branch')
  }
]);

await testScript('core', 'init-project', [
  {
    name: 'Init check',
    command: 'init',
    args: { check: true },
    validate: (result) => result !== undefined
  }
]);

// Test Doc Scripts
console.log('\n🔧 Testing Doc Scripts (10)');

await testScript('doc', 'doc-generate', [
  {
    name: 'Generate with dry run',
    command: 'doc:generate',
    args: { dryRun: true },
    validate: (result) => result && result.hasOwnProperty('wouldGenerate')
  }
]);

await testScript('doc', 'doc-update', [
  {
    name: 'Update check',
    command: 'doc:update',
    args: { check: true },
    validate: (result) => result !== undefined
  }
]);

await testScript('doc', 'doc-validate', [
  {
    name: 'Validate docs',
    command: 'doc:validate',
    validate: (result) => result && result.hasOwnProperty('valid')
  }
]);

await testScript('doc', 'doc-sync', [
  {
    name: 'Sync check',
    command: 'doc:sync',
    args: { dryRun: true },
    validate: (result) => result !== undefined
  }
]);

await testScript('doc', 'doc-organize', [
  {
    name: 'Organize check',
    command: 'doc:organize',
    args: { dryRun: true },
    validate: (result) => result !== undefined
  }
]);

await testScript('doc', 'doc-search', [
  {
    name: 'Search docs for "test"',
    command: 'doc:search',
    args: { query: 'test' },
    validate: (result) => result && result.hasOwnProperty('results')
  }
]);

await testScript('doc', 'doc-fix-links', [
  {
    name: 'Check links',
    command: 'doc:fix-links',
    args: { check: true },
    validate: (result) => result && result.hasOwnProperty('broken')
  }
]);

await testScript('doc', 'doc-check', [
  {
    name: 'Check documentation',
    command: 'doc:check',
    validate: (result) => result !== undefined
  }
]);

await testScript('doc', 'doc-add-xml', [
  {
    name: 'XML validation',
    command: 'doc:add-xml',
    args: { validate: true },
    validate: (result) => result !== undefined
  }
]);

await testScript('doc', 'doc-update-readme', [
  {
    name: 'README check',
    command: 'doc:update-readme',
    args: { check: true },
    validate: (result) => result !== undefined
  }
]);

// Generate summary
console.log('\n\n📊 Test Summary\n');

let totalPassed = 0;
let totalFailed = 0;
let totalScripts = 0;

for (const [category, scripts] of Object.entries(results)) {
  console.log(`\n${category.toUpperCase()} Scripts:`);
  for (const script of scripts) {
    totalScripts++;
    totalPassed += script.passed;
    totalFailed += script.failed;
    const status = script.failed === 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${script.name}: ${script.passed}/${script.tests.length} passed`);
  }
}

console.log('\n📈 Overall Results:');
console.log(`Total Scripts: ${totalScripts}`);
console.log(`Total Tests: ${totalPassed + totalFailed}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);
console.log(`Success Rate: ${Math.round(totalPassed / (totalPassed + totalFailed) * 100)}%`);

// Save detailed results
const detailedResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalScripts,
    totalTests: totalPassed + totalFailed,
    passed: totalPassed,
    failed: totalFailed,
    successRate: Math.round(totalPassed / (totalPassed + totalFailed) * 100)
  },
  categories: results
};

await fs.writeFile(
  'test-results.json',
  JSON.stringify(detailedResults, null, 2)
);

console.log('\n✅ Detailed results saved to test-results.json');

process.exit(totalFailed > 0 ? 1 : 0);