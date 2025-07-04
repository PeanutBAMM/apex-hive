# ci-heal.js

## File Information

- **Path**: `./scripts/ci-heal.js`
- **Language**: javascript
- **Lines**: 242
- **Size**: 6.8KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.558Z

## Overview

ci-heal.js - Self-healing CI system that monitors and fixes issues automatically

## Dependencies

- `child_process`

## Exports

- `async` (value)

## Functions

### run

**Signature:**
```javascript
export async function run(args)
```

**Parameters:**
- `args`

### applyHealingPatterns

**Signature:**
```javascript
async function applyHealingPatterns(parseResult, modules)
```

**Parameters:**
- `parseResult`
- `modules`

### runPreventiveHealing

**Signature:**
```javascript
async function runPreventiveHealing(modules)
```

**Parameters:**
- `modules`

## Script Details

- **Command**: `apex ci-heal`
- **Accepts Arguments**: Yes

## Usage

```javascript
// Run this script via the apex command
apex ci-heal

// With arguments
apex ci-heal --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/ci-heal.js)
