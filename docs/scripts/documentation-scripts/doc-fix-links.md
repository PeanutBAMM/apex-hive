# doc-fix-links.js

<module>doc-fix-links</module>
<description>- `args`: No description</description>
<category>Documentation</category>

**File**: `scripts/doc-fix-links.js`
**Language**: javascript
**Lines**: 269
**Last Modified**: 2025-07-04T10:25:49.015Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args)
```

### fixFileLinks

**Parameters:**
- `filePath`: No description
- `dryRun`: No description
- `updateHttps`: No description
- `modules`: No description

```javascript
async function fixFileLinks(filePath, dryRun, updateHttps, modules)
```

### fixUrl

**Parameters:**
- `url`: No description
- `fromFile`: No description
- `updateHttps`: No description

```javascript
async function fixUrl(url, fromFile, updateHttps)
```

### findFileByName

**Parameters:**
- `fileName`: No description
- `searchDir`: No description

```javascript
async function findFileByName(fileName, searchDir)
```

### scan

**Parameters:**
- `dir`: No description
- `depth`: No description

```javascript
async function scan(dir, depth = 0)
```

### findMarkdownFiles

**Parameters:**
- `dir`: No description

```javascript
async function findMarkdownFiles(dir)
```

### scan

**Parameters:**
- `directory`: No description

```javascript
async function scan(directory)
```

### fileExists

**Parameters:**
- `filePath`: No description

```javascript
async function fileExists(filePath)
```

## Source Code

View the full source code: [doc-fix-links.js](scripts/doc-fix-links.js)
