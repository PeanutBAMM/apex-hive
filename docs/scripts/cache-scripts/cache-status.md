# cache-status.js

## File Information

- **Path**: `./scripts/cache-status.js`
- **Language**: javascript
- **Lines**: 138
- **Size**: 3.5KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.503Z

## Overview

cache-status.js - Display cache statistics and status

## Dependencies

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

### formatDuration

**Signature:**
```javascript
function formatDuration(ms)
```

**Parameters:**
- `ms`

## Script Details

- **Command**: `apex cache-status`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex cache-status

// With arguments
apex cache-status --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/cache-status.js)
