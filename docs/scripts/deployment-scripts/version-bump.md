# version-bump.js

## File Information

- **Path**: `./scripts/version-bump.js`
- **Language**: javascript
- **Lines**: 299
- **Size**: 7.0KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.845Z

## Overview

version-bump.js - Bump version numbers in package.json and other files

## Dependencies

- `fs`
- `child_process`

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

### isValidVersion

**Signature:**
```javascript
function isValidVersion(version)
```

**Parameters:**
- `version`

### bumpVersion

**Signature:**
```javascript
function bumpVersion(current, type, preid)
```

**Parameters:**
- `current`
- `type`
- `preid`

### findVersionFiles

**Signature:**
```javascript
async function findVersionFiles()
```

### updateVersionInFile

**Signature:**
```javascript
async function updateVersionInFile(filepath, oldVersion, newVersion)
```

**Parameters:**
- `filepath`
- `oldVersion`
- `newVersion`

## Script Details

- **Command**: `apex version-bump`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex version-bump

// With arguments
apex version-bump --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/version-bump.js)
