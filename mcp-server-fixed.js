#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

// Create server
const server = new Server({
  name: 'apex-hive-gateway',
  version: '1.0.0'
}, {
  capabilities: { 
    tools: {} 
  }
});

// Define tool
const APEX_TOOL = {
  name: 'apex',
  description: 'Execute Apex Hive commands with natural language support',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute (supports natural language)'
      },
      args: {
        type: 'object',
        description: 'Optional arguments for the command',
        additionalProperties: true
      }
    },
    required: ['command']
  }
};

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [APEX_TOOL]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name !== 'apex') {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  const { command, args: cmdArgs = {} } = args;
  
  // For now, just return a simple response
  // We'll add the router later once basic MCP is working
  return {
    content: [{
      type: 'text',
      text: `Apex command received: ${command}\nArgs: ${JSON.stringify(cmdArgs)}`
    }]
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});