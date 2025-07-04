# release.js

## File Information

- **Path**: `./scripts/release.js`
- **Language**: javascript
- **Lines**: 404
- **Size**: 9.4KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.810Z

## Overview

release.js - Orchestrate full release workflow

## Dependencies

- `child_process`
- `fs`

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

### runPreReleaseChecks

**Signature:**
```javascript
async function runPreReleaseChecks(options)
```

**Parameters:**
- `options`

### runVersionBump

**Signature:**
```javascript
async function runVersionBump(options)
```

**Parameters:**
- `options`

### rollbackVersion

**Signature:**
```javascript
async function rollbackVersion()
```

### runBuild

**Signature:**
```javascript
async function runBuild()
```

### runChangelogGenerate

**Signature:**
```javascript
async function runChangelogGenerate()
```

### runDeploy

**Signature:**
```javascript
async function runDeploy()
```

## Script Details

- **Command**: `apex release`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex release

// With arguments
apex release --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/release.js)
