# git-init.js

## File Information

- **Path**: `./scripts/git-init.js`
- **Language**: javascript
- **Lines**: 310
- **Size**: 7.4KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.706Z

## Overview

git-init.js - Initialize a new git repository

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

### generateGitignore

**Signature:**
```javascript
function generateGitignore()
```

### generateReadme

**Signature:**
```javascript
function generateReadme(projectName)
```

**Parameters:**
- `projectName`

### generateLicense

**Signature:**
```javascript
function generateLicense(type)
```

**Parameters:**
- `type`

## Script Details

- **Command**: `apex git-init`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex git-init

// With arguments
apex git-init --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/git-init.js)
