# doc-sync.js

## File Information

- **Path**: `./scripts/doc-sync.js`
- **Language**: javascript
- **Lines**: 362
- **Size**: 8.9KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.664Z

## Overview

doc-sync.js - Sync documentation across repositories

## Dependencies

- `../modules/file-ops.js`
- `fs`
- `path`
- `child_process`

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

### getSyncTargets

**Signature:**
```javascript
async function getSyncTargets()
```

### findDocsToSync

**Signature:**
```javascript
async function findDocsToSync(source, pattern)
```

**Parameters:**
- `source`
- `pattern`

### syncToTarget

**Signature:**
```javascript
async function syncToTarget(docs, source, target, dryRun, modules)
```

**Parameters:**
- `docs`
- `source`
- `target`
- `dryRun`
- `modules`

### shouldSync

**Signature:**
```javascript
async function shouldSync(sourcePath, targetPath)
```

**Parameters:**
- `sourcePath`
- `targetPath`

### updateRelativeLinks

**Signature:**
```javascript
async function updateRelativeLinks(content, docPath, sourceRoot, targetRoot)
```

**Parameters:**
- `content`
- `docPath`
- `sourceRoot`
- `targetRoot`

### adjustRelativePath

**Signature:**
```javascript
function adjustRelativePath(relativePath, sourceRoot, targetRoot, docPath)
```

**Parameters:**
- `relativePath`
- `sourceRoot`
- `targetRoot`
- `docPath`

### findMarkdownFiles

**Signature:**
```javascript
async function findMarkdownFiles(dir)
```

**Parameters:**
- `dir`

### scan

**Signature:**
```javascript
async function scan(directory, base = "")
```

**Parameters:**
- `directory`
- `base = ""`

## Script Details

- **Command**: `apex doc-sync`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-sync

// With arguments
apex doc-sync --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/doc-sync.js)
