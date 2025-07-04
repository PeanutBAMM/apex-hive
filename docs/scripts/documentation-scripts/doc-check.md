# doc-check.js

## File Information

- **Path**: `./scripts/doc-check.js`
- **Language**: javascript
- **Lines**: 131
- **Size**: 3.3KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.606Z

## Overview

doc-check.js - Quick documentation health check

## Dependencies

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

### checkFile

**Signature:**
```javascript
async function checkFile(filePath, name, required = true)
```

**Parameters:**
- `filePath`
- `name`
- `required = true`

### checkDirectory

**Signature:**
```javascript
async function checkDirectory(dirPath, name)
```

**Parameters:**
- `dirPath`
- `name`

## Script Details

- **Command**: `apex doc-check`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-check

// With arguments
apex doc-check --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/doc-check.js)
