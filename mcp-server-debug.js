#!/usr/bin/env node
// Debug version of MCP server that logs JSON-RPC messages

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, 'mcp-debug.log');

// Clear log file
fs.writeFileSync(logFile, '');

function debugLog(message) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

// Redirect console to prevent stdout pollution
console.log = () => {};
console.error = () => {};

debugLog('MCP Server starting...');

// Initialize server
const server = new Server({
  name: 'apex-hive-gateway',
  version: '1.0.0'
}, {
  capabilities: { 
    tools: {} 
  }
});

// Simple test tool
const APEX_TOOL = {
  name: 'apex',
  description: 'Execute Apex Hive commands',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute'
      }
    },
    required: ['command']
  }
};

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  debugLog(`ListTools request: ${JSON.stringify(request)}`);
  const response = {
    tools: [APEX_TOOL]
  };
  debugLog(`ListTools response: ${JSON.stringify(response)}`);
  return response;
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  debugLog(`CallTool request: ${JSON.stringify(request)}`);
  
  if (request.params.name !== 'apex') {
    const errorResponse = {
      content: [{
        type: 'text',
        text: `Unknown tool: ${request.params.name}`
      }],
      isError: true
    };
    debugLog(`CallTool error response: ${JSON.stringify(errorResponse)}`);
    return errorResponse;
  }

  const { command } = request.params.arguments;
  
  // Simple response without actual execution
  const response = {
    content: [{
      type: 'text',
      text: `Mock response for command: ${command}`
    }]
  };
  
  debugLog(`CallTool response: ${JSON.stringify(response)}`);
  return response;
});

// Create custom transport that logs messages
class LoggingStdioServerTransport extends StdioServerTransport {
  async start() {
    debugLog('Transport starting...');
    await super.start();
    debugLog('Transport started');
  }
  
  async send(message) {
    debugLog(`Sending message: ${JSON.stringify(message)}`);
    await super.send(message);
  }
}

// Connect transport
debugLog('Creating transport...');
const transport = new LoggingStdioServerTransport();
debugLog('Connecting server to transport...');
await server.connect(transport);
debugLog('Server connected');

// Handle errors
process.on('unhandledRejection', (error) => {
  debugLog(`Unhandled rejection: ${error.message}\n${error.stack}`);
  process.exit(1);
});

debugLog('Server ready');