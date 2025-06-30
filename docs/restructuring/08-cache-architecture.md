# Cache Architecture - Apex Hive

<overview>
Simple, performant caching system with automatic updates and intelligent tier management for the Apex Hive development hub.
</overview>

## Design Principles

1. **Simplicity** - Two-tier system: permanent and temporary
2. **Auto-Update** - Cache updates automatically when files change
3. **Performance** - Memory-only, no disk I/O
4. **Smart Defaults** - Important files cached permanently

## Cache Implementation

<architecture>
```javascript
// modules/cache.js
import { LRUCache } from 'lru-cache';

class ApexCache extends LRUCache {
  constructor() {
    super({
      max: 500,                    // 500 items max
      ttl: 1000 * 60 * 60,        // 1 hour default TTL
      maxSize: 100 * 1024 * 1024,  // 100MB max total
      sizeCalculation: (value) => {
        return Buffer.byteLength(
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      },
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });
    
    // System docs patterns - these get special treatment
    this.persistentPatterns = [
      /README\.md$/i,              // All README files
      /CLAUDE\.md$/i,              // Claude instructions
      /docs\/development\//,       // Development guidelines
      /docs\/setup\//,             // Setup guides
      /docs\/scripts-refactor\//,  // Script architecture docs
      /docs\/restructuring\//,     // This restructuring plan!
      /\.apex-hive\//             // Config files
    ];
  }
  
  async initialize() {
    console.error('[CACHE] Pre-loading system documentation...');
    
    const patterns = [
      '**/README.md',
      '**/CLAUDE.md',
      'docs/development/*.md',
      'docs/setup/*.md',
      'docs/scripts-refactor/*.md',
      'docs/restructuring/*.md',
      '.apex-hive/**/*.json'
    ];
    
    let loaded = 0;
    for (const pattern of patterns) {
      const files = await glob(pattern);
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        // Set with no TTL for system docs
        this.set(file, content, { ttl: 0 });
        loaded++;
      }
    }
    
    console.error(`[CACHE] Pre-loaded ${loaded} system files`);
  }
  
  set(key, value, options = {}) {
    // System docs never expire
    if (this.isPersistent(key) && !options.ttl) {
      options.ttl = 0; // 0 = never expire
    }
    
    return super.set(key, value, options);
  }
  
  // Update cache when files change
  updateFile(path, newContent) {
    if (this.has(path)) {
      // Preserve TTL settings for system docs
      const options = this.isPersistent(path) ? { ttl: 0 } : {};
      this.set(path, newContent, options);
      console.error(`[CACHE] Updated: ${path}`);
    }
    
    // Invalidate related caches
    this.invalidateRelated(path);
  }
  
  isPersistent(key) {
    return this.persistentPatterns.some(pattern => pattern.test(key));
  }
  
  invalidateRelated(path) {
    // Clear search results containing this file
    const toDelete = [];
    
    for (const key of this.keys()) {
      if (key.startsWith('search:') || key.startsWith('grep:')) {
        const value = this.get(key);
        if (value && Array.isArray(value)) {
          if (value.some(item => item.file === path)) {
            toDelete.push(key);
          }
        }
      }
    }
    
    // Batch delete
    toDelete.forEach(key => this.delete(key));
    
    if (toDelete.length > 0) {
      console.error(`[CACHE] Invalidated ${toDelete.length} related entries`);
    }
  }
  
  // Stats for monitoring
  getStats() {
    const systemDocs = [];
    const regularItems = [];
    
    for (const key of this.keys()) {
      if (this.isPersistent(key)) {
        systemDocs.push(key);
      } else {
        regularItems.push(key);
      }
    }
    
    return {
      total: this.size,
      systemDocs: systemDocs.length,
      regularItems: regularItems.length,
      memoryUsage: this.calculatedSize,
      maxMemory: 100 * 1024 * 1024
    };
  }
}

export default ApexCache;
```
</architecture>

## Cache Usage Patterns

<usage>
### 1. File Operations Integration

```javascript
// In FileOps module
class FileOps {
  constructor(cache) {
    this.cache = cache;
  }
  
  async read(path) {
    // Try cache first
    const cached = this.cache.get(`file:${path}`);
    if (cached) return cached;
    
    // Read from disk
    const content = await fs.readFile(path, 'utf8');
    this.cache.set(`file:${path}`, content);
    return content;
  }
  
  async write(path, content) {
    await fs.writeFile(path, content);
    // Update cache automatically
    this.cache.updateFile(`file:${path}`, content);
  }
}
```

### 2. Search Results Caching

```javascript
// In RAG System
async search(query, options) {
  const cacheKey = `search:${query}:${JSON.stringify(options)}`;
  
  // Check cache
  const cached = this.cache.get(cacheKey);
  if (cached) return cached;
  
  // Perform search
  const results = await this.ripgrep.search(query, options);
  
  // Cache results
  this.cache.set(cacheKey, results);
  return results;
}
```

### 3. README Navigation Cache

```javascript
// Special handling for README files
class DocumentationCache {
  constructor(cache) {
    this.cache = cache;
  }
  
  async findFileByDescription(description) {
    // All READMEs are in permanent cache
    for (const [path, content] of this.cache.permanent) {
      if (path.endsWith('README.md')) {
        if (content.toLowerCase().includes(description.toLowerCase())) {
          return path;
        }
      }
    }
    return null;
  }
}
```
</usage>

## Performance Characteristics

<performance>
### Memory Usage

- **Permanent Cache**: ~5-10MB (docs & READMEs)
- **Temporary Cache**: Max 50MB (enforced)
- **Total Maximum**: ~60MB

### Access Times

- **Cache Hit**: <1ms
- **Cache Miss + Read**: 5-20ms
- **Cache Update**: <1ms

### Cache Hit Rates

Expected hit rates by operation:
- README access: 100% (always permanent)
- Documentation: 100% (always permanent)
- Search queries: 70-80% (30min TTL)
- File reads: 50-60% (working set)
</performance>

## Auto-Update Flow

<update-flow>
```
File Write Operation
        ↓
FileOps.write(path, content)
        ↓
fs.writeFile(path, content)
        ↓
cache.updateFile(path, content)
        ↓
Check if permanent or temporary
        ↓
Update appropriate cache
        ↓
Invalidate related caches (search results)
```

This ensures cache coherency without manual invalidation.
</update-flow>

## Benefits

1. **Always Fresh** - Auto-update on file changes
2. **Fast Navigation** - Instant README/docs access
3. **Reduced I/O** - Most operations hit cache
4. **Simple API** - Just get/set/updateFile
5. **Memory Safe** - Hard limits prevent bloat
</content>
</invoke>