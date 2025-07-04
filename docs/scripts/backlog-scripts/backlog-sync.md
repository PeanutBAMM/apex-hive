# backlog-sync.js

## File Information

- **Path**: `./scripts/backlog-sync.js`
- **Language**: javascript
- **Lines**: 381
- **Size**: 9.5KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.468Z

## Overview

backlog-sync.js - Sync backlog between different sources

## Dependencies

- `../modules/file-ops.js`
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

### loadItems

**Signature:**
```javascript
async function loadItems(source, modules)
```

**Parameters:**
- `source`
- `modules`

### parseMarkdown

**Signature:**
```javascript
function parseMarkdown(content)
```

**Parameters:**
- `content`

### compareItems

**Signature:**
```javascript
function compareItems(sourceItems, targetItems)
```

**Parameters:**
- `sourceItems`
- `targetItems`

### isDifferent

**Signature:**
```javascript
function isDifferent(item1, item2)
```

**Parameters:**
- `item1`
- `item2`

### executeSyncAction

**Signature:**
```javascript
async function executeSyncAction(action)
```

**Parameters:**
- `action`

## Script Details

- **Command**: `apex backlog-sync`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex backlog-sync

// With arguments
apex backlog-sync --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/backlog-sync.js)
