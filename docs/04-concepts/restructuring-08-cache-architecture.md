# Cache Architecture - Apex Hive

<overview>
Persistent, file-based caching system with automatic expiration and intelligent namespace management for the Apex Hive development hub. Survives MCP server restarts and Claude sessions.
</overview>

## Design Principles

1. **Persistence** - File-based storage survives restarts
2. **Simplicity** - Three clear namespaces with different TTLs
3. **Performance** - Fast access with atomic operations
4. **Scalability** - Size limits prevent unbounded growth

## Cache Implementation

<architecture>
```javascript
// modules/unified-cache.js
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export class UnifiedCache {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.cacheDir = path.join(os.homedir(), '.apex-cache', namespace);
    this.ttl = options.ttl || 15 * 60 * 1000; // 15 minutes default
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
    this.encoding = options.encoding || 'utf8';
  }

  getCachePath(key) {
    // Create safe filename from key using MD5 hash
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.cacheDir, hash + '.cache');
  }

  async get(key) {
    try {
      const metaPath = this.getMetaPath(key);
      const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
      
      // Check expiration
      if (Date.now() > meta.expires) {
        await this.delete(key);
        return null;
      }
      
      // Read cached value
      const content = await fs.readFile(this.getCachePath(key), this.encoding);
      
      // Update access stats
      meta.lastAccess = Date.now();
      meta.hits = (meta.hits || 0) + 1;
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
      
      return JSON.parse(content);
    } catch (error) {
      return null; // Not in cache
    }
  }

  async set(key, value, options = {}) {
    await this.ensureDir();
    
    const content = JSON.stringify(value);
    const size = Buffer.byteLength(content, this.encoding);
    
    // Check size limit
    if (size > this.maxSize) {
      return false;
    }
    
    // Write atomically
    const cachePath = this.getCachePath(key);
    const metaPath = this.getMetaPath(key);
    
    const meta = {
      key,
      namespace: this.namespace,
      created: Date.now(),
      expires: Date.now() + (options.ttl || this.ttl),
      lastAccess: Date.now(),
      size,
      hits: 0
    };
    
    // Write files atomically
    await fs.writeFile(cachePath + '.tmp', content, this.encoding);
    await fs.writeFile(metaPath + '.tmp', JSON.stringify(meta, null, 2));
    
    // Rename atomically
    await fs.rename(cachePath + '.tmp', cachePath);
    await fs.rename(metaPath + '.tmp', metaPath);
    
    return true;
  }
}

// Export singleton instances for each cache type
export const commandCache = new UnifiedCache('commands', { ttl: 5 * 60 * 1000 });
export const fileCache = new UnifiedCache('files', { ttl: 10 * 60 * 1000 });
export const searchCache = new UnifiedCache('search', { ttl: 30 * 60 * 1000 });
```
</architecture>

## Cache Namespaces

<namespaces>
### 1. Command Cache (5 minutes TTL)
- Stores command execution results
- Quick access to recent command outputs
- Prevents re-running expensive operations

### 2. File Cache (10 minutes TTL)
- Caches file contents for fast access
- Reduces disk I/O significantly
- Special handling for README files (24 hour TTL)

### 3. Search Cache (30 minutes TTL)
- Stores ripgrep search results
- Longer TTL for expensive searches
- Keyed by query + options
</namespaces>

## Cache Usage Patterns

<usage>
### 1. File Operations Integration

```javascript
// In file-ops.js
export async function readFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  
  // Check cache first
  if (!options.noCache) {
    const cached = await fileCache.get(absolutePath);
    if (cached !== null) {
      // Handle both string and structured data
      return typeof cached === 'string' ? cached : cached.content;
    }
  }
  
  // Read from disk
  const content = await fs.readFile(absolutePath, 'utf8');
  
  // Cache the content
  if (!options.noCache) {
    await fileCache.set(absolutePath, content);
  }
  
  return content;
}
```

### 2. Search Results Caching

```javascript
// In search.js
export async function searchContent(query, options = {}) {
  const cacheKey = `content:${query}:${JSON.stringify(options)}`;
  
  // Check cache
  if (!options.noCache) {
    const cached = await searchCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }
  
  // Perform search
  const matches = await performSearch(query, options);
  
  // Cache results
  await searchCache.set(cacheKey, matches);
  return matches;
}
```

### 3. README Pre-warming

```javascript
// In cache-warm-readmes.js
const cacheData = {
  content,
  metadata: {
    path: file,
    size: stats.size,
    sections: extractSections(content),
    cached: new Date().toISOString()
  }
};

// Cache for 24 hours
await fileCache.set(file, cacheData, {
  ttl: 24 * 60 * 60 * 1000
});
```
</usage>

## Cache Monitoring

<monitoring>
### Using cache:status Command

```bash
# Basic status
apex cache:status

# Detailed view with top items
apex cache:status --detailed

# Clear specific namespace
apex cache:status --clear --namespace files
```

### Output Example

```json
{
  "totalCaches": 3,
  "totalItems": 42,
  "totalSize": "15.7 MB",
  "totalHits": 237,
  "averageHitRate": "5.64",
  "caches": {
    "commands": {
      "items": 5,
      "size": "128 KB",
      "hits": 15,
      "hitRate": "3.00"
    },
    "files": {
      "items": 25,
      "size": "12.3 MB",
      "hits": 189,
      "hitRate": "7.56"
    },
    "search": {
      "items": 12,
      "size": "3.3 MB",
      "hits": 33,
      "hitRate": "2.75"
    }
  }
}
```
</monitoring>

## Performance Characteristics

<performance>
### Storage Location
- **Base Directory**: `~/.apex-cache/`
- **Namespace Dirs**: `~/.apex-cache/commands/`, `~/.apex-cache/files/`, `~/.apex-cache/search/`
- **File Format**: `{md5hash}.cache` and `{md5hash}.cache.meta`

### Access Times
- **Cache Hit**: <5ms (file read)
- **Cache Miss**: Depends on operation
- **Cache Write**: <10ms (atomic operation)

### Size Management
- **Per-namespace limit**: 100MB default
- **Automatic expiration**: Based on TTL
- **Manual clearing**: `apex cache:clear`

### Benefits Over Old LRU Cache
1. **Persistence**: Survives MCP restarts
2. **Debugging**: Can inspect cache files directly
3. **Statistics**: Hit tracking and performance metrics
4. **Atomic Operations**: No corruption on crashes
5. **Size Control**: Hard limits per namespace
</performance>

## Migration from LRU Cache

<migration>
The old in-memory LRU cache has been replaced with the unified file-based cache:

| Old System | New System |
|------------|------------|
| Memory-only | File-based |
| Lost on restart | Persists across restarts |
| Single cache instance | Three namespaces |
| No statistics | Full statistics with hit tracking |
| Size in items | Size in bytes |

No migration needed - caches will populate automatically on first use.
</migration>

## Future Enhancements

1. **Compression**: Gzip for large cached items
2. **Remote Cache**: Redis/Memcached support
3. **Cache Warming**: Background pre-population
4. **Smart Eviction**: LFU instead of TTL-only
5. **Cache Sharing**: Between team members