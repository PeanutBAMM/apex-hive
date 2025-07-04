# doc-generate.js

## File Information

- **Path**: `./scripts/doc-generate.js`
- **Language**: javascript
- **Lines**: 404
- **Size**: 10.2KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.636Z

## Overview

doc-generate.js - Generate documentation for project files

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

### generateAPIDocs

**Signature:**
```javascript
async function generateAPIDocs(outputDir, modules)
```

**Parameters:**
- `outputDir`
- `modules`

### generateScriptDocs

**Signature:**
```javascript
async function generateScriptDocs(outputDir, modules)
```

**Parameters:**
- `outputDir`
- `modules`

### generateModuleDoc

**Signature:**
```javascript
async function generateModuleDoc(modulePath)
```

**Parameters:**
- `modulePath`

### generateCategoryDoc

**Signature:**
```javascript
async function generateCategoryDoc(category, scripts)
```

**Parameters:**
- `category`
- `scripts`

### getScriptDescription

**Signature:**
```javascript
async function getScriptDescription(scriptPath)
```

**Parameters:**
- `scriptPath`

### generateReadme

**Signature:**
```javascript
async function generateReadme(modules)
```

**Parameters:**
- `modules`

### generateForPath

**Signature:**
```javascript
async function generateForPath(targetPath, outputDir, modules)
```

**Parameters:**
- `targetPath`
- `outputDir`
- `modules`

### generateIndex

**Signature:**
```javascript
async function generateIndex(docs, outputDir)
```

**Parameters:**
- `docs`
- `outputDir`

## Script Details

- **Command**: `apex doc-generate`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex doc-generate

// With arguments
apex doc-generate --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/doc-generate.js)
