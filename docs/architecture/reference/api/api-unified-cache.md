# unified-cache Module API Reference

## Overview

The `unified-cache` module provides a persistent, file-based caching system with TTL support and hit tracking that persists across MCP server restarts.

## Class: UnifiedCache

### Constructor

```javascript
new UnifiedCache(namespace, options = {})
```

**Parameters:**
- `namespace` (string): Cache namespace directory name
- `options` (object):
  - `ttl` (number): Time-to-live in milliseconds (default: 15 minutes)
  - `maxSize` (number): Maximum item size in bytes (default: 100MB)
  - `encoding` (string): File encoding (default: 'utf8')

### Methods

#### async get(key)
Retrieves a cached value by key.
- **Returns**: Cached data or `null` if not found/expired
- **Updates**: Increments persistent `meta.hits` counter and updates `lastAccess`
- **Note**: The deprecated `_attempts` object is no longer used

#### async set(key, value, options = {})
Stores a value in the cache with atomic writes.
- **Parameters**: 
  - `key` (string): Cache key
  - `value` (any): Data to cache
  - `options.ttl` (number): Override default TTL
- **Returns**: `true` on success, `false` on failure

#### async has(key)
Checks if a key exists and is not expired.
- **Returns**: `true` if key exists and valid

#### async delete(key)
Removes a cache entry.
- **Returns**: `true` if deleted, `false` if not found

#### async clear()
Removes all entries from the namespace.
- **Returns**: `{ cleared: number, errors: number, totalSize: number }`

#### async size()
Returns the number of active (non-expired) cached items.
- **Returns**: Number of active entries

#### async stats()
Provides detailed cache statistics with persistent hit tracking.
- **Returns**: Statistics object with hit rate calculated as:
  ```
  hitRate = totalHits / (totalHits + items + expired)
  ```
  Where:
  - `totalHits`: Sum of all persistent `meta.hits` values
  - `items`: Number of active cache entries
  - `expired`: Number of expired entries cleaned up

### Metadata Structure

Each cache entry has an associated `.meta` file containing:
```javascript
{
  "key": "original-key",
  "namespace": "files",
  "created": 1704123456789,
  "expires": 1704123756789,
  "lastAccess": 1704123556789,
  "size": 12345,
  "hits": 42  // Persistent hit counter
}
```

## Singleton Instances

Pre-configured cache instances with appropriate TTLs:

```javascript
export const commandCache = new UnifiedCache("commands", { ttl: 5 * 60 * 1000 });
export const fileCache = new UnifiedCache("files", { ttl: 10 * 60 * 1000 });
export const searchCache = new UnifiedCache("search", { ttl: 30 * 60 * 1000 });
export const conversationCache = new UnifiedCache("conversations", { ttl: 7 * 24 * 60 * 60 * 1000 });
```

## Utility Functions

### formatBytes(bytes, decimals = 2)
Formats byte values into human-readable strings.
- **Parameters**: 
  - `bytes` (number): Number of bytes
  - `decimals` (number): Decimal places (default: 2)
- **Returns**: Formatted string (e.g., "1.23 KB")

## Important Notes

1. **Persistent Hit Tracking**: Hit counts are stored in metadata files and persist across server restarts
2. **Deprecated Runtime Tracking**: The `_attempts` object is deprecated as it doesn't persist between MCP calls
3. **Atomic Operations**: All writes use atomic operations to prevent corruption
4. **Automatic Cleanup**: Expired entries are cleaned up during `get()` and `stats()` operations
