# cache-warm-readmes.js

## File Information

- **Path**: `./scripts/cache-warm-readmes.js`
- **Language**: javascript
- **Lines**: 247
- **Size**: 5.8KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.530Z

## Overview

cache-warm-readmes.js - Pre-cache README files for fast access

## Dependencies

- `fs`
- `child_process`
- `path`
- `os`
- `../modules/file-ops.js`
- `../modules/unified-cache.js`

## Exports

- `async` (value)

## Functions

### run

**Signature:**
```javascript
export async function run(args = {})
```

**Parameters:**
- `args = {}`

### findReadmeFiles

**Signature:**
```javascript
async function findReadmeFiles(directory, options)
```

**Parameters:**
- `directory`
- `options`

### detectTableOfContents

**Signature:**
```javascript
function detectTableOfContents(content)
```

**Parameters:**
- `content`

### extractSections

**Signature:**
```javascript
function extractSections(content)
```

**Parameters:**
- `content`

### formatSize

**Signature:**
```javascript
function formatSize(bytes)
```

**Parameters:**
- `bytes`

## Script Details

- **Command**: `apex cache-warm-readmes`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex cache-warm-readmes

// With arguments
apex cache-warm-readmes --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/cache-warm-readmes.js)
