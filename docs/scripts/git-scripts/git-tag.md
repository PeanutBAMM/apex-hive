# git-tag.js

## File Information

- **Path**: `./scripts/git-tag.js`
- **Language**: javascript
- **Lines**: 241
- **Size**: 5.6KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.730Z

## Overview

git-tag.js - Create and manage git tags

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

### listTags

**Signature:**
```javascript
function listTags(options)
```

**Parameters:**
- `options`

### createTag

**Signature:**
```javascript
function createTag(tagName, options)
```

**Parameters:**
- `tagName`
- `options`

### deleteTagAction

**Signature:**
```javascript
function deleteTagAction(tagName, options)
```

**Parameters:**
- `tagName`
- `options`

## Script Details

- **Command**: `apex git-tag`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex git-tag

// With arguments
apex git-tag --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/git-tag.js)
