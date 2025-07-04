# doc-search.js

## File Information

- **Path**: `./scripts/doc-search.js`
- **Language**: javascript
- **Lines**: 235
- **Size**: 5.4KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.655Z

## Overview

doc-search.js - Search within documentation files

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

### searchWithRAG

**Signature:**
```javascript
async function searchWithRAG(query, docsPath, ragModule)
```

**Parameters:**
- `query`
- `docsPath`
- `ragModule`

### searchDocs

**Signature:**
```javascript
async function searchDocs(query, docsPath, includeComments)
```

**Parameters:**
- `query`
- `docsPath`
- `includeComments`

### searchFile

**Signature:**
```javascript
async function searchFile(filePath, query, includeComments)
```

**Parameters:**
- `filePath`
- `query`
- `includeComments`

### getContext

**Signature:**
```javascript
function getContext(lines, index)
```

**Parameters:**
- `lines`
- `index`

### calculateScore

**Signature:**
```javascript
function calculateScore(line, query)
```

**Parameters:**
- `line`
- `query`

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
async function scan(directory)
```

**Parameters:**
- `directory`

## Script Details

- **Command**: `apex doc-search`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-search

// With arguments
apex doc-search --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/doc-search.js)
