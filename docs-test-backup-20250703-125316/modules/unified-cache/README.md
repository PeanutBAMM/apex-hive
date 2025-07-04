# Module: Unified Cache

## Overview

The Unified Cache module provides a persistent, file-based caching system with TTL support for Apex Hive. It offers high-performance caching with automatic expiration, namespace isolation, and comprehensive statistics tracking.

## Key Features

- **Persistent Storage**: Survives between MCP calls and process restarts
- **TTL Support**: Automatic expiration of cached items
- **Namespace Isolation**: Separate cache stores for different data types
- **Performance**: 80-90% cache hit rate in typical usage
- **Statistics**: Detailed tracking of hits, misses, and performance metrics

## Usage

```javascript
import { get, set, clear, getStats } from "../modules/unified-cache.js";

// Store data with TTL
await set("files", "readme-content", fileContent, { ttl: 86400000 }); // 24 hours

// Retrieve data
const cached = await get("files", "readme-content");
if (cached) {
  console.log("Cache hit!");
}

// Clear namespace
await clear("files");

// Get statistics
const stats = await getStats("files");
console.log(`Hit rate: ${stats.hitRate}%`);
```

## Functions

### [get(namespace, key)](./get.md)
Retrieves a cached value by namespace and key

### [set(namespace, key, value, options)](./set.md)
Stores a value in the cache with optional TTL

### [clear(namespace)](./clear.md)
Clears all entries in a namespace or entire cache

### [getStats(namespace)](./stats.md)
Returns cache statistics for monitoring

## Performance

- **Cache Hit**: ~1-2ms
- **Cache Miss**: ~5-10ms (includes file I/O)
- **Memory Usage**: Minimal (file-based storage)
- **Typical Hit Rate**: 80-90%

## Best Practices

1. Use appropriate TTLs for different data types
2. Monitor cache statistics regularly
3. Clear stale data periodically
4. Use namespaces to organize cache data

## See Also

- [Cache Architecture](../../architecture/cache-architecture.md)
- [Performance Guide](../../performance/caching-strategies.md)
- [File Operations Module](../file-ops/README.md)