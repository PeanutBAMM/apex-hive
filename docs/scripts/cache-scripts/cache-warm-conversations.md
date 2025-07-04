# cache-warm-conversations.js

## File Information

- **Path**: `./scripts/cache-warm-conversations.js`
- **Language**: javascript
- **Lines**: 349
- **Size**: 9.0KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.511Z

## Overview

cache-warm-conversations.js - Pre-cache recent conversations for fast access

## Dependencies

- `fs`
- `path`
- `../modules/unified-cache.js`

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

### readConversationsFromDisk

**Signature:**
```javascript
async function readConversationsFromDisk(directory, limit, daysBack)
```

**Parameters:**
- `directory`
- `limit`
- `daysBack`

### extractNarrativeSummary

**Signature:**
```javascript
function extractNarrativeSummary(content)
```

**Parameters:**
- `content`

### extractKeywords

**Signature:**
```javascript
function extractKeywords(text, count = 10)
```

**Parameters:**
- `text`
- `count = 10`

## Script Details

- **Command**: `apex cache-warm-conversations`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex cache-warm-conversations

// With arguments
apex cache-warm-conversations --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/cache-warm-conversations.js)
