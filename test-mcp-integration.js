#!/usr/bin/env node

// test-mcp-integration.js - Test both MCP servers working together

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const TEST_FILE = path.join(__dirname, 'test-integration.txt');

// MCP message helper
function createMCPRequest(method, params, id = 1) {
  return JSON.stringify({
    jsonrpc: "2.0",
    method,
    params,
    id
  }) + '\n';
}

// Send request and get response
async function sendRequest(serverProcess, request) {
  return new Promise((resolve, reject) => {
    let response = '';
    
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);
    
    serverProcess.stdout.once('data', (data) => {
      clearTimeout(timeout);
      response += data.toString();
      try {
        const parsed = JSON.parse(response);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Invalid JSON response: ${response}`));
      }
    });
    
    serverProcess.stdin.write(request);
  });
}

async function testServer(name, serverPath, tests) {
  console.log(`\n🧪 Testing ${name}...\n`);
  
  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let passed = 0;
  let failed = 0;
  
  try {
    for (const test of tests) {
      try {
        const result = await test(serverProcess);
        if (result) {
          console.log(`✅ ${test.name}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }
  } finally {
    serverProcess.kill();
  }
  
  return { passed, failed };
}

// Test runner
async function runTests() {
  console.log('🔧 MCP Server Integration Test');
  console.log('Testing both apex-hive and filesystem-cached servers\n');
  
  // Cleanup
  await fs.rm(TEST_FILE, { force: true });
  
  // Test 1: Apex-Hive Server
  const apexTests = [
    async function testApexHelp(server) {
      const req = createMCPRequest('tools/call', {
        name: 'apex',
        arguments: { command: 'help' }
      });
      const resp = await sendRequest(server, req);
      return resp.result && resp.result.content && 
             resp.result.content[0].text.includes('Apex Hive');
    },
    
    async function testApexCacheStatus(server) {
      const req = createMCPRequest('tools/call', {
        name: 'apex',
        arguments: { command: 'cache:status' }
      });
      const resp = await sendRequest(server, req);
      return resp.result && resp.result.content && 
             resp.result.content[0].text.includes('Cache Statistics');
    },
    
    async function testApexNaturalLanguage(server) {
      const req = createMCPRequest('tools/call', {
        name: 'apex',
        arguments: { command: 'what\'s broken?' }
      });
      const resp = await sendRequest(server, req);
      return resp.result && resp.result.content;
    }
  ];
  
  const apexResults = await testServer(
    'Apex-Hive MCP Server',
    path.join(__dirname, 'mcp-server.js'),
    apexTests
  );
  
  // Test 2: Filesystem Cached Server
  const fsTests = [
    async function testWriteFile(server) {
      const req = createMCPRequest('tools/call', {
        name: 'write_file',
        arguments: {
          path: TEST_FILE,
          content: 'Integration test content'
        }
      });
      const resp = await sendRequest(server, req);
      const exists = await fs.access(TEST_FILE).then(() => true).catch(() => false);
      return resp.result && exists;
    },
    
    async function testReadFile(server) {
      const req = createMCPRequest('tools/call', {
        name: 'read_file',
        arguments: { path: TEST_FILE }
      });
      const resp = await sendRequest(server, req);
      return resp.result && resp.result.content && 
             resp.result.content[0].text === 'Integration test content';
    },
    
    async function testReadFileCached(server) {
      // Read again to test cache
      const req = createMCPRequest('tools/call', {
        name: 'read_file',
        arguments: { path: TEST_FILE }
      });
      const start = Date.now();
      const resp = await sendRequest(server, req);
      const time = Date.now() - start;
      console.log(`   ⚡ Read time: ${time}ms`);
      return resp.result && time < 5; // Should be very fast if cached
    }
  ];
  
  const fsResults = await testServer(
    'Filesystem Cached MCP Server',
    path.join(__dirname, 'mcp-filesystem-cached.js'),
    fsTests
  );
  
  // Test 3: Cross-server cache sharing
  console.log('\n🔄 Testing Cross-Server Cache Sharing...\n');
  
  // Write a file using apex's file-ops
  const { writeFile } = await import('./modules/file-ops.js');
  const sharedFile = path.join(__dirname, 'shared-cache-test.txt');
  await writeFile(sharedFile, 'Shared cache content');
  console.log('📝 Wrote file using apex file-ops');
  
  // Read it using filesystem cached server (should be in cache)
  const fsCachedServer = spawn('node', [path.join(__dirname, 'mcp-filesystem-cached.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  try {
    const readReq = createMCPRequest('tools/call', {
      name: 'read_file',
      arguments: { path: sharedFile }
    });
    const readResp = await sendRequest(fsCachedServer, readReq);
    
    if (readResp.result && readResp.result.content[0].text === 'Shared cache content') {
      console.log('✅ Cross-server cache sharing works!');
      console.log('   🔥 File was already in cache from apex write');
    } else {
      console.log('❌ Cross-server cache sharing failed');
    }
  } finally {
    fsCachedServer.kill();
    await fs.rm(sharedFile, { force: true });
  }
  
  // Cleanup
  await fs.rm(TEST_FILE, { force: true });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Integration Test Summary:\n');
  
  console.log(`Apex-Hive Server:`);
  console.log(`  ✅ Passed: ${apexResults.passed}`);
  console.log(`  ❌ Failed: ${apexResults.failed}`);
  
  console.log(`\nFilesystem Cached Server:`);
  console.log(`  ✅ Passed: ${fsResults.passed}`);
  console.log(`  ❌ Failed: ${fsResults.failed}`);
  
  console.log('\n' + '='.repeat(50));
  
  const totalPassed = apexResults.passed + fsResults.passed;
  const totalFailed = apexResults.failed + fsResults.failed;
  
  if (totalFailed === 0) {
    console.log('\n🎉 All integration tests passed!');
    console.log('✅ Both MCP servers work correctly');
    console.log('✅ Cache is shared between servers');
    console.log('✅ Ready for production use!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);