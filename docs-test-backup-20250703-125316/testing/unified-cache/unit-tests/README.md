# Unified Cache Unit Tests

Detailed documentation of unit tests for the Unified Cache module.

## Test Categories

### 1. Constructor Tests
Tests cache initialization and configuration:
- Default options validation
- Custom options handling
- Directory path creation
- Namespace isolation

### 2. Basic Operations
Core get/set/delete functionality:
- **Set Operations**
  - String values
  - Object serialization
  - Large payloads
  - Unicode handling
- **Get Operations**
  - Cache hits
  - Cache misses
  - Expired entries
  - Corrupted data handling
- **Delete Operations**
  - Single key deletion
  - Non-existent key handling

### 3. TTL Management
Time-to-live functionality:
- TTL setting and retrieval
- Expiration checking
- Auto-cleanup of expired entries
- Custom TTL per entry

### 4. Statistics Tracking
Cache performance metrics:
- Hit/miss counting
- Hit rate calculation
- Size tracking
- Entry counting

### 5. Namespace Operations
Multi-namespace support:
- Namespace isolation
- Cross-namespace operations
- Namespace clearing
- Namespace statistics

### 6. Error Handling
Robust error management:
- File system errors
- JSON parse errors
- Permission errors
- Disk space errors

## Example Test Cases

### Basic Set/Get Test
```javascript
describe('Basic Operations', () => {
  test('should set and get string value', async () => {
    const key = 'test-key';
    const value = 'test-value';
    
    await cache.set(key, value);
    const result = await cache.get(key);
    
    expect(result).toBe(value);
  });
});
```

### TTL Expiration Test
```javascript
describe('TTL Management', () => {
  test('should expire entries after TTL', async () => {
    await cache.set('key', 'value', { ttl: 100 });
    
    // Should exist immediately
    expect(await cache.get('key')).toBe('value');
    
    // Wait for expiration
    await delay(150);
    
    // Should be expired
    expect(await cache.get('key')).toBeNull();
  });
});
```

### Statistics Test
```javascript
describe('Statistics', () => {
  test('should track hit rate correctly', async () => {
    await cache.set('key1', 'value1');
    
    await cache.get('key1'); // Hit
    await cache.get('key2'); // Miss
    await cache.get('key1'); // Hit
    
    const stats = await cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(66.67);
  });
});
```

## Test Utilities

### Mock Data Generation
```javascript
function generateTestData(size) {
  return {
    id: Math.random().toString(36),
    data: 'x'.repeat(size),
    timestamp: Date.now()
  };
}
```

### Timing Helpers
```javascript
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Cache State Verification
```javascript
async function verifyCacheState(cache, expectedEntries) {
  const stats = await cache.getStats();
  expect(stats.entries).toBe(expectedEntries);
}
```

## Coverage Details

| Test Category | Coverage | Critical Tests |
|--------------|----------|----------------|
| Constructor | 100% | ✓ All paths covered |
| Get/Set | 98% | ✓ Edge cases included |
| TTL | 95% | ✓ Timing sensitive |
| Statistics | 100% | ✓ Calculation accuracy |
| Clear | 100% | ✓ Cleanup verified |
| Errors | 90% | ✓ Major errors handled |

## Running Specific Tests

```bash
# Run only constructor tests
npm test -- -t "Constructor"

# Run TTL tests with timing details
npm test -- -t "TTL" --verbose

# Run with coverage for specific file
npm test -- --coverage --collectCoverageFrom=modules/unified-cache.js
```

## See Also

- [Integration Tests](../integration-tests/)
- [Test Setup Guide](../../setup.md)
- [Jest Documentation](https://jestjs.io/docs/getting-started)