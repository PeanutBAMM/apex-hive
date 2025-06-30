# MCP Gateway Architecture

## Core Concept
**MCP = Thin Gateway to Apex Core**

## Design Principles
- **Single Entry Point**: 1 tool, 1 function
- **Zero Business Logic**: Only routing
- **Stdout Protection**: No pollution ever
- **Stateless**: No caching, no sessions

## Technical Specification

### Tool Definition
```javascript
{
  name: 'apex',
  description: 'Gateway to Apex Hive Minds AI Hub',
  inputSchema: {
    command: { type: 'string', description: 'Command to execute' },
    args: { type: 'object', description: 'Command arguments' }
  }
}
```

### Implementation (<100 lines)
```javascript
#!/usr/bin/env node
// Stdout protection - FIRST LINE
console.log = console.error;

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import ApexCore from '@apex-hive/core';
import { formatOutput } from './output-formatter.js';

const server = new Server({
  name: 'apex-gateway',
  version: '2.0.0'
}, {
  capabilities: { tools: {} }
});

// Single tool handler with intelligent output formatting
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { command, args } = request.params.arguments;
  
  try {
    const result = await ApexCore.execute(command, args);
    const formatted = await formatOutput(result, { command, args });
    
    return {
      content: [{
        type: 'text',
        text: formatted
      }]
    };
  } catch (error) {
    // Errors are never truncated
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}\n${error.stack}`
      }],
      isError: true
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Command Examples

### Direct Commands

#### File Operations
```javascript
// Basic file operations
apex("read", { path: "src/index.js" })
apex("write", { path: "new-file.js", content: "..." })
apex("update", { path: "config.json", search: "old", replace: "new" })

// Batch operations
apex("read-all", { pattern: "*.config.js" })
apex("update-all", { pattern: "*.js", search: "console.log", replace: "logger.debug" })
```

#### Search Operations  
```javascript
// Search with ripgrep (much faster)
apex("search", { query: "function authenticate" })
apex("find", { pattern: "*.test.js" })
apex("grep", { pattern: "TODO", files: "*.js" })

// Advanced search
apex("search", { 
  query: "auth", 
  include: ["src", "lib"],
  exclude: ["node_modules", "dist"]
})
```

#### Script Execution
```javascript
// CI Management
apex("ci:monitor")
apex("ci:status")
apex("ci:heal")
apex("ci:logs", { workflow: "tests" })

// Documentation
apex("doc:generate")
apex("doc:validate")
apex("doc:fix-links")
apex("doc:organize")

// Quality Control
apex("quality:fix-all")
apex("quality:lint")
apex("quality:check-versions")
apex("quality:clean-console")

// XML Management
apex("xml:validate")
apex("xml:fix")
apex("xml:clean")
apex("xml:analyze")

// Backlog Management
apex("backlog:score", { story: "Add user authentication" })
apex("backlog:display")
apex("backlog:sync")
```

### Natural Language Commands

#### General Queries
```javascript
apex("what changed today?")
apex("show me todos")
apex("how many tests are failing?")
apex("find authentication code")
apex("list broken links")
apex("show quality metrics")
```

#### Action Requests
```javascript
apex("fix the build")
apex("clean up the docs")
apex("update all dependencies")
apex("generate api documentation")
apex("remove console logs")
apex("fix xml tags")
```

#### Status Checks
```javascript
apex("is CI passing?")
apex("what's broken?")
apex("show quality metrics")
apex("list recent commits")
apex("check for vulnerabilities")
apex("are docs up to date?")
```

### Recipe Execution

#### By Name
```javascript
apex("recipe:bug-fix-workflow")
apex("recipe:feature-development")
apex("recipe:pre-release-checklist")
apex("recipe:emergency-hotfix")
apex("recipe:weekly-maintenance")
```

#### By Intent
```javascript
apex("I'm fixing a bug")         // Triggers bug-fix-workflow
apex("preparing for release")     // Triggers pre-release-checklist
apex("starting new feature")      // Triggers feature-development
apex("emergency fix needed")      // Triggers emergency-hotfix
apex("time for cleanup")          // Triggers weekly-maintenance
```

### Complex Operations

#### Multi-Step Commands
```javascript
// Chained operations
apex("fix all issues and update docs")
// Router breaks down into:
// 1. quality:fix-all
// 2. xml:fix
// 3. doc:generate
// 4. doc:validate

// Comprehensive check
apex("full system check")
// Runs: CI status, quality check, doc validation, XML check
```

#### Conditional Operations
```javascript
// Conditional execution
apex("if tests pass, generate docs")
apex("if CI is green, create release")
apex("when docs are valid, update README")
```

#### Parallel Operations
```javascript
// Parallel execution
apex("check everything")
// Router runs in parallel:
// - quality:check-all
// - xml:validate
// - doc:validate
// - ci:status

// Parallel fixes
apex("fix all the things")
// Runs fixes in intelligent order
```

#### Project Management
```javascript
// Initialize new project
apex("init", {
  type: "react-native",
  name: "my-app",
  sdk: "51"
})

// Daily workflow
apex("start my day")  // Shows status, todos, CI state

// End of day
apex("wrap up")  // Commits, validates, updates docs
```

## Output Formatting

See [Token Optimization](./09-token-optimization.md) for full details.

The gateway uses intelligent output formatting:
- **Context-aware formatting** - Different formats for search, logs, tests
- **No hard limits** - Smart truncation only when needed
- **Error priority** - Errors are never truncated
- **Useful summaries** - Group results for clarity

Example output formats:
```javascript
// Search results grouped by file
🔍 Search: "authenticate"
📊 Found 127 matches in 23 files

📄 src/auth/authenticator.js (45 matches)
  Line 23: function authenticate(user, password) {
  Line 45:   const authenticated = await checkPassword(user, password);
  ... 43 more matches

// Test results with clear status
🧪 Test Results
━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSED - 95/100 tests passed in 1234ms
```

## Stdout Protection Strategy

1. **Console.log redirect** - First line redirects to stderr
2. **No direct output** - Only protocol messages
3. **Child process capture** - All subprocess output captured
4. **Error to stderr** - All logging via stderr

## Features to Remove
- ❌ Session recovery system (54 session files!)
- ❌ Performance tracking 
- ❌ Retry logic
- ❌ File watching
- ❌ Backup system
- ❌ Stats reporting (apex_stats command)
- ❌ All complex error handling
- ❌ Caching (moves to RAG)

## Benefits
- **Stability**: Can't crash on complex logic
- **Maintainability**: All updates in Apex Core
- **Debugging**: Single entry point
- **Performance**: Minimal overhead
- **Clean**: No stdout pollution ever