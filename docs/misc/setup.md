# setup.js

## File Information

- **Path**: `./test/setup.js`
- **Language**: javascript
- **Lines**: 50
- **Size**: 1.2KB
- **Type**: Test
- **Last Modified**: 2025-07-04T19:34:18.551Z

## Overview

Test suite for setup functionality.

## Dependencies

- `url`
- `path`
- `fs/promises`
- `fs`

## Exports

- `TEST_CACHE_DIR` (const)
- `async` (value)
- `async` (value)
- `delay` (function)
- `generateTestData` (function)
- `mockConsole` (function)

## Functions

### setupTestCache

**Signature:**
```javascript
export async function setupTestCache()
```

### cleanupTestCache

**Signature:**
```javascript
export async function cleanupTestCache()
```

### delay

**Signature:**
```javascript
export function delay(ms)
```

**Parameters:**
- `ms`

### generateTestData

**Signature:**
```javascript
export function generateTestData(size = 100)
```

**Parameters:**
- `size = 100`

### mockConsole

**Signature:**
```javascript
export function mockConsole()
```

## Test Details


## Usage

```javascript
// Import and use this component
import Component from './test/setup.js';
```

## Related Documentation


## See Also

- [Source Code](./test/setup.js)
