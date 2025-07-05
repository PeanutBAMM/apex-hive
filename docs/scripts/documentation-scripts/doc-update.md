# doc-update.js

<module>doc-update</module>
<description>doc-update.js - Provides documentation functionality for the Apex Hive development automation system</description>
<category>Documentation</category>

**File**: `scripts/doc-update.js`
**Language**: javascript
**Lines**: 771
**Last Modified**: 2025-07-04T14:31:25.488Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args)
```

### updateAllDocs

**Parameters:**
- `dryRun`: No description
- `modules`: No description

```javascript
async function updateAllDocs(dryRun, modules)
```

### updateReadme

**Parameters:**
- `dryRun`: No description
- `modules`: No description

```javascript
async function updateReadme(dryRun, modules)
```

### updateReadmeContent

**Parameters:**
- `content`: No description
- `modules`: No description

```javascript
async function updateReadmeContent(content, modules)
```

### updateChangelog

**Parameters:**
- `dryRun`: No description
- `modules`: No description

```javascript
async function updateChangelog(dryRun, modules)
```

### createChangelog

**Parameters:**
- `modules`: No description

```javascript
async function createChangelog(modules)
```

### updateChangelogContent

**Parameters:**
- `content`: No description
- `modules`: No description

```javascript
async function updateChangelogContent(content, modules)
```

### updateAPIDocs

**Parameters:**
- `dryRun`: No description
- `modules`: No description

```javascript
async function updateAPIDocs(dryRun, modules)
```

### updateAPIDoc

**Parameters:**
- `docPath`: No description
- `dryRun`: No description
- `modules`: No description

```javascript
async function updateAPIDoc(docPath, dryRun, modules)
```

### updateSpecificDoc

**Parameters:**
- `target`: No description
- `sourceFile`: No description
- `dryRun`: No description
- `modules`: No description

```javascript
async function updateSpecificDoc(target, sourceFile, dryRun, modules)
```

### detectChanges

**Parameters:**
- `original`: No description
- `updated`: No description

```javascript
function detectChanges(original, updated)
```

### getRecentCommits

**Parameters:**
- `gitOps`: No description

```javascript
async function getRecentCommits(gitOps)
```

### generateChangelogSection

**Parameters:**
- `commits`: No description

```javascript
function generateChangelogSection(commits)
```

### generateUpdatedAPIDoc

**Parameters:**
- `content`: No description
- `moduleSource`: No description
- `moduleName`: No description

```javascript
async function generateUpdatedAPIDoc(content, moduleSource, moduleName)
```

### fileExists

**Parameters:**
- `filePath`: No description

```javascript
async function fileExists(filePath)
```

### updateScriptDoc

**Parameters:**
- `docContent`: No description
- `sourceFile`: No description
- `modules`: No description

```javascript
async function updateScriptDoc(docContent, sourceFile, modules)
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

### generateFunctionsSection

**Parameters:**
- `functions`: No description
- `language`: No description

```javascript
function generateFunctionsSection(functions, language)
```

### generateClassesSection

**Parameters:**
- `classes`: No description

```javascript
function generateClassesSection(classes)
```

## Classes

### declaration

#### Methods

- **if**: No description
- **generateFunctionsSection**: No description
- **for**: No description
- **if**: No description
- **if**: No description
- **for**: No description
- **if**: No description
- **generateClassesSection**: No description
- **for**: No description
- **if**: No description
- **if**: No description
- **for**: No description

## Source Code

View the full source code: [doc-update.js](scripts/doc-update.js)
