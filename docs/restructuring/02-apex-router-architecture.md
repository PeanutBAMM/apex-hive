# Apex Router Architecture

## Core Concept
**Apex Router = Smart Command Dispatcher with Natural Language Support**

## Architecture Overview

```
┌─────────────┐
│   Claude    │
└──────┬──────┘
       │
┌──────▼──────┐
│ MCP Gateway │ ← Protocol handler (50 lines)
└──────┬──────┘
       │ apex("command", {args})
       │
┌──────▼──────┐
│ Apex Router │ ← Command dispatcher (200 lines)
└──────┬──────┘
       │
┌──────┴────────┬────────┬────────┬─────────┐
│               │        │        │         │
▼               ▼        ▼        ▼         ▼
Scripts (60)   RAG    FileOps  GitOps   Cache
│              │        │        │         │
├─ CI (6)      Search   Read     Status    LRU
├─ Doc (15)    Grep     Write    Commit    Update
├─ Quality (8) Find     Update   Push      Clear
├─ Git (8)     Index    Lock     Pull      
├─ Deploy (4)
└─ ... more
```

## Implementation

```javascript
class ApexRouter {
  constructor() {
    // Load configurations (lazy)
    this.recipes = require('./config/recipes.json');
    this.patterns = require('./config/patterns.js');
    this.registry = require('./config/registry.js');
    
    // Initialize cache with README hot-loading
    this.cache = new Cache();
    this.docCache = new DocumentationCache();
    
    // Core modules (injected cache)
    this.modules = {
      rag: new RAGSystem(this.cache, this.docCache),
      fileOps: new FileOps(this.cache),
      gitOps: new GitOps()
    };
    
    // Loaded scripts cache
    this.loaded = new Map();
  }
  
  async initialize() {
    // Hot-load all README files at startup
    await this.docCache.initialize();
    console.error('[ROUTER] README cache loaded');
  }

  async execute(input, args = {}) {
    // Step 1: Natural Language Processing
    const nlResult = this.parseNaturalLanguage(input);
    if (nlResult) {
      return await this.handleNLResult(nlResult, args);
    }
    
    // Step 2: Check if it's a recipe
    if (this.recipes[input]) {
      return await this.runRecipe(input, args);
    }
    
    // Step 3: Direct command routing
    return await this.routeCommand(input, args);
  }

  parseNaturalLanguage(input) {
    for (const pattern of this.patterns) {
      const match = input.match(pattern.match);
      if (match) {
        return pattern.recipe 
          ? { type: 'recipe', name: pattern.recipe }
          : { type: 'command', ...pattern.handler(match) };
      }
    }
    return null;
  }

  async routeCommand(command, args) {
    // Smart routing with README cache
    if (command === 'search' && args.query) {
      // Check README cache for quick routing
      const relevantFolders = this.docCache.findRelevantFolders(args.query);
      if (relevantFolders.length > 0) {
        args.paths = relevantFolders; // Narrow search scope
      }
    }
    
    // Check modules first (search, read, write)
    if (command in this.modules) {
      return await this.modules[command].execute(args);
    }
    
    // Check script registry
    if (this.registry[command]) {
      const script = await this.loadScript(command);
      return await script.run(args);
    }
    
    // Use README cache for suggestions
    const suggestion = this.docCache.findFileByDescription(command);
    if (suggestion) {
      throw new Error(`Unknown command: ${command}. Did you mean: ${suggestion}?`);
    }
    
    throw new Error(`Unknown command: ${command}`);
  }

  async loadScript(name) {
    if (!this.loaded.has(name)) {
      const path = this.registry[name];
      const module = await import(path);
      this.loaded.set(name, module);
    }
    return this.loaded.get(name);
  }

  async runRecipe(name, context) {
    const steps = this.recipes[name];
    const results = [];
    
    for (const step of steps) {
      console.error(`[APEX] Running: ${step}`);
      
      try {
        const result = await this.execute(step, context);
        results.push({ step, success: true, result });
        
        // Smart stopping
        if (step === 'test' && result.failed) {
          console.error('[APEX] Tests failed, stopping recipe');
          break;
        }
      } catch (error) {
        results.push({ step, success: false, error: error.message });
        break;
      }
    }
    
    return {
      recipe: name,
      steps: results,
      success: results.every(r => r.success)
    };
  }
}
```

## Key Design Principles

1. **Zero Business Logic** - Only routing
2. **Pattern Matching** - Support wildcards (ci:*, doc:*)
3. **Direct Dispatch** - No transformation or validation
4. **Error Propagation** - Let modules handle errors
5. **Stateless** - No state management

## Configuration Files

### recipes.json
```json
{
  "commit-push": [
    "quality:fix-all",
    "test",
    "doc:generate-changed",
    "doc:update-readme",
    "git:commit",
    "git:push",
    "ci:monitor"
  ],
  "fix-ci": [
    "ci:monitor",
    "ci:parse",
    "ci:fix",
    "test:run"
  ],
  "clean-code": [
    "quality:lint",
    "quality:console-clean",
    "quality:format"
  ],
  "pre-commit": [
    "doc:check",
    "doc:generate-missing",
    "quality:fix-all",
    "test",
    "doc:validate"
  ],
  "post-merge": [
    "doc:post-merge",
    "doc:organize",
    "doc:update-readme",
    "cache:warm-readmes"
  ],
  "doc-maintenance": [
    "doc:organize",
    "doc:update-readme",
    "xml:validate",
    "xml:fix",
    "doc:validate-links",
    "doc:fix-links"
  ]
}
```

### patterns.js
```javascript
module.exports = [
  {
    name: "commit-and-push",
    match: /commit.*push/i,
    recipe: "commit-push"
  },
  {
    name: "fix-ci",
    match: /fix.*ci|ci.*broken/i,
    recipe: "fix-ci"
  },
  {
    name: "search-pattern",
    match: /search\s+(.+)/i,
    handler: (match) => ({
      command: "search",
      args: { query: match[1] }
    })
  },
  {
    name: "find-files",
    match: /find\s+(\S+)\s+files?/i,
    handler: (match) => ({
      command: "find",
      args: { pattern: match[1] }
    })
  }
];
```

### registry.js
```javascript
module.exports = {
  // CI Scripts (6)
  'ci:monitor': './scripts/ci-monitor.js',
  'ci:parse': './scripts/ci-parse.js',
  'ci:fix': './scripts/ci-fix.js',
  'ci:heal': './scripts/ci-heal.js',
  'ci:watch': './scripts/ci-watch.js',
  'ci:smart-push': './scripts/ci-smart-push.js',
  
  // Documentation Scripts (15)
  'doc:generate': './scripts/doc-generate.js',
  'doc:generate-changed': './scripts/doc-generate-changed.js',
  'doc:generate-missing': './scripts/doc-generate-missing.js',
  'doc:update': './scripts/doc-update.js',
  'doc:update-readme': './scripts/doc-update-readme.js',
  'doc:validate': './scripts/doc-validate.js',
  'doc:validate-xml': './scripts/doc-validate-xml.js',
  'doc:validate-links': './scripts/doc-validate-links.js',
  'doc:fix-links': './scripts/doc-fix-links.js',
  'doc:organize': './scripts/doc-organize.js',
  'doc:sync': './scripts/doc-sync.js',
  'doc:add-xml': './scripts/doc-add-xml.js',
  'doc:search': './scripts/doc-search.js',
  'doc:post-merge': './scripts/doc-post-merge.js',
  'doc:check': './scripts/doc-check.js',
  
  // Quality Scripts (6)
  'quality:lint': './scripts/quality-lint.js',
  'quality:fix-versions': './scripts/quality-fix-versions.js',
  'quality:console-clean': './scripts/quality-console-clean.js',
  'quality:fix-all': './scripts/quality-fix-all.js',
  'quality:validate': './scripts/quality-validate.js',
  'quality:format': './scripts/quality-format.js',
  
  // Backlog Scripts (5)
  'backlog:analyze': './scripts/backlog-analyze.js',
  'backlog:score': './scripts/backlog-score.js',
  'backlog:sync': './scripts/backlog-sync.js',
  'backlog:display': './scripts/backlog-display.js',
  'backlog:table': './scripts/backlog-table.js',
  
  // XML Scripts (3)
  'xml:validate': './scripts/xml-validate.js',
  'xml:add': './scripts/xml-add.js',
  'xml:clean': './scripts/xml-clean.js',
  
  // Git Scripts (3)
  'git:commit': './scripts/git-commit.js',
  'git:push': './scripts/git-push.js',
  'git:status': './scripts/git-status.js',
  
  // Core Scripts (5)
  'init': './scripts/init-project.js',
  'build': './scripts/build.js',
  'test': './scripts/test-runner.js',
  'search': './scripts/search.js',
  'save-conversation': './scripts/save-conversation.js',
  
  // Cache Scripts (2)
  'cache:warm-readmes': './scripts/cache-warm-readmes.js',
  'cache:clear': './scripts/cache-clear.js'
};

## Error Handling

```javascript
// Simple error propagation
try {
  return await route(args);
} catch (error) {
  // Don't catch, let it bubble up to MCP
  throw error;
}
```

## Natural Language Examples

```javascript
// User: "search for authentication bugs"
// Router: Parses to → search({query: "authentication bugs"})

// User: "fix the broken CI" 
// Router: Matches pattern → Runs recipe "fix-ci"

// User: "commit everything and push to main"
// Router: Matches pattern → Runs recipe "commit-push"

// User: "find all test files"
// Router: Parses to → find({pattern: "*.test.js"})
```

## Benefits
- **Natural Language** - User-friendly commands
- **Recipes** - Complex workflows made simple
- **Lazy Loading** - Scripts load on demand
- **Smart Routing** - Context-aware execution
- **Extensible** - Easy to add patterns/recipes
- **Maintainable** - Config-driven architecture