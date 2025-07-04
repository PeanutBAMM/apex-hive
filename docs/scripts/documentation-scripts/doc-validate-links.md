# doc-validate-links.js

## File Information

- **Path**: `./scripts/doc-validate-links.js`
- **Language**: javascript
- **Lines**: 808
- **Size**: 19.9KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.672Z

## Overview

doc-validate-links.js - Validate links in documentation files

## Dependencies

- `../modules/file-ops.js`
- `fs`
- `child_process`
- `path`
- `url`

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

### findDocFiles

**Signature:**
```javascript
async function findDocFiles(directory, recursive)
```

**Parameters:**
- `directory`
- `recursive`

### extractAllLinks

**Signature:**
```javascript
async function extractAllLinks(files)
```

**Parameters:**
- `files`

### extractLinks

**Signature:**
```javascript
function extractLinks(content, filepath)
```

**Parameters:**
- `content`
- `filepath`

### detectLinkType

**Signature:**
```javascript
function detectLinkType(url, filepath)
```

**Parameters:**
- `url`
- `filepath`

### categorizeLinks

**Signature:**
```javascript
function categorizeLinks(links)
```

**Parameters:**
- `links`

### validateInternalLinks

**Signature:**
```javascript
async function validateInternalLinks(links, baseDir)
```

**Parameters:**
- `links`
- `baseDir`

### validateExternalLinks

**Signature:**
```javascript
async function validateExternalLinks(links, options)
```

**Parameters:**
- `links`
- `options`

### validateExternalLink

**Signature:**
```javascript
async function validateExternalLink(url, options)
```

**Parameters:**
- `url`
- `options`

### validateAnchorLinks

**Signature:**
```javascript
async function validateAnchorLinks(links, allFiles)
```

**Parameters:**
- `links`
- `allFiles`

### validateAnchorInFile

**Signature:**
```javascript
async function validateAnchorInFile(filepath, anchor)
```

**Parameters:**
- `filepath`
- `anchor`

### findSimilarAnchor

**Signature:**
```javascript
async function findSimilarAnchor(filepath, anchor)
```

**Parameters:**
- `filepath`
- `anchor`

### findSimilarFile

**Signature:**
```javascript
async function findSimilarFile(targetPath, baseDir)
```

**Parameters:**
- `targetPath`
- `baseDir`

### calculateSimilarity

**Signature:**
```javascript
function calculateSimilarity(str1, str2)
```

**Parameters:**
- `str1`
- `str2`

### levenshteinDistance

**Signature:**
```javascript
function levenshteinDistance(str1, str2)
```

**Parameters:**
- `str1`
- `str2`

### fixBrokenLinks

**Signature:**
```javascript
async function fixBrokenLinks(brokenLinks)
```

**Parameters:**
- `brokenLinks`

### escapeRegex

**Signature:**
```javascript
function escapeRegex(str)
```

**Parameters:**
- `str`

### generateLinkReport

**Signature:**
```javascript
function generateLinkReport(data)
```

**Parameters:**
- `data`

## Script Details

- **Command**: `apex doc-validate-links`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-validate-links

// With arguments
apex doc-validate-links --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/doc-validate-links.js)
