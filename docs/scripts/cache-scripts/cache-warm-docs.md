# cache-warm-docs.js

## File Information

- **Path**: `./scripts/cache-warm-docs.js`
- **Language**: javascript
- **Lines**: 217
- **Size**: 5.8KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.521Z

## Overview

cache-warm-docs.js - Pre-cache high-value documentation files for fast access

## Dependencies

- `fs`
- `path`
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

### determineCategory

**Signature:**
```javascript
function determineCategory(filePath)
```

**Parameters:**
- `filePath`

### formatSize

**Signature:**
```javascript
function formatSize(bytes)
```

**Parameters:**
- `bytes`

## Script Details

- **Command**: `apex cache-warm-docs`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex cache-warm-docs

// With arguments
apex cache-warm-docs --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/cache-warm-docs.js)
