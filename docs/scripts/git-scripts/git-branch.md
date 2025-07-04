# git-branch.js

## File Information

- **Path**: `./scripts/git-branch.js`
- **Language**: javascript
- **Lines**: 273
- **Size**: 6.5KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.698Z

## Overview

git-branch.js - Manage git branches

## Dependencies

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

### listBranches

**Signature:**
```javascript
function listBranches(options)
```

**Parameters:**
- `options`

### createBranch

**Signature:**
```javascript
function createBranch(branchName, options)
```

**Parameters:**
- `branchName`
- `options`

### deleteBranchAction

**Signature:**
```javascript
function deleteBranchAction(branchName, options)
```

**Parameters:**
- `branchName`
- `options`

### renameBranch

**Signature:**
```javascript
function renameBranch(newName, options)
```

**Parameters:**
- `newName`
- `options`

## Script Details

- **Command**: `apex git-branch`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex git-branch

// With arguments
apex git-branch --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/git-branch.js)
