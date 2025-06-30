# Architecture Guide

## 🏗️ System Overview

Apex Hive is built with a modular, extensible architecture designed for maximum flexibility and performance.

```
┌─────────────────────────────────────────────────┐
│                   User Interface                  │
├─────────────┬──────────────┬────────────────────┤
│     CLI     │     MCP      │   Natural Language │
│  (index.js) │ (mcp-server) │    (patterns)      │
└─────────────┴──────────────┴────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────┐
│                  Apex Router                       │
│              (apex-router.js)                      │
├───────────────────────────────────────────────────┤
│  • Command Dispatch                               │
│  • Natural Language Processing                    │
│  • Recipe Execution                               │
│  • Module Loading                                 │
└───────────────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────┐
│                Core Modules                        │
├─────────────┬──────────────┬─────────────────────┤
│   Cache     │    Utils     │      Search         │
│   Logger    │   File Ops   │    RAG System       │
│   Git Ops   │              │                     │
└─────────────┴──────────────┴─────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────┐
│                  Scripts                           │
├─────────────┬──────────────┬─────────────────────┤
│    CI/CD    │ Documentation│     Quality         │
│   (7 cmds)  │   (15 cmds)  │    (8 cmds)         │
├─────────────┼──────────────┼─────────────────────┤
│   Backlog   │     XML      │      Git            │
│   (5 cmds)  │   (3 cmds)   │    (8 cmds)         │
├─────────────┼──────────────┼─────────────────────┤
│    Core     │  Deployment  │   Detection         │
│   (8 cmds)  │   (4 cmds)   │    (3 cmds)         │
└─────────────┴──────────────┴─────────────────────┘
```

## 📁 Directory Structure

```
apex-hive/
├── config/                 # Configuration files
│   ├── recipes.json       # Recipe definitions
│   ├── patterns.js        # English NL patterns
│   ├── patterns-nl.js     # Dutch NL patterns
│   └── registry.js        # Command registry
├── modules/               # Core modules
│   ├── cache.js          # LRU caching system
│   ├── utils.js          # Common utilities
│   ├── search.js         # Ripgrep integration
│   ├── logger.js         # Logging system
│   ├── file-ops.js       # File operations
│   ├── rag-system.js     # RAG functionality
│   └── git-ops.js        # Git operations
├── scripts/              # Command scripts (60+)
│   ├── ci-*.js          # CI/CD scripts
│   ├── doc-*.js         # Documentation scripts
│   ├── quality-*.js     # Quality scripts
│   └── ...              # Other categories
├── docs/                # Documentation
├── index.js            # CLI entry point
├── mcp-server.js       # MCP server
├── apex-router.js      # Command router
└── output-formatter.js # Output formatting
```

## 🔧 Core Components

### 1. Apex Router
The central dispatcher that:
- Parses commands and arguments
- Handles natural language processing
- Executes recipes
- Loads and manages modules
- Routes to appropriate scripts

### 2. Module System
Reusable components:
- **Cache**: LRU caching for performance
- **Utils**: Common utilities (exec, file ops)
- **Search**: Ripgrep-based fast search
- **Logger**: Structured logging
- **File Ops**: File system operations
- **RAG System**: Retrieval augmented generation
- **Git Ops**: Git command wrapper

### 3. Script System
Individual command implementations:
- Self-contained Node.js scripts
- Common interface (execute function)
- JSON output format
- Error handling

### 4. Configuration
- **recipes.json**: Workflow definitions
- **patterns.js**: NL pattern matching
- **registry.js**: Command-to-script mapping

## 🚀 Execution Flow

### CLI Command Flow
```
1. User Input → index.js
2. Parse arguments
3. Router.execute()
4. Pattern matching (if NL)
5. Load script/recipe
6. Execute command
7. Format output
8. Display result
```

### MCP Command Flow
```
1. Claude request → mcp-server.js
2. Parse MCP protocol
3. Router.execute()
4. Same flow as CLI
5. Format for MCP
6. Return to Claude
```

## 💡 Key Design Principles

### 1. Modularity
- Each script is independent
- Modules are reusable
- Easy to add new commands

### 2. Performance
- LRU caching for repeated operations
- Ripgrep for fast searching
- Lazy loading of modules

### 3. Extensibility
- Plugin-like script system
- Configuration-driven
- Natural language patterns

### 4. Reliability
- Error handling at every level
- Graceful degradation
- Comprehensive logging

## 🔌 Integration Points

### Model Context Protocol (MCP)
- Full MCP server implementation
- Tool registration
- Structured responses
- Error handling

### Natural Language
- Pattern-based matching
- Multi-language support
- Fuzzy matching fallback
- Context awareness

### Git Integration
- Smart commit messages
- CI-aware pushing
- Branch management
- Tag operations

## 📊 Data Flow

### Input Processing
```
Raw Input → Tokenization → Pattern Matching → Command Resolution
```

### Output Processing
```
Script Result → JSON Format → Output Formatter → Display/Return
```

### Caching Strategy
```
Request → Cache Check → Execute (if miss) → Cache Store → Return
```

## 🛠️ Adding New Features

### 1. Add a New Command
```javascript
// scripts/my-command.js
export async function execute(args) {
  // Implementation
  return {
    success: true,
    data: result
  };
}
```

### 2. Register Command
```javascript
// config/registry.js
export default {
  // ...
  'my:command': './scripts/my-command.js'
};
```

### 3. Add NL Pattern
```javascript
// config/patterns.js
{
  name: "my-pattern",
  match: /my.*command/i,
  command: "my:command"
}
```

### 4. Create Recipe
```json
// config/recipes.json
{
  "my-recipe": {
    "description": "My workflow",
    "steps": ["my:command", "other:command"]
  }
}
```

## 🔐 Security Considerations

1. **No stdout pollution** - All output to stderr
2. **Input validation** - Command arguments sanitized
3. **Safe execution** - No arbitrary code execution
4. **Path validation** - Absolute paths resolved
5. **Error boundaries** - Failures contained

## 📈 Performance Optimizations

1. **Caching**
   - Command results cached (5-30 min TTL)
   - File contents cached
   - Search results cached

2. **Lazy Loading**
   - Modules loaded on demand
   - Scripts loaded when needed
   - Patterns compiled once

3. **Parallel Execution**
   - Independent steps run concurrently
   - Async/await throughout
   - Promise.all for batch operations

---

*The architecture is designed to be simple, fast, and extensible. Each component has a single responsibility and clear interfaces.*