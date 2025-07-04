# build.js

## File Information

- **Path**: `./scripts/build.js`
- **Language**: javascript
- **Lines**: 567
- **Size**: 13.3KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.485Z

## Overview

build.js - Build orchestration script

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

### cleanBuild

**Signature:**
```javascript
async function cleanBuild()
```

### runPreBuildChecks

**Signature:**
```javascript
async function runPreBuildChecks()
```

### installDependencies

**Signature:**
```javascript
async function installDependencies()
```

### executeBuild

**Signature:**
```javascript
async function executeBuild(options)
```

**Parameters:**
- `options`

### detectBuildOutput

**Signature:**
```javascript
async function detectBuildOutput()
```

### runPostBuild

**Signature:**
```javascript
async function runPostBuild(options)
```

**Parameters:**
- `options`

### getGitCommit

**Signature:**
```javascript
async function getGitCommit()
```

### validateBuildOutput

**Signature:**
```javascript
async function validateBuildOutput(outputDir)
```

**Parameters:**
- `outputDir`

### getDirectorySize

**Signature:**
```javascript
async function getDirectorySize(dir)
```

**Parameters:**
- `dir`

### getBuildOutput

**Signature:**
```javascript
async function getBuildOutput()
```

### getBuildStats

**Signature:**
```javascript
async function getBuildStats()
```

## Script Details

- **Command**: `apex build`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex build

// With arguments
apex build --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/build.js)
