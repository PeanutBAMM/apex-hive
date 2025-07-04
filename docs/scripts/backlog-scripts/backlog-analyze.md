# backlog-analyze.js

## File Information

- **Path**: `./scripts/backlog-analyze.js`
- **Language**: javascript
- **Lines**: 303
- **Size**: 7.8KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.438Z

## Overview

backlog-analyze.js - Analyze backlog items and provide insights

## Dependencies

- `../modules/file-ops.js`
- `path`
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

### loadBacklogItemsWrapper

**Signature:**
```javascript
async function loadBacklogItemsWrapper(source, modules)
```

**Parameters:**
- `source`
- `modules`

### parseTodoFile

**Signature:**
```javascript
function parseTodoFile(content)
```

**Parameters:**
- `content`

### estimateComplexity

**Signature:**
```javascript
function estimateComplexity(item)
```

**Parameters:**
- `item`

### generateInsights

**Signature:**
```javascript
function generateInsights(analysis, items)
```

**Parameters:**
- `analysis`
- `items`

### formatSummary

**Signature:**
```javascript
function formatSummary(analysis, insights)
```

**Parameters:**
- `analysis`
- `insights`

### formatDetailed

**Signature:**
```javascript
function formatDetailed(analysis, insights, items)
```

**Parameters:**
- `analysis`
- `insights`
- `items`

## Script Details

- **Command**: `apex backlog-analyze`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex backlog-analyze

// With arguments
apex backlog-analyze --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/backlog-analyze.js)
