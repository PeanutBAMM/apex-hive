#!/usr/bin/env node

// mcp-filesystem-cached.js - MCP server for filesystem operations with apex-hive cache integration

// Fix MaxListenersExceededWarning for MCP servers
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 20;
process.setMaxListeners(20);

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, batchRead, cachedFind, cachedGrep } from './modules/file-ops.js';
import { promises as fs } from 'fs';
import path from 'path';
import {
  formatReadOperation,
  formatWriteOperation,
  formatEditOperation,
  formatListOperation,
  formatSearchOperation,
  formatBatchReadOperation,
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
    description: 'Read complete contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read'
        },
        offset: {
          type: 'number',
          description: 'Line number to start reading from (1-based)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to read'
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
        },
        offset: {
          type: 'number',
          description: 'Line number to start reading from (1-based) for all files'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to read per file (default: 50)'
        },
        full: {
          type: 'boolean',
          description: 'Read full content of all files (overrides limit)'
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
        },
        verbose: {
          type: 'boolean',
          description: 'Show full listing instead of summary'
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
    description: 'Recursively search for files/directories by name',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Starting directory for search'
        },
        pattern: {
          type: 'string',
          description: 'Filename pattern (case-insensitive)'
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
    name: 'grep_files',
    description: 'Search file contents using cache-first approach (super fast)',
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
    name: 'grep_files',
    description: 'Search file contents using cache-first approach (super fast)',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Starting directory for search'
        },
        pattern: {
          type: 'string',
          description: 'Content pattern to search for'
        },
        ignoreCase: {
          type: 'boolean',
          description: 'Case-insensitive search (default: true)'
        },
        maxMatches: {
          type: 'number',
          description: 'Maximum matches per file (default: 5)'
        }
      },
      required: ['pattern']
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
        const fullContent = await readFile(args.path);
        
        // Check if this was a cache hit
        const lastTime = lastReadTimes.get(args.path) || 0;
        const timeSinceLastRead = Date.now() - lastTime;
        const fromCache = timeSinceLastRead < 1000; // If read within 1s, likely cached
        lastReadTimes.set(args.path, Date.now());
        
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
        const { results, errors } = await batchRead(args.paths);
        
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
          cached: cacheStats,
          truncated: truncatedFiles.length
        });
        
        // Build response with formatted content
        let response = formattedFiles.join('\n\n');
        
        if (truncatedFiles.length > 0) {
          response += '\n\n[Files truncated at ' + limit + ' lines each: ' + truncatedFiles.join(', ') + ']';
        }
        
        if (failures.length > 0) {
          response += '\n\nFailed reads:\n' + failures.join('\n');
        }
        
        return formatResponse(response, summary, 'read_multiple');
      }
      
      case 'write_file': {
        const startTime = Date.now();
        
        // Use cached writeFile from file-ops
        await writeFile(args.path, args.content);
        
        const writeTime = Date.now() - startTime;
        
        // Create formatted output for display
        const summary = formatWriteOperation(args.path, args.content, {
          time: writeTime
        });
        
        // Return format matching native Write tool
        const nativeFormat = `File created successfully at: ${args.path}`;
        
        return formatResponse(nativeFormat, summary, 'write');
      }
      
      case 'edit_file': {
        const startTime = Date.now();
        const readStart = Date.now();
        
        // Read file using cache
        let content = await readFile(args.path);
        const cachedRead = (Date.now() - readStart) < 5; // If <5ms, likely cached
        
        let modified = content;
        const appliedEdits = [];
        const editLines = [];
        
        // Apply edits in sequence
        for (const edit of args.edits) {
          // Check if exact text exists
          if (modified.includes(edit.oldText)) {
            // Find line numbers where changes occur
            const lines = modified.split('\n');
            const lineNum = lines.findIndex(line => line.includes(edit.oldText)) + 1;
            editLines.push(lineNum);
            
            // Replace all occurrences
            const regex = new RegExp(edit.oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = modified.match(regex);
            const count = matches ? matches.length : 0;
            
            modified = modified.replace(regex, edit.newText);
            appliedEdits.push({
              oldText: edit.oldText,
              newText: edit.newText,
              count,
              line: lineNum
            });
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
        
        const editTime = Date.now() - startTime;
        
        if (args.dryRun) {
          // Create preview summary
          const summary = formatEditOperation(args.path, appliedEdits, {
            time: editTime,
            cachedRead,
            lines: editLines,
            dryRun: true
          });
          
          const dryRunResponse = `Dry run - changes that would be made:\n${appliedEdits.map(e => `• ${e.oldText} → ${e.newText}`).join('\n')}\n\nResulting file:\n${modified}`;
          
          return formatResponse(dryRunResponse, summary, 'edit');
        }
        
        // Write using cache (invalidates cache for this file)
        await writeFile(args.path, modified);
        
        // Create formatted output for display
        const summary = formatEditOperation(args.path, appliedEdits, {
          time: editTime,
          cachedRead,
          lines: editLines
        });
        
        // Show snippet around the edit for Claude (matching native format)
        const lines = modified.split('\n');
        const snippetStart = Math.max(0, Math.min(...editLines) - 3);
        const snippetEnd = Math.min(lines.length, Math.max(...editLines) + 2);
        const snippet = lines.slice(snippetStart, snippetEnd).map((line, i) => {
          return `${(snippetStart + i + 1).toString().padStart(5)}→${line}`;
        }).join('\n');
        
        const nativeFormat = `The file ${args.path} has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:\n${snippet}`;
        
        return formatResponse(nativeFormat, summary, 'write');
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