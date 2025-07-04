# doc-post-merge.js

## File Information

- **Path**: `./scripts/doc-post-merge.js`
- **Language**: javascript
- **Lines**: 765
- **Size**: 20.1KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.645Z

## Overview

doc-post-merge.js - Post-merge documentation tasks

## Dependencies

- `child_process`
- `../modules/file-ops.js`
- `fs`
- `path`

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

### getMergeInfo

**Signature:**
```javascript
async function getMergeInfo()
```

### checkDocumentationIssues

**Signature:**
```javascript
async function checkDocumentationIssues(mergeInfo)
```

**Parameters:**
- `mergeInfo`

### generateNewFileDocs

**Signature:**
```javascript
async function generateNewFileDocs(mergeInfo, modules)
```

**Parameters:**
- `mergeInfo`
- `modules`

### validateAllDocs

**Signature:**
```javascript
async function validateAllDocs(modules)
```

**Parameters:**
- `modules`

### syncDocumentation

**Signature:**
```javascript
async function syncDocumentation(modules)
```

**Parameters:**
- `modules`

### updateReadmeIfNeeded

**Signature:**
```javascript
async function updateReadmeIfNeeded(mergeInfo, modules)
```

**Parameters:**
- `mergeInfo`
- `modules`

### checkReadmeNeedsUpdate

**Signature:**
```javascript
async function checkReadmeNeedsUpdate(mergeInfo)
```

**Parameters:**
- `mergeInfo`

### getExpectedDocPath

**Signature:**
```javascript
function getExpectedDocPath(codePath)
```

**Parameters:**
- `codePath`

### generateBasicDoc

**Signature:**
```javascript
function generateBasicDoc(filepath, content)
```

**Parameters:**
- `filepath`
- `content`

### generatePostMergeReport

**Signature:**
```javascript
function generatePostMergeReport(tasks, mergeInfo)
```

**Parameters:**
- `tasks`
- `mergeInfo`

## Script Details

- **Command**: `apex doc-post-merge`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-post-merge

// With arguments
apex doc-post-merge --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/doc-post-merge.js)
