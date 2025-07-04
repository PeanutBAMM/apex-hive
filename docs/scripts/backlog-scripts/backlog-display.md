# backlog-display.js

## File Information

- **Path**: `./scripts/backlog-display.js`
- **Language**: javascript
- **Lines**: 375
- **Size**: 9.1KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.449Z

## Overview

backlog-display.js - Display backlog in various formats

## Dependencies

- `../modules/file-ops.js`
- `../modules/backlog-parser.js`

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

### loadDetailedItems

**Signature:**
```javascript
async function loadDetailedItems(modules)
```

**Parameters:**
- `modules`

### sortItems

**Signature:**
```javascript
function sortItems(items, sortBy)
```

**Parameters:**
- `items`
- `sortBy`

### formatList

**Signature:**
```javascript
function formatList(items)
```

**Parameters:**
- `items`

### formatTable

**Signature:**
```javascript
function formatTable(items)
```

**Parameters:**
- `items`

### formatCards

**Signature:**
```javascript
function formatCards(items)
```

**Parameters:**
- `items`

### formatKanban

**Signature:**
```javascript
function formatKanban(items)
```

**Parameters:**
- `items`

### formatSummary

**Signature:**
```javascript
function formatSummary(allItems, displayedItems)
```

**Parameters:**
- `allItems`
- `displayedItems`

## Script Details

- **Command**: `apex backlog-display`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex backlog-display

// With arguments
apex backlog-display --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/backlog-display.js)
