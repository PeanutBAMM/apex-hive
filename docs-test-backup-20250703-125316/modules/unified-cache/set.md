# set(namespace, key, value, options)

Stores a value in the cache with optional TTL and metadata.

## Syntax

```javascript
await set(namespace, key, value, options)
```

## Parameters

### namespace
- **Type**: `string`
- **Required**: Yes
- **Description**: The cache namespace (e.g., "files", "conversations", "commands")

### key
- **Type**: `string`
- **Required**: Yes
- **Description**: Unique identifier for the cached item

### value
- **Type**: `any`
- **Required**: Yes
- **Description**: The value to cache (will be JSON serialized)

### options
- **Type**: `object`
- **Required**: No
- **Properties**:
  - `ttl` (number): Time to live in milliseconds
  - `metadata` (object): Additional metadata to store

## Returns

- **Type**: `void`
- **Description**: Returns nothing, throws on error

## Examples

### Basic Usage

```javascript
import { set } from "../modules/unified-cache.js";

// Cache file content for 24 hours
await set("files", "README.md", fileContent, {
  ttl: 24 * 60 * 60 * 1000 // 24 hours
});
```

### With Metadata

```javascript
// Cache with metadata
await set("commands", "git-status", result, {
  ttl: 5 * 60 * 1000, // 5 minutes
  metadata: {
    timestamp: Date.now(),
    command: "git status",
    directory: process.cwd()
  }
});
```

### Caching Search Results

```javascript
const searchResults = await performSearch(query);
await set("search", query, searchResults, {
  ttl: 30 * 60 * 1000, // 30 minutes
  metadata: {
    resultCount: searchResults.length,
    searchTime: Date.now()
  }
});
```

### Default TTLs by Namespace

```javascript
// Recommended TTL values
const TTL_DEFAULTS = {
  files: 24 * 60 * 60 * 1000,      // 24 hours
  conversations: 7 * 24 * 60 * 60 * 1000, // 7 days
  commands: 5 * 60 * 1000,          // 5 minutes
  search: 30 * 60 * 1000,           // 30 minutes
  config: 60 * 60 * 1000            // 1 hour
};

await set("files", key, value, { ttl: TTL_DEFAULTS.files });
```

## Performance

- **Write Time**: 5-15ms (includes file I/O)
- **Large Values**: May take longer for MB+ payloads
- **Concurrent Writes**: Handled with file locking

## Notes

- Values are JSON serialized before storage
- Creates namespace directory if it doesn't exist
- Overwrites existing values with same key
- File locking prevents corruption during concurrent access
- Maximum recommended value size: 10MB

## Error Handling

```javascript
try {
  await set("files", "large-file.dat", bigData, { ttl: 3600000 });
} catch (error) {
  if (error.code === 'ENOSPC') {
    console.error("Disk full!");
  } else {
    console.error("Cache write failed:", error);
  }
}
```

## See Also

- [get()](./get.md) - Retrieve cached values
- [clear()](./clear.md) - Clear cache entries
- [getStats()](./stats.md) - Monitor cache performance