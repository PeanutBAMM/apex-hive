# Unified Cache Integration Tests

Integration tests that verify the Unified Cache module in real-world scenarios.

## Test Scenarios

### 1. Multi-Process Access
Tests cache behavior with multiple processes:
- Concurrent reads and writes
- File locking mechanisms
- Data consistency
- Race condition handling

### 2. Large Scale Operations
Performance under load:
- Batch operations (1000+ items)
- Large file caching (MB+ sizes)
- Memory usage monitoring
- Disk space management

### 3. System Integration
Interaction with other modules:
- File-ops module integration
- Logger integration
- Error propagation
- Event handling

### 4. Real File System
Actual file system operations:
- Directory creation/deletion
- Permission handling
- Disk full scenarios
- Network drive support

## Key Integration Tests

### Concurrent Access Test
```javascript
test('handles concurrent access from multiple operations', async () => {
  const operations = [];
  
  // Simulate 50 concurrent operations
  for (let i = 0; i < 50; i++) {
    operations.push(
      cache.set(`key-${i}`, `value-${i}`),
      cache.get(`key-${Math.floor(Math.random() * i)}`),
      cache.getStats()
    );
  }
  
  const results = await Promise.allSettled(operations);
  const failures = results.filter(r => r.status === 'rejected');
  
  expect(failures.length).toBe(0);
});
```

### Large File Test
```javascript
test('handles large file caching efficiently', async () => {
  const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
  
  const startTime = Date.now();
  await cache.set('large-file', largeData);
  const writeTime = Date.now() - startTime;
  
  const getStart = Date.now();
  const retrieved = await cache.get('large-file');
  const readTime = Date.now() - getStart;
  
  expect(retrieved).toBe(largeData);
  expect(writeTime).toBeLessThan(100); // Should be fast
  expect(readTime).toBeLessThan(50);   // Read should be faster
});
```

### Cross-Module Integration
```javascript
test('integrates with file-ops module', async () => {
  // Use cache through file-ops
  const { readFile, writeFile } = require('../../modules/file-ops.js');
  
  // Write through file-ops (should cache)
  await writeFile('test.txt', 'content');
  
  // Read should hit cache
  const stats1 = await cache.getStats();
  const content = await readFile('test.txt');
  const stats2 = await cache.getStats();
  
  expect(content).toBe('content');
  expect(stats2.hits).toBe(stats1.hits + 1);
});
```

## Performance Benchmarks

### Throughput Tests
| Operation | Items/sec | Latency (p95) |
|-----------|-----------|---------------|
| Set | 1000+ | <10ms |
| Get (hit) | 5000+ | <2ms |
| Get (miss) | 2000+ | <5ms |
| Delete | 3000+ | <3ms |

### Memory Usage
- Base memory: ~10MB
- Per 1000 items: ~5MB
- Max tested: 100K items (~500MB)

## Stress Testing

### Disk Full Scenario
```javascript
test('handles disk full gracefully', async () => {
  // Fill cache until disk full
  let error;
  try {
    for (let i = 0; i < 1000000; i++) {
      await cache.set(`key${i}`, 'x'.repeat(1024));
    }
  } catch (e) {
    error = e;
  }
  
  expect(error).toBeDefined();
  expect(error.code).toBe('ENOSPC');
  
  // Cache should still be readable
  const stats = await cache.getStats();
  expect(stats).toBeDefined();
});
```

### Recovery Testing
```javascript
test('recovers from corrupted cache files', async () => {
  // Corrupt a cache file
  await cache.set('test', 'value');
  const filePath = path.join(cache.cacheDir, 'test.json');
  await fs.writeFile(filePath, 'invalid json{');
  
  // Should handle gracefully
  const result = await cache.get('test');
  expect(result).toBeNull();
  
  // Should be able to write again
  await cache.set('test', 'new-value');
  expect(await cache.get('test')).toBe('new-value');
});
```

## Test Environment

### Setup Requirements
- Node.js 18+
- 100MB free disk space
- Write permissions in test directory
- No antivirus interference

### Configuration
```javascript
// Test environment settings
const TEST_CONFIG = {
  cacheDir: '.test-cache',
  maxTestDuration: 30000, // 30 seconds
  concurrentTests: 5
};
```

## Running Integration Tests

```bash
# Run all integration tests
npm test -- integration

# Run with extended timeout
npm test -- integration --testTimeout=60000

# Run specific integration test
npm test -- -t "concurrent access"
```

## Known Issues

1. **Windows File Locking**: Some tests may fail on Windows due to file locking
2. **CI Environment**: Reduced concurrency in CI to prevent timeouts
3. **Network Drives**: Slower performance on network-mounted drives

## See Also

- [Unit Tests](../unit-tests/)
- [Performance Benchmarks](../../../performance/)
- [System Architecture](../../../architecture/)