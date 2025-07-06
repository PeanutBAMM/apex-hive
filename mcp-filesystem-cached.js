#!/usr/bin/env node

// mcp-filesystem-cached.js - MCP server for filesystem operations with apex-hive cache integration

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, batchRead } from './modules/file-ops.js';
import { promises as fs } from 'fs';
import path from 'path';

// Silence console output to prevent stdout pollution
console.log = () => {};
console.error = () => {};

// Create server
const server = new Server({
  name: 'apex-hive-filesystem',
  version: '1.0.0'
}, {
  capabilities: { 
    tools: {} 
  }
});

// Define filesystem tools - matching official MCP filesystem server
const FILESYSTEM_TOOLS = [
  {
    name: 'read_file',
    description: 'Read complete contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'read_multiple_files',
    description: 'Read multiple files simultaneously',
    inputSchema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file paths to read'
        }
      },
      required: ['paths']
    }
  },
  {
    name: 'write_file',
    description: 'Create new file or overwrite existing',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to write the file'
        },
        content: {
          type: 'string',
          description: 'Content to write to the file'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Make selective edits using advanced pattern matching',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to edit'
        },
        edits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              oldText: { type: 'string' },
              newText: { type: 'string' }
            },
            required: ['oldText', 'newText']
          },
          description: 'Array of edit operations'
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview changes without applying them'
        }
      },
      required: ['path', 'edits']
    }
  },
  {
    name: 'create_directory',
    description: 'Create new directory or ensure it exists',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path of the directory to create'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'list_directory',
    description: 'List directory contents with [FILE] or [DIR] prefixes',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path of the directory to list'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'move_file',
    description: 'Move or rename files and directories',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'Source path'
        },
        destination: {
          type: 'string',
          description: 'Destination path'
        }
      },
      required: ['source', 'destination']
    }
  },
  {
    name: 'search_files',
    description: 'Recursively search for files/directories',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Starting directory for search'
        },
        pattern: {
          type: 'string',
          description: 'Search pattern (case-insensitive)'
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Patterns to exclude from search'
        }
      },
      required: ['path', 'pattern']
    }
  },
  {
    name: 'get_file_info',
    description: 'Get detailed file/directory metadata',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to get information about'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'list_allowed_directories',
    description: 'List all directories the server is allowed to access',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: FILESYSTEM_TOOLS
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'read_file': {
        // Use cached readFile from file-ops
        const content = await readFile(args.path);
        return {
          content: [{
            type: 'text',
            text: content
          }]
        };
      }
      
      case 'read_multiple_files': {
        // Use batchRead for efficient cached reading
        const { results, errors } = await batchRead(args.paths);
        
        const files = {};
        const failures = [];
        
        for (const [path, content] of Object.entries(results)) {
          files[path] = content;
        }
        
        for (const [path, error] of Object.entries(errors)) {
          failures.push(`${path}: ${error.message}`);
        }
        
        let response = JSON.stringify(files, null, 2);
        if (failures.length > 0) {
          response += '\n\nFailed reads:\n' + failures.join('\n');
        }
        
        return {
          content: [{
            type: 'text',
            text: response
          }]
        };
      }
      
      case 'write_file': {
        // Use cached writeFile from file-ops
        await writeFile(args.path, args.content);
        return {
          content: [{
            type: 'text',
            text: `Successfully wrote to ${args.path}`
          }]
        };
      }
      
      case 'edit_file': {
        // Read file using cache
        let content = await readFile(args.path);
        let modified = content;
        const appliedEdits = [];
        
        // Apply edits in sequence
        for (const edit of args.edits) {
          // Check if exact text exists
          if (modified.includes(edit.oldText)) {
            // Replace all occurrences
            const regex = new RegExp(edit.oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = modified.match(regex);
            const count = matches ? matches.length : 0;
            
            modified = modified.replace(regex, edit.newText);
            appliedEdits.push(`Replaced ${count} occurrence(s) of text`);
          } else {
            // Try to find similar text for better error message
            const lines = modified.split('\n');
            const lineWithSimilar = lines.findIndex(line => 
              line.includes(edit.oldText.trim()) || 
              line.includes(edit.oldText.substring(0, 20))
            );
            
            if (lineWithSimilar >= 0) {
              throw new Error(
                `Could not find exact text to replace.\n` +
                `Looking for: "${edit.oldText}"\n` +
                `Similar text found on line ${lineWithSimilar + 1}: "${lines[lineWithSimilar].trim()}"`
              );
            } else {
              throw new Error(`Could not find text to replace: "${edit.oldText.substring(0, 50)}..."`);
            }
          }
        }
        
        if (args.dryRun) {
          return {
            content: [{
              type: 'text',
              text: `Dry run - changes that would be made:\n${appliedEdits.join('\n')}\n\nResulting file:\n${modified}`
            }]
          };
        }
        
        // Write using cache (invalidates cache for this file)
        await writeFile(args.path, modified);
        return {
          content: [{
            type: 'text',
            text: `Successfully edited ${args.path}\n${appliedEdits.join('\n')}`
          }]
        };
      }
      
      case 'create_directory': {
        await fs.mkdir(args.path, { recursive: true });
        return {
          content: [{
            type: 'text',
            text: `Created directory: ${args.path}`
          }]
        };
      }
      
      case 'list_directory': {
        const entries = await fs.readdir(args.path, { withFileTypes: true });
        const formatted = entries.map(entry => {
          const prefix = entry.isDirectory() ? '[DIR]' : '[FILE]';
          return `${prefix} ${entry.name}`;
        }).sort();
        
        return {
          content: [{
            type: 'text',
            text: formatted.join('\n')
          }]
        };
      }
      
      case 'move_file': {
        // Check if destination exists
        try {
          await fs.access(args.destination);
          throw new Error('Destination already exists');
        } catch (e) {
          if (e.code !== 'ENOENT') throw e;
        }
        
        await fs.rename(args.source, args.destination);
        return {
          content: [{
            type: 'text',
            text: `Moved ${args.source} to ${args.destination}`
          }]
        };
      }
      
      case 'search_files': {
        const results = [];
        
        async function searchDir(dir) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            // Check excludePatterns
            if (args.excludePatterns?.some(pattern => 
              entry.name.toLowerCase().includes(pattern.toLowerCase())
            )) {
              continue;
            }
            
            // Check if matches pattern (case-insensitive)
            if (entry.name.toLowerCase().includes(args.pattern.toLowerCase())) {
              results.push(fullPath);
            }
            
            // Recurse into directories
            if (entry.isDirectory()) {
              try {
                await searchDir(fullPath);
              } catch (e) {
                // Skip inaccessible directories
              }
            }
          }
        }
        
        await searchDir(args.path);
        
        return {
          content: [{
            type: 'text',
            text: results.length > 0 
              ? results.join('\n')
              : 'No matches found'
          }]
        };
      }
      
      case 'get_file_info': {
        const stats = await fs.stat(args.path);
        const info = {
          path: args.path,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          accessed: stats.atime.toISOString(),
          permissions: stats.mode.toString(8).slice(-3),
          isReadOnly: (stats.mode & 0o200) === 0
        };
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(info, null, 2)
          }]
        };
      }
      
      case 'list_allowed_directories': {
        // For now, return current working directory
        // Can be extended to support configured directories
        return {
          content: [{
            type: 'text',
            text: JSON.stringify([process.cwd()], null, 2)
          }]
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});