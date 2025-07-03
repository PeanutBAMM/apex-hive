# Testing Guide

## 🧪 Overview

Apex Hive uses Jest for testing with full ES module support. This guide covers how to write, run, and maintain tests for the cache system and other components.

## 📋 Jest Setup for ES Modules

### Configuration

Jest is configured in `jest.config.js` to work with ES modules:

```javascript
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'modules/**/*.js',
    'scripts/**/*.js',
    '!**/node_modules/**'
  ],
  transform: {},  // No transform needed for ES modules
  moduleFileExtensions: ['js', 'json']
};
```

### Package.json Setup

Ensure your `package.json` has:

```json
{
  "type": "module",
  "scripts": {
    "test": "NODE_OPTIONS=\"--experimental-vm-modules\" jest",
    "test:watch": "NODE_OPTIONS=\"--experimental-vm-modules\" jest --watch",
    "test:coverage": "NODE_OPTIONS=\"--experimental-vm-modules\" jest --coverage"
  }
}
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test:watch

# Run tests with coverage report
npm test:coverage

# Run specific test file
npm test test/cache/unified-cache.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="cache"
```

### Test Output

Tests display:
- ✓ Passed tests in green
- ✗ Failed tests in red
- Test execution time
- Total test count and pass/fail summary

## 📁 Test Structure

```
test/
├── cache/
│   ├── unified-cache.test.js      # Core UnifiedCache class tests
│   └── cache-commands.test.js     # Integration tests for commands
├── modules/
│   ├── search.test.js             # Search module tests
│   └── file-ops.test.js           # File operations tests
├── scripts/
│   └── detect-issues.test.js      # Script tests
└── setup.js                       # Test utilities and helpers
```

## 🛠️ Test Utilities

### Available Helpers

The `test/setup.js` file provides utilities:

```javascript
// Create test cache directory
export function setupTestCache() {
  const testDir = path.join(os.tmpdir(), 'apex-test-cache');
  process.env.APEX_CACHE_DIR = testDir;
  return testDir;
}

// Clean up after tests
export function cleanupTestCache() {
  const testDir = process.env.APEX_CACHE_DIR;
  if (testDir && testDir.includes('apex-test-cache')) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// Async delay for TTL testing
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate test data of specific size
export function generateTestData(sizeInBytes) {
  return 'x'.repeat(sizeInBytes);
}
```

### Using Test Utilities

```javascript
import { setupTestCache, cleanupTestCache, delay } from '../setup.js';

describe('My Test Suite', () => {
  let testCacheDir;

  beforeAll(() => {
    testCacheDir = setupTestCache();
  });

  afterAll(() => {
    cleanupTestCache();
  });

  test('example test', async () => {
    // Your test code here
    await delay(100); // Wait 100ms
  });
});
```

## 💡 Writing Cache Tests

### Best Practices

1. **Isolate test environment**: Always use `setupTestCache()` to avoid polluting real cache
2. **Clean up after tests**: Use `cleanupTestCache()` in `afterAll()`
3. **Test both success and failure paths**: Include error handling tests
4. **Use descriptive test names**: Clearly state what the test verifies
5. **Keep tests focused**: One test should verify one behavior

### Example Test Structure

```javascript
import { UnifiedCache } from '../../modules/unified-cache.js';
import { setupTestCache, cleanupTestCache } from '../setup.js';

describe('UnifiedCache', () => {
  let cache;
  let testDir;

  beforeAll(() => {
    testDir = setupTestCache();
  });

  beforeEach(() => {
    cache = new UnifiedCache('test-namespace');
  });

  afterAll(() => {
    cleanupTestCache();
  });

  describe('set() method', () => {
    test('stores simple string value', async () => {
      const result = await cache.set('key1', 'value1');
      expect(result).toBe(true);
      
      const value = await cache.get('key1');
      expect(value).toBe('value1');
    });

    test('rejects oversized values', async () => {
      const bigValue = 'x'.repeat(200 * 1024 * 1024); // 200MB
      const result = await cache.set('big', bigValue);
      expect(result).toBe(false);
    });
  });
});
```

## 🔧 Troubleshooting Jest with ES Modules

### Common Issues

#### 1. "Cannot use import statement outside a module"
**Solution**: Ensure `"type": "module"` is in package.json

#### 2. "Jest encountered an unexpected token"
**Solution**: Add `NODE_OPTIONS="--experimental-vm-modules"` to test commands

#### 3. "Cannot find module" errors
**Solution**: Use full file paths with `.js` extension in imports:
```javascript
// ✗ Wrong
import { UnifiedCache } from '../../modules/unified-cache';

// ✓ Correct
import { UnifiedCache } from '../../modules/unified-cache.js';
```

#### 4. Mocking ES Modules
**Solution**: Use dynamic imports and Jest's module mocking:
```javascript
jest.unstable_mockModule('../../modules/logger.js', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      error: jest.fn()
    })
  }
}));

const { UnifiedCache } = await import('../../modules/unified-cache.js');
```

### Environment Variables

- `APEX_CACHE_DIR`: Override cache directory for testing
- `NODE_OPTIONS`: Required for ES module support in Jest
- `NODE_ENV`: Set to 'test' during test runs

## 🔗 GitHub Actions Integration

### Workflow Configuration

Tests run automatically via `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Upload coverage
      uses: actions/upload-artifact@v3
      with:
        name: coverage-${{ matrix.node-version }}
        path: coverage/
```

### CI Test Results

- ✅ Tests run on every push and PR
- 📊 Coverage reports uploaded as artifacts
- 🔄 Matrix testing on Node.js 18.x and 20.x
- 🚨 Failing tests block PR merges

## 📊 Coverage Reports

### Viewing Coverage

After running `npm test:coverage`:

```bash
# Open HTML coverage report
open coverage/lcov-report/index.html

# View console summary
cat coverage/lcov-report/index.html
```

### Coverage Targets

- **Statements**: 80% minimum
- **Branches**: 75% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### Improving Coverage

1. Run coverage to identify gaps
2. Look for uncovered lines in red
3. Add tests for error conditions
4. Test edge cases and boundaries
5. Verify all code paths are tested

## 🎯 Test Patterns

### Testing Async Operations

```javascript
test('async operation completes', async () => {
  const result = await cache.set('key', 'value');
  expect(result).toBe(true);
});

test('async operation fails gracefully', async () => {
  await expect(cache.get(null)).resolves.toBe(null);
});
```

### Testing Error Conditions

```javascript
test('handles file system errors', async () => {
  // Mock fs to throw error
  jest.spyOn(fs.promises, 'writeFile').mockRejectedValueOnce(
    new Error('EACCES: permission denied')
  );
  
  const result = await cache.set('key', 'value');
  expect(result).toBe(false);
});
```

### Testing Time-based Features

```javascript
test('expires entries after TTL', async () => {
  // Set with 100ms TTL
  await cache.set('key', 'value', { ttl: 100 });
  
  // Should exist immediately
  expect(await cache.has('key')).toBe(true);
  
  // Wait for expiration
  await delay(150);
  
  // Should be expired
  expect(await cache.has('key')).toBe(false);
});
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing ES Modules](https://jestjs.io/docs/ecmascript-modules)
- [Code Coverage](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [GitHub Actions for Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)

---

*Last updated: 2025-07-01*