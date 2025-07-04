# backlog-table.js

## File Information

- **Path**: `./scripts/backlog-table.js`
- **Language**: javascript
- **Lines**: 334
- **Size**: 8.3KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.477Z

## Overview

backlog-table.js - Generate table view of backlog items

## Dependencies

- `../modules/file-ops.js`

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

### calculateColumnWidths

**Signature:**
```javascript
function calculateColumnWidths(items, columns, maxWidth)
```

**Parameters:**
- `items`
- `columns`
- `maxWidth`

### formatCellValue

**Signature:**
```javascript
function formatCellValue(value, column)
```

**Parameters:**
- `value`
- `column`

### generateASCIITable

**Signature:**
```javascript
function generateASCIITable(items, columns, colWidths)
```

**Parameters:**
- `items`
- `columns`
- `colWidths`

### generateMarkdownTable

**Signature:**
```javascript
function generateMarkdownTable(items, columns)
```

**Parameters:**
- `items`
- `columns`

### generateCSVTable

**Signature:**
```javascript
function generateCSVTable(items, columns)
```

**Parameters:**
- `items`
- `columns`

### generateHTMLTable

**Signature:**
```javascript
function generateHTMLTable(items, columns)
```

**Parameters:**
- `items`
- `columns`

### escapeHTML

**Signature:**
```javascript
function escapeHTML(str)
```

**Parameters:**
- `str`

## Script Details

- **Command**: `apex backlog-table`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex backlog-table

// With arguments
apex backlog-table --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/backlog-table.js)
