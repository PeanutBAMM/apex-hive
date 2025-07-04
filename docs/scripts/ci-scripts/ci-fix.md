# ci-fix.js

## File Information

- **Path**: `./scripts/ci-fix.js`
- **Language**: javascript
- **Lines**: 269
- **Size**: 6.5KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.549Z

## Overview

ci-fix.js - Automatically fix common CI issues

## Dependencies

- `child_process`
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

### fixTypeScriptError

**Signature:**
```javascript
async function fixTypeScriptError(error, fileOps)
```

**Parameters:**
- `error`
- `fileOps`

### fixESLintError

**Signature:**
```javascript
async function fixESLintError(error, fileOps)
```

**Parameters:**
- `error`
- `fileOps`

### fixModuleError

**Signature:**
```javascript
async function fixModuleError(error)
```

**Parameters:**
- `error`

### fixTestError

**Signature:**
```javascript
async function fixTestError(error, fileOps)
```

**Parameters:**
- `error`
- `fileOps`

### fixNpmError

**Signature:**
```javascript
async function fixNpmError(error)
```

**Parameters:**
- `error`

### runGeneralFixes

**Signature:**
```javascript
async function runGeneralFixes()
```

## Script Details

- **Command**: `apex ci-fix`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex ci-fix

// With arguments
apex ci-fix --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/ci-fix.js)
