# changelog-generate.js

## File Information

- **Path**: `./scripts/changelog-generate.js`
- **Language**: javascript
- **Lines**: 292
- **Size**: 7.2KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.539Z

## Overview

changelog-generate.js - Generate changelog from git commits

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

### getCommits

**Signature:**
```javascript
async function getCommits(from, to)
```

**Parameters:**
- `from`
- `to`

### extractCommitType

**Signature:**
```javascript
function extractCommitType(subject)
```

**Parameters:**
- `subject`

### extractCommitScope

**Signature:**
```javascript
function extractCommitScope(subject)
```

**Parameters:**
- `subject`

### categorizeCommits

**Signature:**
```javascript
function categorizeCommits(commits)
```

**Parameters:**
- `commits`

### generateMarkdownChangelog

**Signature:**
```javascript
function generateMarkdownChangelog(categorized, options)
```

**Parameters:**
- `categorized`
- `options`

### generatePlainChangelog

**Signature:**
```javascript
function generatePlainChangelog(categorized)
```

**Parameters:**
- `categorized`

## Script Details

- **Command**: `apex changelog-generate`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex changelog-generate

// With arguments
apex changelog-generate --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/changelog-generate.js)
