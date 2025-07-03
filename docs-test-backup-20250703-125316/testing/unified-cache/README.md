# Unified Cache Testing

Comprehensive test documentation for the Unified Cache module.

## Test Overview

The Unified Cache module has extensive test coverage to ensure reliability and performance.

## Test Structure

### [Unit Tests](./unit-tests/)
Core functionality tests that run in isolation:
- Constructor and initialization
- Get/Set operations
- TTL expiration
- Cache clearing
- Statistics tracking
- Error handling

### [Integration Tests](./integration-tests/)
System-level tests that verify real-world scenarios:
- Multi-namespace operations
- Concurrent access patterns
- File system interactions
- Performance benchmarks
- Memory management

## Test Files

- **unified-cache.test.js** - Main test suite (800+ lines)
- Located in: `/test/cache/unified-cache.test.js`

## Key Test Scenarios

### Basic Operations
```javascript
test('set and get operations', async () => {
  await cache.set('key', 'value');
  const result = await cache.get('key');
  expect(result).toBe('value');
});
```

### TTL Testing
```javascript
test('TTL expiration', async () => {
  await cache.set('key', 'value', { ttl: 100 });
  await delay(150);
  const result = await cache.get('key');
  expect(result).toBeNull();
});
```

### Concurrent Access
```javascript
test('handles concurrent operations', async () => {
  const promises = Array(10).fill().map((_, i) => 
    cache.set(`key${i}`, `value${i}`)
  );
  await Promise.all(promises);
  // Verify all values
});
```

## Coverage Report

- **Lines**: 95%+
- **Functions**: 100%
- **Branches**: 90%+
- **Statements**: 95%+

## Performance Benchmarks

From test runs:
- Set operation: ~5-10ms
- Get operation (hit): ~1-2ms
- Get operation (miss): ~5ms
- Clear namespace: ~20ms

## Running Cache Tests

```bash
# Run only cache tests
npm test unified-cache

# Run with verbose output
npm test -- --verbose unified-cache

# Debug specific test
node --inspect-brk node_modules/.bin/jest unified-cache.test.js
```

## Common Test Utilities

### Test Setup
```javascript
beforeEach(async () => {
  await setupTestCache();
  cache = new UnifiedCache('test', { ttl: 1000 });
});
```

### Test Cleanup
```javascript
afterEach(async () => {
  await cache.clear();
  await cleanupTestCache();
});
```

## See Also

- [Unified Cache Module](../../modules/unified-cache/)
- [Cache Architecture](../../architecture/cache-architecture.md)
- [Performance Guide](../../performance/)