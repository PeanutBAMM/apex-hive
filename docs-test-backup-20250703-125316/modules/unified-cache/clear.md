# clear(namespace)

Clears cache entries from a specific namespace or the entire cache.

## Syntax

```javascript
await clear(namespace)
```

## Parameters

### namespace
- **Type**: `string | undefined`
- **Required**: No
- **Description**: The namespace to clear. If omitted, clears entire cache.

## Returns

- **Type**: `object`
- **Properties**:
  - `cleared`: Number of entries cleared
  - `size`: Total size of cleared data in bytes
  - `namespaces`: Array of affected namespaces

## Examples

### Clear Specific Namespace

```javascript
import { clear } from "../modules/unified-cache.js";

// Clear all cached files
const result = await clear("files");
console.log(`Cleared ${result.cleared} file entries (${result.size} bytes)`);
```

### Clear Entire Cache

```javascript
// Clear everything
const result = await clear();
console.log(`Cleared ${result.cleared} total entries`);
console.log(`Freed ${(result.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`Affected namespaces: ${result.namespaces.join(", ")}`);
```

### Selective Clearing Pattern

```javascript
// Clear old namespaces
const namespaces = ["temp", "old-search", "expired-commands"];
for (const ns of namespaces) {
  const result = await clear(ns);
  if (result.cleared > 0) {
    console.log(`Cleared ${ns}: ${result.cleared} entries`);
  }
}
```

### With Statistics Tracking

```javascript
import { clear, getStats } from "../modules/unified-cache.js";

// Get stats before clearing
const statsBefore = await getStats("files");
console.log(`Before: ${statsBefore.entries} entries, ${statsBefore.hitRate}% hit rate`);

// Clear and show results
const result = await clear("files");
console.log(`Cleared ${result.cleared} entries`);

// Verify cleared
const statsAfter = await getStats("files");
console.log(`After: ${statsAfter.entries} entries`); // Should be 0
```

## Performance

- **Single Namespace**: 10-50ms depending on entries
- **Entire Cache**: 50-200ms depending on total size
- **File System**: Uses `rm -rf` for efficiency

## Use Cases

1. **Memory Management**: Clear large namespaces when done
2. **Data Refresh**: Force fresh data retrieval
3. **Testing**: Clean state between test runs
4. **Maintenance**: Periodic cache cleanup

## Notes

- Removes entire namespace directory
- Cannot be undone - data is permanently deleted
- Safe to call on non-existent namespaces
- Statistics are preserved separately

## Error Handling

```javascript
try {
  const result = await clear("files");
  console.log(`Success: ${result.cleared} entries cleared`);
} catch (error) {
  console.error("Failed to clear cache:", error);
  // Cache remains unchanged on error
}
```

## See Also

- [set()](./set.md) - Store values in cache
- [get()](./get.md) - Retrieve cached values
- [getStats()](./stats.md) - View cache statistics before clearing