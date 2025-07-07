# Unified Cache System - Complete Reference

## 🚀 Overview

Apex Hive uses a sophisticated unified file-based cache system that provides persistent, high-performance caching across MCP server restarts and Claude sessions. This system significantly improves performance by caching frequently accessed files, search results, and command outputs.

## 📦 Cache Architecture

### Core Implementation

The cache system is built around the `UnifiedCache` class located in `/modules/unified-cache.js`. This class provides:

- **Persistent Storage**: File-based cache that survives server restarts
- **Atomic Operations**: Prevents corruption during writes
- **TTL Management**: Automatic expiration with configurable time-to-live
- **Hit Tracking**: Performance metrics and usage statistics
- **Namespace Isolation**: Separate cache spaces for different data types

### Storage Structure

```
~/.apex-cache/
├── commands/       # Command execution results
├── files/         # README and documentation files
├── search/        # Search results from ripgrep
└── conversations/ # Conversation summaries
```

Each cache entry consists of two files:
- `{md5hash}.cache` - The actual cached data (JSON format)
- `{md5hash}.cache.meta` - Metadata (expiry, hits, size, timestamps)

### Cache Namespaces

| Namespace | TTL | Purpose | Size Limit | Singleton Variable |
|-----------|-----|---------|------------|-------------------|
| commands | 5 minutes | Command outputs | 100MB | `commandCache` |
| files | 10 minutes | README/docs | 100MB | `fileCache` |
| search | 30 minutes | Search results | 100MB | `searchCache` |
| conversations | 7 days | Conversation summaries | 10MB | `conversationCache` |

## 🔧 UnifiedCache Class API

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

### Core Methods

#### `async get(key)`
Retrieves a cached value by key.
- **Returns**: Cached data or `null` if not found/expired
- **Side Effects**: 
  - Updates persistent `meta.hits` counter in metadata file
  - Updates `meta.lastAccess` timestamp
- **Automatic Cleanup**: Removes expired entries
- **Hit Tracking**: Increments the persistent hit counter on successful retrieval

#### `async set(key, value, options = {})`
Stores a value in the cache.
- **Parameters**:
  - `key` (string): Cache key
  - `value` (any): Data to cache (will be JSON serialized)
  - `options.ttl` (number): Override default TTL
- **Returns**: `true` on success, `false` on failure
- **Features**: Atomic writes, size validation

#### `async has(key)`
Checks if a key exists and is not expired.
- **Returns**: `true` if key exists and valid

#### `async delete(key)`
Removes a cache entry.
- **Returns**: `true` if deleted, `false` if key doesn't exist
- **Checks**: Verifies files exist before attempting deletion

#### `async clear()`
Removes all entries from the namespace.
- **Returns**: Object with clearing details:
  ```javascript
  {
    cleared: 10,      // Number of cache entries cleared
    errors: 0,        // Number of errors encountered
    totalSize: 12345  // Total bytes freed
  }
  ```

#### `async size()`
Returns the number of cached items.
- **Returns**: Number of active (non-expired) cache entries
- **Note**: Automatically excludes expired entries

#### `async stats()`
Provides detailed cache statistics with persistent hit tracking.
- **Returns**: Comprehensive statistics object:
  ```javascript
  {
    namespace: "files",
    totalSize: 45678,
    entries: [...],        // Top 10 entries by hit count
    count: 23,            // Total active entries
    hitRate: 0.76,        // Hit rate calculated from persistent data
    oldestEntry: {...},   // Oldest cached item
    newestEntry: {...},   // Newest cached item
    // Legacy properties for backward compatibility:
    items: 23,            // Same as count
    totalHits: 342,       // Sum of all meta.hits
    expired: 5,           // Number of expired entries cleaned up
    active: [...]         // Same as entries
  }
  ```
- **Hit Rate Calculation**: 
  - Formula: `totalHits / (totalHits + items + expired)`
  - Based entirely on persistent metadata, not runtime state
  - Accurate across MCP server restarts

### Performance Features

#### Atomic Operations
All cache writes use atomic operations to prevent corruption:
1. Write to temporary files (`.tmp` extension)
2. Rename to final filenames atomically
3. Prevents partial writes during crashes

#### Automatic Cleanup
- Expired entries are automatically removed during `get()` operations
- `stats()` method cleans up expired entries during analysis
- No background cleanup processes needed

#### Hit Tracking

The cache system uses **persistent hit tracking** that survives across MCP server restarts and Claude sessions:

- **Persistent Storage**: Hit counts are stored in the `.meta` files alongside cache entries
- **Automatic Updates**: Each successful cache retrieval increments the `meta.hits` counter
- **No Runtime State**: The deprecated `_attempts` object is no longer used for tracking
- **Hit Rate Calculation**: Calculated as `totalHits / (totalHits + items + expired)`
  - `totalHits`: Sum of all `meta.hits` values from active entries
  - `items`: Number of active cache entries (represents initial misses)
  - `expired`: Number of expired entries (represents cache misses)

Each cache entry's metadata tracks:
- **Creation time**: When the entry was first cached
- **Last access**: When the entry was last retrieved
- **Hit count**: Number of successful cache retrievals (persistent)
- **Size**: Storage size in bytes

## 🎯 Cache Commands

### 1. Cache Status Monitoring

```bash
# Basic overview
apex cache:status

# Detailed statistics
apex cache:status --detailed
```

**Output Example:**
```json
{
  "totalCaches": 4,
  "totalItems": 47,
  "totalSize": "89.3 KB",
  "totalHits": 342,
  "averageHitRate": "7.28",
  "namespaces": {
    "files": { "items": 23, "size": "45.2 KB", "hits": 187 },
    "search": { "items": 15, "size": "28.7 KB", "hits": 98 },
    "commands": { "items": 6, "size": "12.1 KB", "hits": 45 },
    "conversations": { "items": 3, "size": "3.3 KB", "hits": 12 }
  }
}
```

### 2. Cache Warming Commands

#### README Files
```bash
apex cache:warm-readmes
```
- Searches for all README files in the project
- Excludes node_modules and build directories
- Caches with 24-hour TTL for quick access

#### High-Value Documentation
```bash
apex cache:warm-docs
```
- Pre-caches 8 critical documentation files:
  - `commands-reference.md`
  - `architecture.md`
  - `troubleshooting.md`
  - `development.md`
  - `caching.md`
  - `natural-language.md`
  - `recipes.md`
  - `getting-started.md`

#### Conversation Summaries
```bash
apex cache:warm-conversations
```
- Caches the last 5 conversation summaries
- Enables quick access to recent context
- 7-day TTL for conversation memory

#### Combined Warming
```bash
apex cache:warm-all
```
- Runs all warming operations in sequence
- Provides comprehensive cache coverage
- Returns combined statistics

### 3. Cache Management

#### Clear All Caches
```bash
apex cache:clear
```
- Removes all cached entries from all namespaces
- Provides detailed statistics about what was cleared
- Returns information per namespace:
  ```json
  {
    "cleared": {
      "files": { "cleared": 21, "errors": 0, "totalSize": 107644 },
      "conversations": { "cleared": 5, "errors": 0, "totalSize": 12963 },
      "commands": { "cleared": 0, "errors": 0, "totalSize": 0 },
      "search": { "cleared": 0, "errors": 0, "totalSize": 0 },
      "total": 26
    },
    "totalCleared": 26,
    "size": "112.89 KB"
  }
  ```

#### Manual Cache Operations
```bash
# Clear specific namespace (not exposed as command)
import { fileCache } from './modules/unified-cache.js';
await fileCache.clear();
```

## 🔗 Integration Points

### Module Integration

#### Search Module (`/modules/search.js`)
```javascript
import { searchCache } from './unified-cache.js';

// Cache search results
await searchCache.set(searchKey, results, { ttl: 1800000 }); // 30 min
```

#### File Operations (`/modules/file-ops.js`)
```javascript
import { fileCache } from './unified-cache.js';

// Cache file contents
await fileCache.set(filePath, { content, metadata });
```

#### Command Registry (`/config/registry.js`)
All cache commands are registered in the apex command system:
```javascript
"cache:warm-readmes": "./scripts/cache-warm-readmes.js",
"cache:warm-docs": "./scripts/cache-warm-docs.js",
"cache:warm-conversations": "./scripts/cache-warm-conversations.js",
"cache:warm-all": "./scripts/cache-warm-all.js",
"cache:clear": "./scripts/cache-clear.js",
"cache:status": "./scripts/cache-status.js"
```

### Natural Language Support

The cache system supports natural language commands through the apex router:

**English Patterns:**
- "warm the cache" → `cache:warm-all`
- "clear cache" → `cache:clear`
- "check cache status" → `cache:status`

**Dutch Patterns:**
- "warm de cache" → `cache:warm-all`
- "maak cache leeg" → `cache:clear`
- "toon cache status" → `cache:status`

## 📊 Performance Characteristics

### Speed Improvements

| Operation | Without Cache | With Cache | Improvement |
|-----------|---------------|------------|-------------|
| README read | 50-100ms | 0.1-1ms | 50-1000x faster |
| Search results | 200-500ms | 1-5ms | 100-500x faster |
| Doc file access | 10-50ms | 0.1-1ms | 100-500x faster |

### Cache Hit Rates

Typical hit rates in development workflows:
- **File Cache**: 80-90% (README files, documentation)
- **Search Cache**: 60-70% (repeated searches)
- **Command Cache**: 40-60% (status checks)
- **Conversation Cache**: 95%+ (recent conversations)

### Storage Efficiency

- **Average cache size**: 50-100KB total
- **Memory footprint**: Minimal (file-based storage)
- **Disk usage**: Automatically managed with TTL cleanup
- **Network impact**: Zero (local file system only)
- **Metadata overhead**: ~200-300 bytes per cache entry for persistent tracking

## 🚨 Error Handling

### Graceful Degradation

The cache system is designed to fail gracefully:
- **Cache miss**: Falls back to original operation
- **Write failure**: Logs error, continues without caching
- **Corruption**: Automatically removes corrupted entries
- **Permission issues**: Handles filesystem access errors

### Common Issues & Solutions

#### Cache Directory Permissions
```bash
# Fix cache directory permissions
chmod 755 ~/.apex-cache/
chmod 644 ~/.apex-cache/*/*.cache*
```

#### Disk Space Issues
```bash
# Clear cache if disk space is low
apex cache:clear
```

#### Corrupted Cache Entries
```bash
# Cache automatically removes corrupted entries
# Manual cleanup if needed:
rm -rf ~/.apex-cache/*/corrupted-hash.*
```

## 🔧 Configuration

### Default Settings

```javascript
// Current TTL settings
const ttlSettings = {
  commands: 5 * 60 * 1000,        // 5 minutes
  files: 10 * 60 * 1000,         // 10 minutes  
  search: 30 * 60 * 1000,        // 30 minutes
  conversations: 7 * 24 * 60 * 60 * 1000  // 7 days
};

// Size limits  
const sizeLimits = {
  commands: 100 * 1024 * 1024,    // 100MB
  files: 100 * 1024 * 1024,      // 100MB
  search: 100 * 1024 * 1024,     // 100MB
  conversations: 10 * 1024 * 1024  // 10MB
};
```

### High-Value Documentation List

```javascript
// Configurable in /scripts/cache-warm-docs.js
const HIGH_VALUE_DOCS = [
  "docs/scripts/core-scripts/commands-reference.md",
  "docs/architecture/design/architecture.md", 
  "docs/troubleshooting/troubleshooting.md",
  "docs/development/development.md",
  "docs/03-reference/02-guides-unified-cache-system-complete.md",
  "docs/architecture/features/natural-language.md",
  "docs/architecture/reference/commands/recipes.md",
  "docs/getting-started/getting-started.md"
];
```

## 🎯 Usage Patterns

### Development Workflow

```bash
# Morning routine
apex cache:warm-all    # Pre-warm all caches

# During development
apex search "function" # Uses search cache
apex doc:generate     # Uses file cache

# End of day
apex cache:status     # Check cache performance
```

### Performance Optimization

```bash
# Before intensive operations
apex cache:warm-readmes   # Pre-cache documentation
apex cache:warm-docs      # Pre-cache guides

# Monitor performance
apex cache:status --detailed
```

### Troubleshooting

```bash
# Clear cache if issues occur
apex cache:clear

# Check cache health
apex cache:status

# Re-warm critical files
apex cache:warm-all
```

## 🧪 Testing the Cache System

### Test Setup

The cache system has comprehensive Jest tests located in `test/cache/`:

```bash
# Install test dependencies
npm install --save-dev jest @types/jest

# Run cache tests
npm test                    # Run all tests
npm test:watch             # Watch mode
npm test:coverage          # With coverage report
npm test test/cache/unified-cache.test.js  # Specific test file
```

### Test Configuration

Jest is configured for ES modules in `jest.config.js`:
```javascript
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', 'modules/**/*.js'],
  transform: {},  // No transform needed for ES modules
  moduleFileExtensions: ['js', 'json']
};
```

### Test Structure

```
test/
├── cache/
│   ├── unified-cache.test.js      # Core UnifiedCache class tests (37 tests)
│   └── cache-commands.test.js     # Integration tests (currently skipped)
└── setup.js                       # Test utilities and helpers
```

### Test Utilities

Available test helpers in `test/setup.js`:
- `setupTestCache()` - Create test cache directory
- `cleanupTestCache()` - Clean up after tests
- `delay(ms)` - Async delay for TTL testing
- `generateTestData(size)` - Generate test data of specific size
- `TEST_CACHE_DIR` - Test cache location

### Environment Variables

- `APEX_CACHE_DIR` - Override cache directory for testing (auto-set in tests)

### GitHub Actions Integration

Tests run automatically on:
- Push to master/main branch
- Pull requests to master/main
- Multiple Node.js versions (18.x, 20.x)

Workflow file: `.github/workflows/test.yml`

### Test Coverage

Current test coverage:
- **UnifiedCache Core**: 37 tests, 100% passing
- **Constructor**: 3 tests
- **get() method**: 6 tests
- **set() method**: 7 tests
- **has() method**: 3 tests
- **delete() method**: 3 tests
- **clear() method**: 3 tests
- **size() method**: 3 tests
- **stats() method**: 4 tests
- **TTL/Expiration**: 3 tests
- **Error Handling**: 2 tests

### Manual Testing

```bash
# Test cache operations
apex cache:warm-all
apex cache:status
apex cache:clear
apex cache:status

# Performance test
time apex cache:warm-all
time apex cache:status

# Concurrent access test
for i in {1..5}; do apex cache:status & done
```

## 📈 Monitoring

### Cache Metrics

Monitor cache performance with:
```bash
apex cache:status --detailed
```

Key metrics to track:
- **Hit rate**: Higher is better (>70% ideal)
- **Cache size**: Should stay under limits
- **Active items**: Number of cached entries
- **Expired items**: Should be low (auto-cleanup working)

### Performance Indicators

- **Fast response times**: <1ms for cached operations
- **Consistent performance**: No degradation over time
- **Storage efficiency**: Minimal disk usage growth
- **Memory stability**: No memory leaks

## 🔄 Maintenance

### Regular Tasks

1. **Monitor cache status** weekly
2. **Review hit rates** for optimization opportunities
3. **Update high-value docs list** as project evolves
4. **Clean old conversation summaries** monthly

### Optimization Tips

1. **Identify frequently accessed files** for pre-caching
2. **Adjust TTL values** based on content change frequency
3. **Monitor cache size** to prevent disk space issues
4. **Update cache warming lists** for new project patterns

---

*Last updated: 2025-07-01*
*Cache System Version: 2.0*
*Total Commands: 6*
*Total Namespaces: 4*