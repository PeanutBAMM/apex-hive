# doc-cleanup-prefixes.js

## File Information

- **Path**: `./scripts/doc-cleanup-prefixes.js`
- **Language**: javascript
- **Lines**: 140
- **Size**: 4.2KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.614Z

## Overview

doc-cleanup-prefixes.js - Remove numbered prefixes from documentation files

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

### scanAndRename

**Signature:**
```javascript
async function scanAndRename(dir, renamedFiles, dryRun)
```

**Parameters:**
- `dir`
- `renamedFiles`
- `dryRun`

## Script Details

- **Command**: `apex doc-cleanup-prefixes`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-cleanup-prefixes

// With arguments
apex doc-cleanup-prefixes --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/doc-cleanup-prefixes.js)
