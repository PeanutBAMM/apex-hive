# doc-generate-missing.js

<module>doc-generate-missing</module>
<description>- `args`: No description</description>
<category>Documentation</category>

**File**: `scripts/doc-generate-missing.js`
**Language**: javascript
**Lines**: 730
**Last Modified**: 2025-07-04T10:25:49.025Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args = {})
```

### findSourceFiles

**Parameters:**
- `sourceDir`: No description
- `extensions`: No description

```javascript
async function findSourceFiles(sourceDir, extensions)
```

### findMissingDocs

**Parameters:**
- `sourceFiles`: No description
- `docsDir`: No description

```javascript
async function findMissingDocs(sourceFiles, docsDir)
```

### countLines

**Parameters:**
- `filepath`: No description

```javascript
async function countLines(filepath)
```

### getDocPath

**Parameters:**
- `sourcePath`: No description
- `sourceRoot`: No description
- `docsDir`: No description

```javascript
function getDocPath(sourcePath, sourceRoot, docsDir)
```

### generateDocumentation

**Parameters:**
- `filepath`: No description
- `options`: No description

```javascript
async function generateDocumentation(filepath, options)
```

### generateMarkdownDoc

**Parameters:**
- `filepath`: No description
- `content`: No description
- `language`: No description

```javascript
function generateMarkdownDoc(filepath, content, language)
```

### generateHTMLDoc

**Parameters:**
- `filepath`: No description
- `content`: No description
- `language`: No description

```javascript
function generateHTMLDoc(filepath, content, language)
```

### extractJSDocComments

**Parameters:**
- `content`: No description

```javascript
function extractJSDocComments(content)
```

### extractOverview

**Parameters:**
- `content`: No description
- `language`: No description

```javascript
function extractOverview(content, language)
```

### analyzeCode

**Parameters:**
- `content`: No description
- `language`: No description

```javascript
function analyzeCode(content, language)
```

### getLanguage

**Parameters:**
- `ext`: No description

```javascript
function getLanguage(ext)
```

### findRelatedFiles

**Parameters:**
- `filepath`: No description
- `dirname`: No description

```javascript
function findRelatedFiles(filepath, dirname)
```

### generateReport

**Parameters:**
- `data`: No description

```javascript
function generateReport(data)
```

## Source Code

View the full source code: [doc-generate-missing.js](scripts/doc-generate-missing.js)
