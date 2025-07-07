#!/usr/bin/env node

// Silence all console output to prevent stdout pollution
console.log = () => {};
console.error = () => {};

// Note: MaxListenersExceededWarning is handled by global warning-filter.js via NODE_OPTIONS

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import ApexRouter from './apex-router.js';
import { formatOutput } from './output-formatter.js';

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

// Initialize router
let router;

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name !== 'apex') {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  const { command, args: cmdArgs = {} } = args;
  
  try {
    const result = await router.execute(command, cmdArgs);
    const formatted = await formatOutput(result, { command, args: cmdArgs });
    
    return {
      content: [{
        type: 'text',
        text: formatted
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    };
  }
});

// Start server
async function main() {
  // Initialize router before starting server
  router = new ApexRouter();
  await router.initialize();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});