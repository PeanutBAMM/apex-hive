#!/usr/bin/env node
// Test MCP protocol directly

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

async function sendMessage(proc, message) {
  const jsonRpc = {
    jsonrpc: '2.0',
    id: message.id || Math.random().toString(36).substr(2, 9),
    ...message
  };
  
  const data = JSON.stringify(jsonRpc) + '\n';
  proc.stdin.write(data);
}

async function readResponse(proc) {
  return new Promise((resolve, reject) => {
    let data = '';
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for response'));
    }, 5000);
    
    proc.stdout.on('data', (chunk) => {
      data += chunk.toString();
      // Check if we have a complete JSON message
      try {
        const lines = data.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          clearTimeout(timeout);
          resolve(response);
        }
      } catch (e) {
        // Not yet complete JSON
      }
    });
  });
}

async function test() {
  console.log('Starting MCP protocol test...\n');
  
  // Start the MCP server
  const proc = spawn('node', ['mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  proc.stderr.on('data', (data) => {
    console.error('STDERR:', data.toString());
  });
  
  try {
    // Test 1: Initialize
    console.log('1. Sending initialize request...');
    await sendMessage(proc, {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });
    
    const initResponse = await readResponse(proc);
    console.log('Initialize response:', JSON.stringify(initResponse, null, 2));
    
    // Test 2: List tools
    console.log('\n2. Sending tools/list request...');
    await sendMessage(proc, {
      method: 'tools/list',
      params: {}
    });
    
    const toolsResponse = await readResponse(proc);
    console.log('Tools response:', JSON.stringify(toolsResponse, null, 2));
    
    // Test 3: Call tool
    console.log('\n3. Sending tools/call request...');
    await sendMessage(proc, {
      method: 'tools/call',
      params: {
        name: 'apex',
        arguments: {
          command: 'help'
        }
      }
    });
    
    const callResponse = await readResponse(proc);
    console.log('Call response:', JSON.stringify(callResponse, null, 2));
    
    // Clean up
    proc.kill();
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    proc.kill();
    process.exit(1);
  }
}

test();