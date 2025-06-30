#!/usr/bin/env node
// test-integration.js - Comprehensive integration tests for Apex Hive

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const tests = [];
let passed = 0;
let failed = 0;

// Test helper
function test(name, fn) {
  tests.push({ name, fn });
}

// Run command helper
function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { shell: true });
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', data => stdout += data);
    proc.stderr.on('data', data => stderr += data);
    
    proc.on('close', code => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', reject);
  });
}

// Tests
test('Router initialization', async () => {
  const { default: ApexRouter } = await import('./apex-router.js');
  const router = new ApexRouter();
  await router.initialize();
  return router.modules.cache !== undefined;
});

test('Cache persistence patterns', async () => {
  const { default: ApexCache } = await import('./modules/cache.js');
  const cache = new ApexCache();
  
  // Test persistent patterns
  const tests = [
    { path: 'README.md', expected: true },
    { path: 'CLAUDE.md', expected: true },
    { path: 'docs/development/guide.md', expected: true },
    { path: 'random.txt', expected: false }
  ];
  
  for (const t of tests) {
    if (cache.isPersistent(t.path) !== t.expected) {
      throw new Error(`Pattern test failed for ${t.path}`);
    }
  }
  
  return true;
});

test('File operations with locks', async () => {
  const { default: FileOps } = await import('./modules/file-ops.js');
  const { default: ApexCache } = await import('./modules/cache.js');
  
  const cache = new ApexCache();
  const fileOps = new FileOps(cache);
  
  const testFile = 'test-fileops.tmp';
  const content = 'Test content';
  
  // Write
  await fileOps.write(testFile, content);
  
  // Read
  const read = await fileOps.read(testFile);
  
  // Update
  await fileOps.update(testFile, 'Test', 'Updated');
  const updated = await fileOps.read(testFile);
  
  // Clean up
  await fileOps.delete(testFile);
  
  return read === content && updated === 'Updated content';
});

test('RAG system search', async () => {
  const { default: RAGSystem } = await import('./modules/rag-system.js');
  const { default: ApexCache } = await import('./modules/cache.js');
  
  const cache = new ApexCache();
  const rag = new RAGSystem(cache);
  
  // Search for something that exists
  const result = await rag.search('router');
  
  return result.matches && result.matches.length > 0;
});

test('Git operations', async () => {
  const { default: GitOps } = await import('./modules/git-ops.js');
  const gitOps = new GitOps();
  
  const status = await gitOps.status();
  
  return status.branch && typeof status.clean === 'boolean';
});

test('Natural language routing', async () => {
  const { code, stdout } = await runCommand('node', ['index.js', '"fix de CI"']);
  
  return stdout.includes('recipe: \'fix-ci\'');
});

test('Recipe execution', async () => {
  const { default: ApexRouter } = await import('./apex-router.js');
  const router = new ApexRouter();
  await router.initialize();
  
  const result = await router.execute('fix-ci');
  
  return result.recipe === 'fix-ci';
});

test('Output formatting', async () => {
  const { formatOutput } = await import('./output-formatter.js');
  
  const searchResult = {
    query: 'test',
    files: ['file1.js', 'file2.js'],
    matches: [
      { file: 'file1.js', line: 10, text: 'test code' }
    ]
  };
  
  const formatted = await formatOutput(searchResult);
  
  return formatted.includes('Search: "test"') && formatted.includes('file1.js');
});

test('Error handling', async () => {
  const { default: ApexRouter } = await import('./apex-router.js');
  const router = new ApexRouter();
  await router.initialize();
  
  try {
    await router.execute('nonexistent-command');
    return false;
  } catch (error) {
    return error.message.includes('Unknown command');
  }
});

test('MCP server stdout protection', async () => {
  const { code, stdout } = await runCommand('timeout', ['1s', 'node', 'mcp-server.js']);
  
  return stdout.length === 0;
});

// Run all tests
async function runTests() {
  console.log('🧪 Running Apex Hive Integration Tests\n');
  
  for (const { name, fn } of tests) {
    process.stdout.write(`Testing ${name}... `);
    
    try {
      const start = Date.now();
      const result = await fn();
      const duration = Date.now() - start;
      
      if (result) {
        console.log(`✅ PASS (${duration}ms)`);
        passed++;
      } else {
        console.log(`❌ FAIL`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Test Summary');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round(passed / tests.length * 100)}%`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}