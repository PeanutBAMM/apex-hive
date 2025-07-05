# init-project.js

## File Information

- **Path**: `./scripts/init-project.js`
- **Language**: javascript
- **Lines**: 346
- **Size**: 8.2KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.739Z

## Overview

init-project.js - Initialize Apex Hive in a new project

## Dependencies

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

### createDefaultConfig

**Signature:**
```javascript
function createDefaultConfig(projectName, template)
```

**Parameters:**
- `projectName`
- `template`

### createClaudeMd

**Signature:**
```javascript
function createClaudeMd(projectName)
```

**Parameters:**
- `projectName`

### createSampleRecipes

**Signature:**
```javascript
async function createSampleRecipes(recipesDir)
```

**Parameters:**
- `recipesDir`

### updatePackageJson

**Signature:**
```javascript
async function updatePackageJson(packageJsonPath)
```

**Parameters:**
- `packageJsonPath`

### setupGitHooks

**Signature:**
```javascript
async function setupGitHooks(projectPath)
```

**Parameters:**
- `projectPath`

### fileExists

**Signature:**
```javascript
async function fileExists(filePath)
```

**Parameters:**
- `filePath`

### isGitRepo

**Signature:**
```javascript
async function isGitRepo(projectPath)
```

**Parameters:**
- `projectPath`

## Script Details

- **Command**: `apex init-project`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex init-project

// With arguments
apex init-project --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/init-project.js)
