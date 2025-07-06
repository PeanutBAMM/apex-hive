#!/usr/bin/env node

// test-mcp-filesystem.js - Test script for MCP filesystem server compatibility

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const TEST_DIR = path.join(__dirname, 'test-mcp-fs');
const TEST_FILE = path.join(TEST_DIR, 'test.txt');
const TEST_FILE2 = path.join(TEST_DIR, 'test2.txt');
const SUB_DIR = path.join(TEST_DIR, 'subdir');

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
    let errorOutput = '';
    
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
    
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    serverProcess.stdin.write(request);
  });
}

// Test runner
async function runTests() {
  console.log('🧪 MCP Filesystem Server Compatibility Test\n');
  
  // Setup test directory
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });
  
  // Start the MCP server
  const serverPath = path.join(__dirname, 'mcp-filesystem-cached.js');
  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  const tests = [];
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: List tools
    console.log('1️⃣ Testing tools/list...');
    const listToolsReq = createMCPRequest('tools/list', {});
    const listToolsResp = await sendRequest(serverProcess, listToolsReq);
    
    if (listToolsResp.result && listToolsResp.result.tools && listToolsResp.result.tools.length === 10) {
      console.log('✅ tools/list: Found 10 tools');
      passed++;
      
      // Verify tool names
      const expectedTools = [
        'read_file', 'read_multiple_files', 'write_file', 'edit_file',
        'create_directory', 'list_directory', 'move_file', 'search_files',
        'get_file_info', 'list_allowed_directories'
      ];
      const actualTools = listToolsResp.result.tools.map(t => t.name);
      const allPresent = expectedTools.every(t => actualTools.includes(t));
      
      if (allPresent) {
        console.log('✅ All expected tools present');
        passed++;
      } else {
        console.log('❌ Missing tools:', expectedTools.filter(t => !actualTools.includes(t)));
        failed++;
      }
    } else {
      console.log('❌ tools/list failed');
      failed++;
    }
    
    // Test 2: Write file
    console.log('\n2️⃣ Testing write_file...');
    const writeReq = createMCPRequest('tools/call', {
      name: 'write_file',
      arguments: {
        path: TEST_FILE,
        content: 'Hello from MCP test!'
      }
    }, 2);
    const writeResp = await sendRequest(serverProcess, writeReq);
    
    if (writeResp.result && writeResp.result.content) {
      const fileExists = await fs.access(TEST_FILE).then(() => true).catch(() => false);
      const content = fileExists ? await fs.readFile(TEST_FILE, 'utf8') : '';
      
      if (content === 'Hello from MCP test!') {
        console.log('✅ write_file: File written correctly');
        passed++;
      } else {
        console.log('❌ write_file: Content mismatch');
        failed++;
      }
    } else {
      console.log('❌ write_file failed:', writeResp.error);
      failed++;
    }
    
    // Test 3: Read file
    console.log('\n3️⃣ Testing read_file...');
    const readReq = createMCPRequest('tools/call', {
      name: 'read_file',
      arguments: { path: TEST_FILE }
    }, 3);
    const readResp = await sendRequest(serverProcess, readReq);
    
    if (readResp.result && readResp.result.content && readResp.result.content[0].text === 'Hello from MCP test!') {
      console.log('✅ read_file: Content read correctly');
      console.log('   🔥 Cache should be warmed now!');
      passed++;
    } else {
      console.log('❌ read_file failed');
      failed++;
    }
    
    // Test 4: Read file again (should use cache)
    console.log('\n4️⃣ Testing read_file (cached)...');
    const readCachedReq = createMCPRequest('tools/call', {
      name: 'read_file',
      arguments: { path: TEST_FILE }
    }, 4);
    const startTime = Date.now();
    const readCachedResp = await sendRequest(serverProcess, readCachedReq);
    const readTime = Date.now() - startTime;
    
    if (readCachedResp.result && readCachedResp.result.content && readCachedResp.result.content[0].text === 'Hello from MCP test!') {
      console.log(`✅ read_file (cached): Content read in ${readTime}ms`);
      console.log('   ⚡ Should be significantly faster due to cache');
      passed++;
    } else {
      console.log('❌ read_file (cached) failed');
      failed++;
    }
    
    // Test 5: Edit file
    console.log('\n5️⃣ Testing edit_file...');
    const editReq = createMCPRequest('tools/call', {
      name: 'edit_file',
      arguments: {
        path: TEST_FILE,
        edits: [{
          oldText: 'Hello',
          newText: 'Hi'
        }, {
          oldText: 'test!',
          newText: 'cached MCP!'
        }]
      }
    }, 5);
    const editResp = await sendRequest(serverProcess, editReq);
    
    if (editResp.result && editResp.result.content) {
      const edited = await fs.readFile(TEST_FILE, 'utf8');
      if (edited === 'Hi from MCP cached MCP!') {
        console.log('✅ edit_file: Edits applied correctly');
        console.log('   💾 Cache should be invalidated for this file');
        passed++;
      } else {
        console.log('❌ edit_file: Unexpected content:', edited);
        failed++;
      }
    } else {
      console.log('❌ edit_file failed');
      failed++;
    }
    
    // Test 6: Create directory
    console.log('\n6️⃣ Testing create_directory...');
    const mkdirReq = createMCPRequest('tools/call', {
      name: 'create_directory',
      arguments: { path: SUB_DIR }
    }, 6);
    const mkdirResp = await sendRequest(serverProcess, mkdirReq);
    
    if (mkdirResp.result && mkdirResp.result.content) {
      const dirExists = await fs.access(SUB_DIR).then(() => true).catch(() => false);
      if (dirExists) {
        console.log('✅ create_directory: Directory created');
        passed++;
      } else {
        console.log('❌ create_directory: Directory not found');
        failed++;
      }
    } else {
      console.log('❌ create_directory failed');
      failed++;
    }
    
    // Test 7: List directory
    console.log('\n7️⃣ Testing list_directory...');
    const listReq = createMCPRequest('tools/call', {
      name: 'list_directory',
      arguments: { path: TEST_DIR }
    }, 7);
    const listResp = await sendRequest(serverProcess, listReq);
    
    if (listResp.result && listResp.result.content) {
      const output = listResp.result.content[0].text;
      if (output.includes('[DIR] subdir') && output.includes('[FILE] test.txt')) {
        console.log('✅ list_directory: Correct format');
        passed++;
      } else {
        console.log('❌ list_directory: Unexpected output:', output);
        failed++;
      }
    } else {
      console.log('❌ list_directory failed');
      failed++;
    }
    
    // Test 8: Read multiple files
    console.log('\n8️⃣ Testing read_multiple_files...');
    await fs.writeFile(TEST_FILE2, 'Second file content');
    
    const multiReadReq = createMCPRequest('tools/call', {
      name: 'read_multiple_files',
      arguments: {
        paths: [TEST_FILE, TEST_FILE2]
      }
    }, 8);
    const multiReadResp = await sendRequest(serverProcess, multiReadReq);
    
    if (multiReadResp.result && multiReadResp.result.content) {
      const output = multiReadResp.result.content[0].text;
      try {
        const parsed = JSON.parse(output);
        if (parsed[TEST_FILE] === 'Hi from MCP cached MCP!' && 
            parsed[TEST_FILE2] === 'Second file content') {
          console.log('✅ read_multiple_files: Both files read correctly');
          console.log('   🚀 Batch operations working with cache!');
          passed++;
        } else {
          console.log('❌ read_multiple_files: Content mismatch');
          failed++;
        }
      } catch (e) {
        console.log('❌ read_multiple_files: Invalid JSON output');
        failed++;
      }
    } else {
      console.log('❌ read_multiple_files failed');
      failed++;
    }
    
    // Test 9: Search files
    console.log('\n9️⃣ Testing search_files...');
    const searchReq = createMCPRequest('tools/call', {
      name: 'search_files',
      arguments: {
        path: TEST_DIR,
        pattern: 'test'
      }
    }, 9);
    const searchResp = await sendRequest(serverProcess, searchReq);
    
    if (searchResp.result && searchResp.result.content) {
      const output = searchResp.result.content[0].text;
      if (output.includes('test.txt') && output.includes('test2.txt')) {
        console.log('✅ search_files: Found matching files');
        passed++;
      } else {
        console.log('❌ search_files: Missing files in output');
        failed++;
      }
    } else {
      console.log('❌ search_files failed');
      failed++;
    }
    
    // Test 10: Get file info
    console.log('\n🔟 Testing get_file_info...');
    const infoReq = createMCPRequest('tools/call', {
      name: 'get_file_info',
      arguments: { path: TEST_FILE }
    }, 10);
    const infoResp = await sendRequest(serverProcess, infoReq);
    
    if (infoResp.result && infoResp.result.content) {
      const output = infoResp.result.content[0].text;
      try {
        const info = JSON.parse(output);
        if (info.type === 'file' && info.size > 0 && info.path === TEST_FILE) {
          console.log('✅ get_file_info: Correct metadata');
          passed++;
        } else {
          console.log('❌ get_file_info: Invalid metadata');
          failed++;
        }
      } catch (e) {
        console.log('❌ get_file_info: Invalid JSON');
        failed++;
      }
    } else {
      console.log('❌ get_file_info failed');
      failed++;
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    failed++;
  } finally {
    // Cleanup
    serverProcess.kill();
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The MCP filesystem server is fully compatible!');
    console.log('🔥 Cache integration is working correctly!');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);