# backlog-score.js

## File Information

- **Path**: `./scripts/backlog-score.js`
- **Language**: javascript
- **Lines**: 256
- **Size**: 6.8KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.459Z

## Overview

backlog-score.js - Score and prioritize backlog items

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

### calculateScore

**Signature:**
```javascript
function calculateScore(item, criteria, customWeight)
```

**Parameters:**
- `item`
- `criteria`
- `customWeight`

### generateRecommendations

**Signature:**
```javascript
function generateRecommendations(scoredItems, criteria)
```

**Parameters:**
- `scoredItems`
- `criteria`

## Script Details

- **Command**: `apex backlog-score`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex backlog-score

// With arguments
apex backlog-score --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/backlog-score.js)
