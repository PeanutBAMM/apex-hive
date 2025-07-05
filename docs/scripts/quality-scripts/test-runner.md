# test-runner.js

## File Information

- **Path**: `./scripts/test-runner.js`
- **Language**: javascript
- **Lines**: 236
- **Size**: 6.0KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.828Z

## Overview

test-runner.js - Smart test runner with multiple framework support

## Dependencies

- `child_process`
- `fs`
- `path`

## Exports

- `async` (value)

## Functions

### run

**Signature:**
```javascript
export async function run(args)
```

**Parameters:**
- `args`

### detectTestFramework

**Signature:**
```javascript
async function detectTestFramework()
```

### buildTestCommand

**Signature:**
```javascript
function buildTestCommand(framework, options)
```

**Parameters:**
- `framework`
- `options`

### parseTestOutput

**Signature:**
```javascript
function parseTestOutput(output, framework)
```

**Parameters:**
- `output`
- `framework`

### parseCoverageOutput

**Signature:**
```javascript
async function parseCoverageOutput(output, framework)
```

**Parameters:**
- `output`
- `framework`

## Script Details

- **Command**: `apex test-runner`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex test-runner

// With arguments
apex test-runner --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/test-runner.js)
