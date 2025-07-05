# doc-validate.js

## File Information

- **Path**: `./scripts/doc-validate.js`
- **Language**: javascript
- **Lines**: 569
- **Size**: 14.3KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.681Z

## Overview

doc-validate.js - Validate documentation for completeness and accuracy

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

### validateAllDocs

**Signature:**
```javascript
async function validateAllDocs(modules)
```

**Parameters:**
- `modules`

### validateMarkdownFiles

**Signature:**
```javascript
async function validateMarkdownFiles(modules)
```

**Parameters:**
- `modules`

### validateMarkdownFile

**Signature:**
```javascript
async function validateMarkdownFile(filePath)
```

**Parameters:**
- `filePath`

### validateLinks

**Signature:**
```javascript
async function validateLinks(modules)
```

**Parameters:**
- `modules`

### validateFileLinks

**Signature:**
```javascript
async function validateFileLinks(filePath, content)
```

**Parameters:**
- `filePath`
- `content`

### validateCodeBlocks

**Signature:**
```javascript
async function validateCodeBlocks(modules)
```

**Parameters:**
- `modules`

### validateFileCodeBlocks

**Signature:**
```javascript
async function validateFileCodeBlocks(filePath, content)
```

**Parameters:**
- `filePath`
- `content`

### validateJavaScriptCode

**Signature:**
```javascript
function validateJavaScriptCode(code)
```

**Parameters:**
- `code`

### validateBashCode

**Signature:**
```javascript
function validateBashCode(code)
```

**Parameters:**
- `code`

### validateCoverage

**Signature:**
```javascript
async function validateCoverage(modules)
```

**Parameters:**
- `modules`

### validatePath

**Signature:**
```javascript
async function validatePath(targetPath, modules)
```

**Parameters:**
- `targetPath`
- `modules`

### applyFixes

**Signature:**
```javascript
async function applyFixes(issues, modules)
```

**Parameters:**
- `issues`
- `modules`

### findMarkdownFiles

**Signature:**
```javascript
async function findMarkdownFiles(dir = ".")
```

**Parameters:**
- `dir = "."`

### scan

**Signature:**
```javascript
async function scan(directory)
```

**Parameters:**
- `directory`

### fileExists

**Signature:**
```javascript
async function fileExists(filePath)
```

**Parameters:**
- `filePath`

## Script Details

- **Command**: `apex doc-validate`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-validate

// With arguments
apex doc-validate --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/doc-validate.js)
