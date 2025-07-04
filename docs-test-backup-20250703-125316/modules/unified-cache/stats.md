# getStats(namespace)

Returns comprehensive cache statistics for monitoring and optimization.

## Syntax

```javascript
await getStats(namespace)
```

## Parameters

### namespace
- **Type**: `string | undefined`
- **Required**: No
- **Description**: Specific namespace to get stats for. If omitted, returns global stats.

## Returns

- **Type**: `object`
- **Properties**:
  - `hits`: Total cache hits
  - `misses`: Total cache misses
  - `entries`: Current number of cached entries
  - `size`: Total cache size in bytes
  - `hitRate`: Hit rate percentage (0-100)
  - `oldestEntry`: Timestamp of oldest entry
  - `newestEntry`: Timestamp of newest entry
  - `namespaces`: Object with per-namespace stats (global only)

## Examples

### Basic Usage

```javascript
import { getStats } from "../modules/unified-cache.js";

// Get stats for files namespace
const stats = await getStats("files");
console.log(`Files cache hit rate: ${stats.hitRate}%`);
console.log(`Total entries: ${stats.entries}`);
console.log(`Cache size: ${(stats.size / 1024).toFixed(2)} KB`);
```

### Global Statistics

```javascript
// Get overall cache stats
const globalStats = await getStats();
console.log("=== Global Cache Statistics ===");
console.log(`Total hit rate: ${globalStats.hitRate}%`);
console.log(`Total size: ${(globalStats.size / 1024 / 1024).toFixed(2)} MB`);

// Show per-namespace breakdown
for (const [ns, nsStats] of Object.entries(globalStats.namespaces)) {
  console.log(`\n${ns}:`);
  console.log(`  Entries: ${nsStats.entries}`);
  console.log(`  Hit rate: ${nsStats.hitRate}%`);
  console.log(`  Size: ${(nsStats.size / 1024).toFixed(2)} KB`);
}
```

### Performance Monitoring

```javascript
// Monitor cache performance over time
async function monitorCache() {
  const stats = await getStats("files");
  
  if (stats.hitRate < 70) {
    console.warn("Low cache hit rate - consider increasing TTL");
  }
  
  if (stats.size > 100 * 1024 * 1024) { // 100MB
    console.warn("Cache size exceeding limits - consider cleanup");
  }
  
  const age = Date.now() - stats.oldestEntry;
  if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
    console.log("Cache contains entries older than 7 days");
  }
}
```

### Detailed Analysis

```javascript
async function analyzeCacheUsage() {
  const stats = await getStats();
  
  // Find most active namespace
  let maxHits = 0;
  let mostActive = "";
  
  for (const [ns, nsStats] of Object.entries(stats.namespaces)) {
    if (nsStats.hits > maxHits) {
      maxHits = nsStats.hits;
      mostActive = ns;
    }
  }
  
  console.log(`Most active namespace: ${mostActive} (${maxHits} hits)`);
  
  // Calculate average entry size
  const avgSize = stats.size / stats.entries;
  console.log(`Average entry size: ${(avgSize / 1024).toFixed(2)} KB`);
  
  // Show cache efficiency
  const efficiency = (stats.hits / (stats.hits + stats.misses)) * 100;
  console.log(`Cache efficiency: ${efficiency.toFixed(2)}%`);
}
```

## Statistics Persistence

Cache statistics persist between MCP calls:

```javascript
// First MCP call
await set("files", "test.js", content);
const stats1 = await getStats("files");
console.log(`Hits: ${stats1.hits}`); // e.g., 0

// Second MCP call (stats preserved)
await get("files", "test.js");
const stats2 = await getStats("files");
console.log(`Hits: ${stats2.hits}`); // e.g., 1
```

## Performance

- **Execution Time**: 5-20ms depending on cache size
- **Memory Usage**: Minimal (reads directory stats)

## Use Cases

1. **Performance Monitoring**: Track cache effectiveness
2. **Capacity Planning**: Monitor growth trends
3. **Debugging**: Identify cache issues
4. **Optimization**: Tune TTL values based on hit rates

## See Also

- [clear()](./clear.md) - Clear cache when size exceeds limits
- [set()](./set.md) - Configure TTL for better hit rates
- [get()](./get.md) - Retrieve cached values