# doc-generate-changed.js

<module>doc-generate-changed</module>
<description>doc-generate-changed.js - Provides documentation functionality for the Apex Hive development automation system</description>
<category>Documentation</category>

**File**: `scripts/doc-generate-changed.js`
**Language**: javascript
**Lines**: 762
**Last Modified**: 2025-07-04T14:31:25.451Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args = {})
```

### getChangedFiles

**Parameters:**
- `options`: No description

```javascript
async function getChangedFiles(options)
```

### generateFileDoc

**Parameters:**
- `filepath`: No description
- `options`: No description

```javascript
async function generateFileDoc(filepath, options)
```

### generateMarkdownDoc

**Parameters:**
- `filepath`: No description
- `content`: No description
- `language`: No description

```javascript
function generateMarkdownDoc(filepath, content, language)
```

### generateJSDoc

**Parameters:**
- `filepath`: No description
- `content`: No description

```javascript
function generateJSDoc(filepath, content)
```

### generateHTMLDoc

**Parameters:**
- `filepath`: No description
- `content`: No description
- `language`: No description

```javascript
function generateHTMLDoc(filepath, content, language)
```

### extractOverview

**Parameters:**
- `content`: No description
- `language`: No description

```javascript
function extractOverview(content, language)
```

### extractSymbols

**Parameters:**
- `content`: No description
- `language`: No description

```javascript
function extractSymbols(content, language)
```

### parseParams

**Parameters:**
- `paramString`: No description
- `jsdoc`: No description

```javascript
function parseParams(paramString, jsdoc)
```

### extractDescription

**Parameters:**
- `jsdoc`: No description

```javascript
function extractDescription(jsdoc)
```

### extractReturns

**Parameters:**
- `jsdoc`: No description

```javascript
function extractReturns(jsdoc)
```

### extractClassMethods

**Parameters:**
- `content`: No description
- `className`: No description

```javascript
function extractClassMethods(content, className)
```

### getLanguage

**Parameters:**
- `ext`: No description

```javascript
function getLanguage(ext)
```

### getDocPath

**Parameters:**
- `sourcePath`: No description
- `outputDir`: No description

```javascript
function getDocPath(sourcePath, outputDir)
```

### generateIndex

**Parameters:**
- `generated`: No description
- `options`: No description

```javascript
function generateIndex(generated, options)
```

### findExistingDoc

**Parameters:**
- `sourceFile`: No description

```javascript
async function findExistingDoc(sourceFile)
```

## Classes

### declaration

#### Methods

- **if**: No description
- **getLanguage**: No description
- **getDocPath**: No description
- **generateIndex**: No description
- **if**: No description
- **if**: No description
- **for**: No description
- **for**: No description
- **findExistingDoc**: No description
- **if**: No description
- **for**: No description
- **for**: No description

## Source Code

View the full source code: [doc-generate-changed.js](scripts/doc-generate-changed.js)
