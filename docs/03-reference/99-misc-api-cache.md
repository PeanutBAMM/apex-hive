# Cache Module API Reference

## Overview

The cache module provides a unified, persistent file-based caching system through the `UnifiedCache` class and pre-configured namespace instances.

## Import

```javascript
import { 
  UnifiedCache,
  commandCache, 
  fileCache, 
  searchCache,
  formatBytes 
} from './modules/unified-cache.js';
```

## UnifiedCache Class

### Constructor

```javascript
new UnifiedCache(namespace, options = {})
```

**Parameters:**
- `namespace` (string): Cache namespace name (used for directory)
- `options` (object):
  - `ttl` (number): Time to live in ms (default: 15 minutes)
  - `maxSize` (number): Max size in bytes (default: 100MB)
  - `encoding` (string): File encoding (default: 'utf8')

**Example:**
```javascript
const myCache = new UnifiedCache('custom', {
  ttl: 60 * 60 * 1000,  // 1 hour
  maxSize: 50 * 1024 * 1024  // 50MB
});
```

### Methods

#### get(key)

Retrieves a value from cache.

```javascript
const value = await cache.get('my-key');
// Returns: cached value or null if not found/expired
```

**Features:**
- Automatically deletes expired entries
- Updates hit count and last access time
- Returns parsed JSON value

#### set(key, value, options)

Stores a value in cache.

```javascript
const success = await cache.set('my-key', { data: 'value' }, {
  ttl: 3600000  // Optional: override default TTL
});
// Returns: true if successful, false if too large
```

**Features:**
- Atomic write operations
- Size validation
- Custom TTL per item

#### has(key)

Checks if key exists and is not expired.

```javascript
const exists = await cache.has('my-key');
// Returns: true/false
```

#### delete(key)

Removes item from cache.

```javascript
const deleted = await cache.delete('my-key');
// Returns: true if deleted, false if not found
```

#### clear()

Removes all items from this namespace.

```javascript
const count = await cache.clear();
// Returns: number of files deleted
```

#### size()

Gets number of cached items.

```javascript
const itemCount = await cache.size();
// Returns: number of cache entries
```

#### stats()

Gets detailed cache statistics.

```javascript
const stats = await cache.stats();
// Returns: {
//   namespace: 'files',
//   items: 25,
//   totalSize: 1048576,
//   totalHits: 150,
//   hitRate: "6.00",
//   expired: 3,
//   active: [...] // Top 10 by hits
// }
```

## Pre-configured Instances

### commandCache

For caching command execution results.

```javascript
import { commandCache } from './modules/unified-cache.js';

// 5 minute TTL
await commandCache.set('cmd:status', resultData);
```

### fileCache  

For caching file contents.

```javascript
import { fileCache } from './modules/unified-cache.js';

// 10 minute TTL
await fileCache.set('/path/to/file', fileContent);
```

### searchCache

For caching search results.

```javascript
import { searchCache } from './modules/unified-cache.js';

// 30 minute TTL
await searchCache.set('search:query:options', results);
```

## Helper Functions

### formatBytes(bytes)

Formats byte size for display.

```javascript
import { formatBytes } from './modules/unified-cache.js';

console.log(formatBytes(1536));  // "1.5 KB"
console.log(formatBytes(1048576));  // "1 MB"
```

## File Structure

Cache files are stored in:
```
~/.apex-cache/
├── commands/
│   ├── {hash}.cache      # Cached data
│   └── {hash}.cache.meta # Metadata
├── files/
└── search/
```

## Metadata Format

Each cached item has a `.meta` file:

```json
{
  "key": "original-key",
  "namespace": "files",
  "created": 1699564320000,
  "expires": 1699564920000,
  "lastAccess": 1699564400000,
  "size": 2048,
  "hits": 5
}
```

## Usage Examples

### Basic Usage

```javascript
// Store a value
await fileCache.set('config.json', { version: '1.0' });

// Retrieve value
const config = await fileCache.get('config.json');
if (config) {
  console.log('Cache hit:', config);
} else {
  console.log('Cache miss');
}
```

### With Custom TTL

```javascript
// Cache for 24 hours
await fileCache.set('readme.md', content, {
  ttl: 24 * 60 * 60 * 1000
});
```

### Error Handling

```javascript
try {
  const cached = await cache.get(key);
  if (cached === null) {
    // Cache miss - fetch fresh data
    const fresh = await fetchData();
    await cache.set(key, fresh);
    return fresh;
  }
  return cached;
} catch (error) {
  console.error('Cache error:', error);
  // Fallback to direct fetch
  return await fetchData();
}
```

### Cache Warming

```javascript
async function warmCache(files) {
  const results = [];
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const success = await fileCache.set(file, content, {
      ttl: 24 * 60 * 60 * 1000  // 24 hours
    });
    results.push({ file, success });
  }
  
  return results;
}
```

### Performance Monitoring

```javascript
// Check cache effectiveness
const stats = await fileCache.stats();
console.log(`Hit rate: ${stats.hitRate}`);
console.log(`Total size: ${formatBytes(stats.totalSize)}`);

// Show most accessed items
stats.active.forEach(item => {
  console.log(`${item.key}: ${item.hits} hits`);
});
```

## Best Practices

1. **Key Naming**: Use descriptive, unique keys
   ```javascript
   // Good
   const key = `file:${path}:${hash}`;
   
   // Bad
   const key = 'data';
   ```

2. **Error Handling**: Always handle cache misses
   ```javascript
   const data = await cache.get(key) || await fetchFresh();
   ```

3. **Size Awareness**: Check size before caching large items
   ```javascript
   const size = Buffer.byteLength(JSON.stringify(data));
   if (size < 10 * 1024 * 1024) {  // 10MB
     await cache.set(key, data);
   }
   ```

4. **TTL Strategy**: Use appropriate TTLs
   - Volatile data: 1-5 minutes
   - Stable data: 10-30 minutes  
   - Static data: 1-24 hours

5. **Monitoring**: Regular stats checks
   ```javascript
   setInterval(async () => {
     const stats = await cache.stats();
     console.log('Cache health:', stats);
   }, 300000);  // Every 5 minutes
   ```