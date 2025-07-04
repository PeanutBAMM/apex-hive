# doc-cleanup.js

## File Information

- **Path**: `./scripts/doc-cleanup.js`
- **Language**: javascript
- **Lines**: 526
- **Size**: 15.3KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.626Z

## Overview

doc-cleanup.js - Clean up documentation structure (remove prefixes, merge duplicates)

## Dependencies

- `../modules/file-ops.js`
- `fs`
- `path`
- `crypto`

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

### findNumberedFolders

**Signature:**
```javascript
async function findNumberedFolders(sourceDir)
```

**Parameters:**
- `sourceDir`

### scan

**Signature:**
```javascript
async function scan(dir)
```

**Parameters:**
- `dir`

### findDuplicateFolders

**Signature:**
```javascript
async function findDuplicateFolders(sourceDir, plannedRenames)
```

**Parameters:**
- `sourceDir`
- `plannedRenames`

### scan

**Signature:**
```javascript
async function scan(dir)
```

**Parameters:**
- `dir`

### findFilesWithPrefixes

**Signature:**
```javascript
async function findFilesWithPrefixes(sourceDir)
```

**Parameters:**
- `sourceDir`

### scan

**Signature:**
```javascript
async function scan(dir)
```

**Parameters:**
- `dir`

### cleanupFileName

**Signature:**
```javascript
function cleanupFileName(fileName)
```

**Parameters:**
- `fileName`

### executeFolderMerges

**Signature:**
```javascript
async function executeFolderMerges(merges, stats, verbose)
```

**Parameters:**
- `merges`
- `stats`
- `verbose`

### executeFolderRenames

**Signature:**
```javascript
async function executeFolderRenames(renames, stats, verbose)
```

**Parameters:**
- `renames`
- `stats`
- `verbose`

### executeFileRenames

**Signature:**
```javascript
async function executeFileRenames(renames, stats, verbose)
```

**Parameters:**
- `renames`
- `stats`
- `verbose`

### cleanEmptyDirs

**Signature:**
```javascript
async function cleanEmptyDirs(dir)
```

**Parameters:**
- `dir`

### isDirectory

**Signature:**
```javascript
function isDirectory(entry)
```

**Parameters:**
- `entry`

## Script Details

- **Command**: `apex doc-cleanup`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-cleanup

// With arguments
apex doc-cleanup --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/doc-cleanup.js)
