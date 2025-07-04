# cache-clear.js

## File Information

- **Path**: `./scripts/cache-clear.js`
- **Language**: javascript
- **Lines**: 129
- **Size**: 3.8KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.494Z

## Overview

cache-clear.js - Clear the apex cache using unified cache system

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

## Script Details

- **Command**: `apex cache-clear`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex cache-clear

// With arguments
apex cache-clear --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/cache-clear.js)
