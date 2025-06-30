# RAG System Architecture

## Current Issues
- 16MB cache file die blijft groeien
- Auto-compact crashes het systeem
- Token waste door inefficiënte indexing
- Complex cross-repo logic met 1000+ regels code

## New Vision: Simple & Fast

```
RAG System
├── Ripgrep Wrapper (direct shell calls)
├── Simple Cache (memory only, no persistence)
└── Search Interface (unified API)
```

## Core Functions

### 1. README-First Search Strategy
```javascript
class RAGSystem {
  constructor(cache, docCache) {
    this.cache = cache;           // General cache
    this.docCache = docCache;     // README cache
    this.ripgrep = new RipgrepWrapper();
  }

  async search(query, options = {}) {
    // Step 1: Check README cache for smart routing
    const readmeHints = this.docCache.searchReadmes(query);
    if (readmeHints.length > 0) {
      // README tells us where to look!
      console.error(`[RAG] README hints: searching in ${readmeHints.length} folders`);
      options.paths = readmeHints.map(h => h.folder);
    }
    
    // Step 2: Check general cache
    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Step 3: Use ripgrep for targeted search
    const results = await this.ripgrep.search(query, {
      paths: options.paths || ['.'],
      limit: options.limit || 20,
      fileType: options.fileType || 'md'
    });
    
    // Cache results
    this.cache.set(cacheKey, results);
    return results;
  }
  
  async searchDocs(query, options = {}) {
    // Specialized doc search
    return await this.search(query, {
      ...options,
      paths: ['./docs'],
      fileType: 'md'
    });
  }
}
```

### 2. Ripgrep Integration
```javascript
class RipgrepWrapper {
  async search(query, options) {
    // Direct shell execution, no JSON parsing
    const cmd = `rg -i "${query}" ${options.paths.join(' ')} --max-count=${options.limit}`;
    const output = await exec(cmd);
    
    // Simple line-based parsing
    return this.parseOutput(output);
  }
  
  async grep(pattern, paths) {
    // Pure regex search
    const cmd = `rg "${pattern}" ${paths.join(' ')} --line-number`;
    return await exec(cmd);
  }
  
  async findFiles(pattern) {
    // File pattern matching
    const cmd = `rg --files -g "${pattern}"`;
    return await exec(cmd);
  }
  
  parseOutput(output) {
    // Simple line parsing, no complex JSON
    return output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [file, ...content] = line.split(':');
        return { file, content: content.join(':').trim() };
      });
  }
}
```

## Key Changes

### ❌ Remove
- File-based cache (16MB JSON monster)
- Cross-repo index building
- Auto-compact functionality
- Complex JSON parsing from ripgrep
- Conversation memory in RAG
- Session management
- File watching
- Checksum calculation
- XML tag extraction
- Keyword extraction
- Section extraction

### ✅ Keep & Improve  
- Ripgrep for speed (significantly faster)
- Memory cache (LRU, max 100MB)
- Simple search interface
- Direct pattern matching
- Basic file/grep/find operations

## Cache Strategy
```javascript
// No more file cache!
// Only memory cache with strict limits
const cacheConfig = {
  max: 500,              // Max 500 items
  maxSize: 100 * 1024 * 1024,  // Max 100MB
  ttl: 3600000,          // 1 hour TTL
  updateAgeOnGet: true,  // Refresh on access
  updateAgeOnHas: true,  // Refresh on check
  
  // Auto cleanup when full
  dispose: (value, key) => {
    // Log disposal for debugging
    console.error(`Cache evicted: ${key}`);
  }
};
```

## Search Operations

### search(query, options)
- Simple text search
- Uses ripgrep -i flag (case insensitive)
- Returns file + matched content
- Cached for 1 hour

### grep(pattern, paths)  
- Regex pattern search
- Direct ripgrep output
- Line numbers included
- No caching (fast enough)

### findFiles(pattern)
- File pattern matching (*.js, etc)
- Uses ripgrep --files
- Returns list of paths
- No caching (fast enough)

## README-First Search Benefits

### Performance Improvements
1. **10x faster searches** - README cache narrows scope
2. **Instant navigation** - Find files by description
3. **Smart routing** - Know where to search before searching

### Example Flow
```
Query: "authentication logic"
↓
Check README cache (0ms)
↓
README: "auth logic in src/auth/"
↓
Search only src/auth/ (50ms vs 500ms full search)
↓
Return targeted results
```

## Overall Benefits
- **No persistence issues** - Memory only, no 16MB files
- **No auto-compact crashes** - Nothing to compact
- **Fast** - Direct ripgrep + README routing
- **Simple** - <300 lines total (was 1000+)
- **Stable** - Less code = less bugs
- **Smart** - README cache provides context

## Migration Notes
- Remove cache/shared/cross-repo-index.json
- Remove .apex-sessions directory
- Remove data/conversation-memory.json
- Update all imports from old RAG system