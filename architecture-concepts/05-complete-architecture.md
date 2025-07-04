# Complete Architecture Overview

## 🎯 Vision
**Apex Hive = AI Hub for Development Tools**
- Installable via NPM
- MCP integration for Claude
- Fast search with ripgrep
- Smart command routing
- Natural language support (NL/EN)

## 🏗️ Architecture Diagram

```javascript
┌─────────────────┐
│     Claude      │
└────────┬────────┘
         │ Natural Language: "fix the CI"
         │
┌────────▼────────┐
│   MCP Gateway   │ ← 50 lines (Protocol only)
│  (index.js)     │
└────────┬────────┘
         │ apex("fix the CI")
         │
┌────────▼────────┐
│  Apex Router    │ ← 200 lines (Smart routing)
│ (apex-router.js)│
└────────┬────────┘
         │ Decides: Run recipe "fix-ci"
         │
    ┌────┴────┬────────┬────────┬────────┐
    │         │        │        │        │
    ▼         ▼        ▼        ▼        ▼
Scripts     RAG     Cache   FileOps   Git
(60)     System           Module    Utils
```javascript

## 📁 File Structure

```javascript
@apex-hive-minds/core/
├── index.js              # Main entry (exports Router)
├── mcp-server.js         # MCP Gateway (thin layer)
├── apex-router.js        # Smart command router
│
├── modules/              # Core modules
│   ├── rag-system.js     # Search functionality
│   ├── cache.js          # LRU memory cache
│   ├── file-ops.js       # Read/write/update
│   └── git-ops.js        # Git operations
│
├── scripts/              # All scripts (flat)
│   ├── ci-monitor.js
│   ├── ci-fix.js
│   ├── doc-generate.js
│   ├── quality-lint.js
│   ├── test-runner.js
│   └── ... (60 scripts total)
│
├── config/               # Configuration
│   ├── recipes.json      # Workflow definitions
│   ├── patterns.js       # NL patterns
│   └── registry.js       # Script registry
│
└── data/
    └── CLAUDE.md         # Instructions for Claude
```javascript

## 🔄 Data Flow Examples

### Example 1: Natural Language Command
```javascript
User: "fix the broken CI"
         ↓
MCP: apex("fix the broken CI")
         ↓
Router: Parse NL → Match pattern → Recipe "fix-ci"
         ↓
Execute Recipe:
  1. ci:monitor → "3 errors found"
  2. ci:parse → "TypeScript, ESLint, console.log"
  3. ci:fix → "Fixed all 3"
  4. test:run → "All tests pass"
         ↓
Return: "Fixed 3 CI issues. Ready to push!"
```javascript

### Example 2: Direct Command
```javascript
User: "search authentication"
         ↓
MCP: apex("search", {query: "authentication"})
         ↓
Router: Direct command → RAG System
         ↓
RAG: Check cache → Not found → Ripgrep search
         ↓
Return: Search results + cache for next time
```javascript

### Example 3: Recipe Workflow
```javascript
User: "commit-push"
         ↓
Router: Load recipe from recipes.json
         ↓
Execute steps:
  1. quality:fix-all
  2. test (stops if fail)
  3. doc:generate-changed
  4. doc:update-readme
  5. git:commit
  6. git:push
  7. ci:monitor
         ↓
Return: Recipe execution summary
```javascript

### Example 4: MCP Command via Claude
```javascript
Claude: apex("fix the CI")
         ↓
MCP Gateway: Forward to router
         ↓
Router: Natural language → Recipe "fix-ci"
         ↓
Execute recipe with feedback to Claude
         ↓
Return: Structured result for Claude
```javascript

### Example 5: README-Accelerated Search
```javascript
User: "search authentication logic"
         ↓
Router → RAG System
         ↓
RAG: Check README cache first
         ↓
README says: auth logic in src/auth/
         ↓
RAG: Search only src/auth/ (10x faster!)
         ↓
Return: Targeted results
```javascript

## 🧩 Component Details

### MCP Gateway (50 lines)
```javascript
// Complete implementation
console.log = console.error; // Stdout protection

const server = new Server({name: 'apex-gateway'});

server.setRequestHandler(async (request) => {
  const { command, args } = request.params.arguments;
  const result = await ApexRouter.execute(command, args);
  return { content: [{ type: 'text', text: result }] };
});
```javascript

### Apex Router (200 lines)
- Natural language parsing
- Recipe execution
- Script lazy loading
- Smart command routing
- Cache integration

### Scripts (60 files)

#### CI Scripts (6)
- `ci-monitor.js` - Monitor CI status
- `ci-parse.js` - Parse CI logs
- `ci-fix.js` - Auto-fix CI issues
- `ci-heal.js` - Self-healing CI
- `ci-watch.js` - Watch CI runs
- `ci-smart-push.js` - Push + monitor

#### Documentation Scripts (15)
- `doc-generate.js` - Generate new docs
- `doc-generate-changed.js` - For staged changes
- `doc-generate-missing.js` - Find undocumented
- `doc-update.js` - Update existing docs
- `doc-update-readme.js` - Update README indexes
- `doc-validate.js` - General validation
- `doc-validate-xml.js` - XML compliance
- `doc-validate-links.js` - Check links
- `doc-fix-links.js` - Fix broken links
- `doc-organize.js` - Organize in folders
- `doc-sync.js` - Sync doc state
- `doc-add-xml.js` - Add XML tags
- `doc-search.js` - Search docs
- `doc-post-merge.js` - Post-merge updates
- `doc-check.js` - Pre-commit check

#### Quality Scripts (6)
- `quality-lint.js` - Run linter
- `quality-fix-versions.js` - Fix package versions
- `quality-console-clean.js` - Remove console.logs
- `quality-fix-all.js` - Fix everything
- `quality-validate.js` - Validate code
- `quality-format.js` - Format code

#### Backlog Scripts (5)
- `backlog-analyze.js` - Analyze todos
- `backlog-score.js` - Score priority
- `backlog-sync.js` - Sync to files
- `backlog-display.js` - Show backlog
- `backlog-table.js` - Generate table

#### XML Scripts (3)
- `xml-validate.js` - Validate tags
- `xml-add.js` - Add missing tags
- `xml-clean.js` - Clean excess tags

#### Git Scripts (3)
- `git-commit.js` - Smart commit
- `git-push.js` - Push with checks
- `git-status.js` - Enhanced status

#### Core Scripts (5)
- `init-project.js` - Initialize project
- `build.js` - Build packages
- `test-runner.js` - Run tests
- `search.js` - RAG search wrapper
- `save-conversation.js` - Save context

#### Additional Scripts (17)
Including utilities for deployment, migrations, development tools, and more - totaling 60 scripts across all categories.

### Modules

#### Cache Module
See [Cache Architecture](./08-cache-architecture.md) for full details.
- **Single-tier LRU**: Unified cache with pattern-based TTL
- **Auto-update**: Cache updates when files change
- **Persistent patterns**: System docs (TTL=0): README.md, CLAUDE.md, docs/development/, docs/setup/, docs/scripts-refactor/, docs/restructuring/, .apex-hive/
- **Memory limit**: 100MB total with LRU eviction

#### FileOps Module  
Thread-safe file operations with cache integration:
```javascript
class FileOps {
  constructor(cache) {
    this.cache = cache;
    this.locks = new Map(); // Prevent parallel writes to same file
  }
  
  async write(path, content) {
    await this.acquireLock(path);
    try {
      await fs.writeFile(path, content);
      this.cache.updateFile(path, content); // Auto-update cache
    } finally {
      this.releaseLock(path);
    }
  }
}
```javascript

#### RAG System
Simplified search with README-first strategy:
- **Ripgrep wrapper**: Direct shell execution
- **Cache integration**: Results cached 30 min
- **README routing**: Use README hints for faster search

#### GitOps Module
Common git operations with error handling:
- **Status checks**: Branch, changes, conflicts
- **Safe operations**: Commit, push, pull
- **CI integration**: Auto-monitor after push

## 🚀 Key Features

### 1. Natural Language Support
```javascript
patterns: [
  { match: /fix.*ci/i, recipe: 'fix-ci' },
  { match: /search\s+(.+)/i, handler: (m) => ({command: 'search', args: {query: m[1]}}) }
]
```javascript

### 2. Recipe System
```json
{
  "commit-push": ["quality:fix-all", "test", "git:commit", "git:push"],
  "fix-ci": ["ci:monitor", "ci:parse", "ci:fix", "test"]
}
```javascript

### 3. Lazy Loading
```javascript
// Scripts load only when needed
if (!this.loaded.has(name)) {
  this.loaded.set(name, await import(path));
}
```javascript

### 4. Smart Caching
See [Cache Architecture](./08-cache-architecture.md) for implementation.
```javascript
// Automatic cache updates on file write
fileOps.write(path, content); // Cache updated automatically

// Pattern-based persistence
cache.getPersistenceConfig(path); // Returns TTL based on patterns

// Intelligent invalidation
cache.updateFile(path, content); // Updates cache + invalidates related
```javascript

### 5. Documentation Integration
```javascript
// Auto-doc on commits
preCommitHook: ['doc:generate-changed', 'doc:update-readme']

// Smart doc search
rag.searchDocs(query); // Uses README cache for routing
```javascript

## 📋 CLAUDE.md Integration

```markdown
## Apex Commands

### Direct Commands
- search <query> - Search with ripgrep
- read <file> - Read file with cache
- test - Run test suite

### Recipes
- fix - Smart fix (detects what needs fixing)
- commit-push - Full commit workflow
- clean-code - Quality improvements

### Natural Language
- "fix the CI" → Runs fix-ci recipe
- "search for auth bugs" → Searches "auth bugs"
- "commit and push" → Runs commit-push recipe
```javascript

## ✅ Benefits

1. **Simple** - Each component has one job
2. **Fast** - Ripgrep + caching + lazy loading
3. **Smart** - NL support + recipes
4. **Stable** - No complex state management
5. **Extensible** - Easy to add scripts/patterns

## 🔧 Implementation Priority (4-Week Timeline)

1. **Week 1**: Core structure
   - MCP Gateway with stdout protection
   - Basic Router
   - File operations

2. **Week 2**: Scripts migration
   - Port existing 60 scripts
   - Remove managers/workers
   - Test each script

3. **Week 3**: Smart features
   - Natural language patterns (NL/EN)
   - Recipe system
   - Cache optimization

4. **Week 4**: Polish
   - Error handling
   - Performance tuning
   - Documentation