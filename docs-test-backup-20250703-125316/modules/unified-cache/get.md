# get(namespace, key)

Retrieves a cached value from the specified namespace.

## Syntax

```javascript
await get(namespace, key)
```

## Parameters

### namespace
- **Type**: `string`
- **Required**: Yes
- **Description**: The cache namespace to retrieve from (e.g., "files", "conversations", "commands")

### key
- **Type**: `string`
- **Required**: Yes
- **Description**: The unique identifier for the cached item

## Returns

- **Type**: `any | null`
- **Description**: Returns the cached value if found and not expired, otherwise `null`

## Examples

### Basic Usage

```javascript
import { get } from "../modules/unified-cache.js";

// Retrieve cached file content
const content = await get("files", "README.md");
if (content) {
  console.log("Found in cache!");
} else {
  console.log("Cache miss - need to read from disk");
}
```

### With Error Handling

```javascript
try {
  const cached = await get("commands", "git-status");
  if (cached) {
    return cached; // Use cached result
  }
  // Fall back to executing command
  const result = await executeCommand("git status");
  return result;
} catch (error) {
  console.error("Cache error:", error);
  // Continue without cache
}
```

### Checking Multiple Keys

```javascript
const keys = ["file1.js", "file2.js", "file3.js"];
const results = await Promise.all(
  keys.map(key => get("files", key))
);

const hits = results.filter(r => r !== null).length;
console.log(`Cache hits: ${hits}/${keys.length}`);
```

## Performance

- **Cache Hit**: 1-2ms average
- **Cache Miss**: 5-10ms (includes file check)
- **Expired Entry**: Same as cache miss

## Notes

- Automatically checks TTL and returns `null` for expired entries
- Thread-safe for concurrent access
- Returns parsed JSON objects, not raw strings
- Tracks statistics (hits/misses) automatically

## See Also

- [set()](./set.md) - Store values in cache
- [getStats()](./stats.md) - View cache statistics
- [clear()](./clear.md) - Clear cache entries