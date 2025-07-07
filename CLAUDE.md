# Apex Hive - Development Project

## 📁 Dit Project

Dit is het **Apex Hive development project** zelf - de broncode van het AI Development Hub systeem dat gebruikers één centrale hub biedt voor AI-gestuurde development automation.

**Doel**: Ontwikkelen en onderhouden van de Apex Hive v2 ecosystem.

## 🏗️ V2 Architectuur

### Core Components
- **apex-router.js** - Command routing met natural language support en script registry
- **mcp-server.js** - Gateway MCP server voor apex commands  
- **mcp-filesystem-cached.js** - Cached file operations MCP server

### Module Systeem (modules/)
- **unified-cache.js** - Unified file-based cache voor persistence (fileCache, searchCache, etc.)
- **file-ops.js** - File operations met cache integration (readFile, writeFile, batchRead, batchWrite)
- **git-ops.js** - Git operaties en utilities
- **rag-system.js** - RAG systeem voor document processing
- **cached-search.js** - Cache-aware zoek functionaliteit
- **mcp-formatter-v2.js** - Output formatting voor MCP responses
- **backlog-parser.js** - Backlog parsing en management
- **logger.js** - Logging utilities
- **utils.js** - Algemene utilities

### Script & Configuration
- **scripts/** - 73 individuele command scripts
- **config/** - Configuratie bestanden:
  - `registry.js` - Script registry mapping
  - `recipes.json` - 11 workflow recepten 
  - `patterns.js` - Natural language patterns
  - `patterns-nl.js` - Nederlandse language patterns

### Key Features V2
1. **Direct Script Execution** - Geen managers/workers, gewoon scripts
2. **Unified Cache System** - Persistent cache across MCP calls
3. **Batch Operations** - Efficient multi-file operations
4. **Natural Language** - Nederlandse en Engelse command support
5. **Recipe Workflows** - 11 gedefinieerde workflow combinations
6. **Cache-First Architecture** - Performance through intelligent caching

## 📊 Statistics
- **73 Scripts** - Complete command library
- **11 Recipes** - Workflow automation
- **11 Modules** - Core functionality
- **2 MCP Servers** - apex-hive-gateway + filesystem-cached

## 🚀 Voor Gebruikers

```bash
npm install apex-hive
apex init
apex start-day    # Begin werkdag routine
apex help         # Alle beschikbare commands
```

## 🔧 Development Notes

Dit project gebruikt:
- **ES Modules** - Moderne JavaScript module systeem
- **MCP Protocol** - Model Context Protocol voor Claude integration
- **File-based Cache** - Persistent caching in ~/.apex-cache/
- **Script Registry** - Dynamische script loading via registry.js

---

*Voor complete documentatie en usage: zie global CLAUDE.md*