# fix-detected.js

## File Information

- **Path**: `./scripts/fix-detected.js`
- **Language**: javascript
- **Lines**: 448
- **Size**: 11.6KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.689Z

## Overview

fix-detected.js - Auto-fix issues detected by detect-issues

## Dependencies

- `child_process`
- `fs`

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

### parseIssuesReport

**Signature:**
```javascript
function parseIssuesReport(content)
```

**Parameters:**
- `content`

### runDetection

**Signature:**
```javascript
async function runDetection(categories)
```

**Parameters:**
- `categories`

### applyFixes

**Signature:**
```javascript
async function applyFixes(type, issues, options)
```

**Parameters:**
- `type`
- `issues`
- `options`

### generateFixReport

**Signature:**
```javascript
function generateFixReport(results, total)
```

**Parameters:**
- `results`
- `total`

## Script Details

- **Command**: `apex fix-detected`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex fix-detected

// With arguments
apex fix-detected --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../architecture/reference/commands/)
- [Script Development Guide](../development/scripts/)

## See Also

- [Source Code](./scripts/fix-detected.js)
