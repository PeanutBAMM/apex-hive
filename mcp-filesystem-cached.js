#!/usr/bin/env node

// mcp-filesystem-cached.js - MCP server for filesystem operations with apex-hive cache integration

// Note: MaxListenersExceededWarning is handled by global warning-filter.js via NODE_OPTIONS

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, batchRead, batchWrite, cachedFind, cachedGrep } from './modules/file-ops.js';
import { promises as fs } from 'fs';
import path from 'path';
import {
  formatReadOperation,
  formatWriteOperation,
  formatEditOperation,
  formatListOperation,
  formatSearchOperation,
  formatBatchReadOperation,
  formatBatchWriteOperation,
  formatBatchEditOperation,
  formatInfoOperation,
  formatError
} from './modules/mcp-formatter-v2.js';

// Legacy formatter functions for migration
import { formatSize } from './modules/mcp-output-formatter.js';

// Helper for move operation
function makeClickable(path) {
  return path; // Simple path for now
}

// Silence console output to prevent stdout pollution
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = () => {};
console.error = () => {};

// Internal logging for debugging (writes to stderr when needed)
function debugLog(...args) {
  if (process.env.MCP_DEBUG) {
    originalConsoleError('[MCP-FS]', ...args);
  }
}

// Helper to determine if a read was cached
let lastReadTimes = new Map();

// Create server
const server = new Server({
  name: 'apex-hive-filesystem',
  version: '2.0.0'
}, {
  capabilities: { 
    tools: {} 
  }
});

// Define filesystem tools - matching official MCP filesystem server
const FILESYSTEM_TOOLS = [
  {
    name: 'read_file',
    description: 'Read file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File'
        },
        offset: {
          type: 'number',
          description: 'Start line'
        },
        limit: {
          type: 'number',
          description: 'Max lines'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'read_multiple_files',
    description: 'Read multiple files',
    inputSchema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files'
        },
        offset: {
          type: 'number',
          description: 'Start line'
        },
        limit: {
          type: 'number',
          description: 'Max lines'
        },
        full: {
          type: 'boolean',
          description: 'Full'
        }
      },
      required: ['paths']
    }
  },
  {
    name: 'create_directory',
    description: 'Create directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Dir'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'list_directory',
    description: 'List directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Dir'
        },
        verbose: {
          type: 'boolean',
          description: 'Verbose'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'move_file',
    description: 'Move file',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'From'
        },
        destination: {
          type: 'string',
          description: 'To'
        }
      },
      required: ['source', 'destination']
    }
  },
  {
    name: 'search_files',
    description: 'Search files',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Dir'
        },
        pattern: {
          type: 'string',
          description: 'Pattern'
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'grep_files',
    description: 'Search content',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Dir'
        },
        pattern: {
          type: 'string',
          description: 'Pattern'
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'grep_files',
    description: 'Search content',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Dir'
        },
        pattern: {
          type: 'string',
          description: 'Pattern'
        },
        ignoreCase: {
          type: 'boolean',
          description: 'Ignore case'
        },
        maxMatches: {
          type: 'number',
          description: 'Max matches'
        }
      },
      required: []
    }
  },
  {
    name: 'get_file_info',
    description: 'File info',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File'
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
  },
  {
    name: 'write_multiple_files',
    description: 'Write multiple files',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Object mapping paths to content'
        }
      },
      required: ['files']
    }
  },
  {
    name: 'edit_multiple_files',
    description: 'Edit multiple files',
    inputSchema: {
      type: 'object',
      properties: {
        edits: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                oldText: { type: 'string' },
                newText: { type: 'string' }
              },
              required: ['oldText', 'newText']
            }
          },
          description: 'Object mapping paths to edit arrays'
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview changes'
        }
      },
      required: ['edits']
    }
  }
];

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: FILESYSTEM_TOOLS
}));

// Format response with display override
function formatResponse(content, displaySummary, operation = 'default') {
  // For read operations: always return the actual content
  // This ensures Claude gets the file content needed for analysis
  if (operation === 'read' || operation === 'read_multiple') {
    return {
      content: [{
        type: 'text',
        text: content  // Always return requested lines/content for reads
      }]
    };
  }
  
  // For other operations (write/edit/list/etc): use summary if available
  // This saves tokens where full content isn't needed
  if (process.env.MCP_MINIMAL_OUTPUT !== 'false' && displaySummary) {
    return {
      content: [{
        type: 'text',
        text: displaySummary
      }]
    };
  }
  
  // Default: return full content
  return {
    content: [{
      type: 'text',
      text: content
    }]
  };
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'read_file': {
        const startTime = Date.now();
        
        // Use cached readFile from file-ops
        const result = await readFile(args.path);
        const fullContent = result.content;
        const fromCache = result.cached;
        
        // Apply offset/limit if specified (matching native Read behavior)
        let lines = fullContent.split('\n');
        const totalLines = lines.length;
        
        if (args.offset || args.limit) {
          const start = (args.offset || 1) - 1; // Convert to 0-based
          const end = args.limit ? start + args.limit : lines.length;
          lines = lines.slice(start, end);
        }
        
        // Format with line numbers for Claude's internal use
        const formattedLines = lines.map((line, index) => {
          const lineNum = (args.offset || 1) + index;
          return `${lineNum.toString().padStart(5)}→${line}`;
        });
        
        const readTime = Date.now() - startTime;
        
        // Create formatted output for display
        const summary = formatReadOperation(args.path, fullContent, {
          time: readTime,
          cached: fromCache
        });
        
        debugLog(`Read ${args.path}: ${readTime}ms, cached: ${fromCache}`);
        
        return formatResponse(formattedLines.join('\n'), summary, 'read');
      }
      
      case 'read_multiple_files': {
        const startTime = Date.now();
        
        // Default limit unless full content requested
        const limit = args.full ? undefined : (args.limit || 50);
        const offset = args.offset || 1;
        
        // Use batchRead for efficient cached reading
        const { results, errors, stats } = await batchRead(args.paths);
        
        const formattedFiles = [];
        const failures = [];
        const cacheStats = {};
        const truncatedFiles = [];
        
        for (const [filePath, content] of Object.entries(results)) {
          // Apply offset/limit if specified
          let lines = content.split('\n');
          const totalLines = lines.length;
          
          if (!args.full && limit) {
            const start = offset - 1;
            const end = start + limit;
            const wasLimited = end < totalLines;
            lines = lines.slice(start, end);
            
            if (wasLimited) {
              truncatedFiles.push(`${filePath} (showing ${lines.length}/${totalLines} lines)`);
            }
          }
          
          // Format with line numbers
          const formattedLines = lines.map((line, index) => {
            const lineNum = offset + index;
            return `${lineNum.toString().padStart(5)}→${line}`;
          });
          
          // Add file separator and content
          formattedFiles.push(`=== ${filePath} ===\n${formattedLines.join('\n')}`);
          
          // Track cache status
          cacheStats[filePath] = true;
        }
        
        for (const [filePath, error] of Object.entries(errors)) {
          failures.push(`${filePath}: ${error.message}`);
        }
        
        const batchTime = Date.now() - startTime;
        
        // Create formatted output
        const summary = formatBatchReadOperation(args.paths, results, errors, {
          time: batchTime,
          cacheHits: stats.cacheHits,
          diskReads: stats.diskReads,
          truncated: truncatedFiles.length
        });
        
        // Build response with compact summary at the top
        let response = summary;
        
        // Add file contents after the summary  
        if (formattedFiles.length > 0) {
          response += '\n' + formattedFiles.join('\n\n');
        }
        
        if (truncatedFiles.length > 0) {
          response += '\n\n[Files truncated at ' + limit + ' lines each: ' + truncatedFiles.join(', ') + ']';
        }
        
        if (failures.length > 0) {
          response += '\n\nFailed reads:\n' + failures.join('\n');
        }
        
        return formatResponse(response, null, 'read_multiple');
      }
      
      
      case 'create_directory': {
        const startTime = Date.now();
        await fs.mkdir(args.path, { recursive: true });
        const createTime = Date.now() - startTime;
        
        const summary = formatWriteOperation(args.path, '', {
          time: createTime,
          isDirectory: true
        });
        const nativeFormat = `Created directory: ${args.path}`;
        
        return formatResponse(nativeFormat, summary, 'create_directory');
      }
      
      case 'list_directory': {
        const startTime = Date.now();
        const entries = await fs.readdir(args.path, { withFileTypes: true });
        const listTime = Date.now() - startTime;
        
        // Create formatted output
        const summary = formatListOperation(args.path, entries, {
          time: listTime
        });
        
        if (args.verbose || !process.env.MCP_MINIMAL_OUTPUT) {
          // Full listing (native format)
          const formatted = entries.map(entry => {
            const prefix = entry.isDirectory() ? '[DIR]' : '[FILE]';
            return `${prefix} ${entry.name}`;
          }).sort();
          
          return formatResponse(formatted.join('\n'), summary, 'list');
        }
        
        // Minimal output only
        return formatResponse(summary, summary, 'list');
      }
      
      case 'move_file': {
        const startTime = Date.now();
        
        // Check if destination exists
        try {
          await fs.access(args.destination);
          throw new Error('Destination already exists');
        } catch (e) {
          if (e.code !== 'ENOENT') throw e;
        }
        
        await fs.rename(args.source, args.destination);
        const moveTime = Date.now() - startTime;
        
        const summary = formatWriteOperation(args.destination, '', {
          time: moveTime,
          moved: true,
          from: args.source
        });
        const nativeFormat = `Moved ${args.source} to ${args.destination}`;
        
        return formatResponse(nativeFormat, summary, 'move');
      }
      
      case 'search_files': {
        const startTime = Date.now();
        
        // Use cache-first find for filename search
        const searchResults = await cachedFind(args.pattern, {
          paths: [args.path],
          ignoreCase: true,
          excludePatterns: args.excludePatterns
        });
        
        const results = searchResults.files || [];
        const searchTime = Date.now() - startTime;
        
        // Create formatted output with cache stats
        const summary = formatSearchOperation(args.pattern, args.path, results, {
          time: searchTime,
          cacheHits: searchResults.stats?.cacheHits || 0,
          diskHits: searchResults.stats?.diskHits || 0
        });
        
        const nativeFormat = results.length > 0 
          ? results.join('\n')
          : 'No matches found';
        
        return formatResponse(nativeFormat, summary, 'search');
      }
      
      case 'grep_files': {
        const startTime = Date.now();
        
        // Use cache-first grep for content search
        const grepResults = await cachedGrep(args.pattern, {
          paths: [args.path || '.'],
          ignoreCase: args.ignoreCase !== false,
          maxMatches: args.maxMatches || 5,  // Good context per file, still token-efficient
          maxDiskResults: 500  // Limit only disk results, cache is unlimited!
        });
        
        const grepTime = Date.now() - startTime;
        
        // Format matches for display
        const formattedMatches = grepResults.matches.map(match => ({
          file: match.file,
          line: match.matches?.[0]?.line || match.line,
          text: match.matches?.[0]?.text || match.text,
          cached: match.cached
        }));
        
        // Create formatted output
        const summary = formatSearchOperation(args.pattern, args.path || '.', formattedMatches, {
          time: grepTime,
          cacheHits: grepResults.stats?.cacheHits || 0,
          diskHits: grepResults.stats?.diskHits || 0,
          isGrep: true
        });
        
        // Native format shows matches with context
        const nativeFormat = formattedMatches.length > 0
          ? formattedMatches.map(m => 
              `${m.file}:${m.line}: ${m.text}`
            ).join('\n')
          : 'No matches found';
        
        return formatResponse(nativeFormat, summary, 'grep');
      }
      
      case 'get_file_info': {
        const startTime = Date.now();
        const stats = await fs.stat(args.path);
        const infoTime = Date.now() - startTime;
        
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
        
        const summary = formatInfoOperation(args.path, info, {
          time: infoTime
        });
        const nativeFormat = JSON.stringify(info, null, 2);
        
        return formatResponse(nativeFormat, summary, 'info');
      }
      
      case 'list_allowed_directories': {
        // For now, return current working directory
        // Can be extended to support configured directories
        const dirs = [process.cwd()];
        const summary = formatListOperation('Allowed Directories', dirs.map(d => ({ name: d, isDirectory: () => true })), {});
        const nativeFormat = JSON.stringify(dirs, null, 2);
        
        return formatResponse(nativeFormat, summary, 'list_allowed');
      }
      
      case 'write_multiple_files': {
        const startTime = Date.now();
        
        // Use batchWrite from file-ops for efficient writing
        const { results, errors } = await batchWrite(args.files);
        const writeTime = Date.now() - startTime;
        
        // Format the response
        const summary = formatBatchWriteOperation(args.files, results, errors, {
          time: writeTime
        });
        
        // Create native-style response
        const successCount = results.length;
        const errorCount = Object.keys(errors).length;
        const nativeFormat = `Batch write completed: ${successCount} succeeded, ${errorCount} failed`;
        
        return formatResponse(nativeFormat, summary, 'batch_write');
      }
      
      case 'edit_multiple_files': {
        const startTime = Date.now();
        const results = {};
        const errors = {};
        const allEdits = [];
        
        // Process each file's edits
        for (const [filePath, edits] of Object.entries(args.edits)) {
          try {
            // Read file using cache
            let content = await readFile(filePath);
            let modified = content;
            const appliedEdits = [];
            
            // Apply edits in sequence
            for (const edit of edits) {
              if (modified.includes(edit.oldText)) {
                const regex = new RegExp(edit.oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                modified = modified.replace(regex, edit.newText);
                appliedEdits.push(edit);
              } else {
                throw new Error(`Text not found: "${edit.oldText.substring(0, 50)}..."`);
              }
            }
            
            // Write back if not dry run
            if (!args.dryRun) {
              await writeFile(filePath, modified);
            }
            
            results[filePath] = {
              editsApplied: appliedEdits.length,
              content: args.dryRun ? modified : undefined
            };
            allEdits.push({ filePath, edits: appliedEdits });
            
          } catch (error) {
            errors[filePath] = error.message;
          }
        }
        
        const editTime = Date.now() - startTime;
        
        // Format the response
        const summary = formatBatchEditOperation(args.edits, results, errors, {
          time: editTime,
          dryRun: args.dryRun
        });
        
        // Create native-style response
        const successCount = Object.keys(results).length;
        const errorCount = Object.keys(errors).length;
        const mode = args.dryRun ? ' (dry run)' : '';
        const nativeFormat = `Batch edit completed${mode}: ${successCount} files succeeded, ${errorCount} failed`;
        
        return formatResponse(nativeFormat, summary, 'batch_edit');
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorSummary = formatError(name, error, args.path || 'unknown');
    return formatResponse(`Error: ${error.message}`, errorSummary, 'error');
  }
});


// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  debugLog('MCP Filesystem server started with minimal output formatting');
}

main().catch((error) => {
  process.exit(1);
});