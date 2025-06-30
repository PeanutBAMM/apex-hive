#!/usr/bin/env node
// Minimal MCP server test to isolate the issue

// Redirect console.log to stderr immediately
console.log = console.error;

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

// Create minimal server
const server = new Server({
  name: 'test-minimal',
  version: '1.0.0'
}, {
  capabilities: { 
    tools: {} 
  }
});

// Single test tool
const TEST_TOOL = {
  name: 'test',
  description: 'Minimal test tool',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Test message'
      }
    },
    required: ['message']
  }
};

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [TEST_TOOL]
  };
});

// Handle tool call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'test') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { message } = request.params.arguments;
  
  // Return simple text response
  return {
    content: [{
      type: 'text',
      text: `Echo: ${message}`
    }]
  };
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

// Error handler
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});