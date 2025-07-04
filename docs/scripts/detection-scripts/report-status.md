# report-status.js

## File Information

- **Path**: `./scripts/report-status.js`
- **Language**: javascript
- **Lines**: 728
- **Size**: 19.4KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.819Z

## Overview

report-status.js - Generate comprehensive status reports

## Dependencies

- `child_process`
- `fs`
- `path`

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

### generateOverview

**Signature:**
```javascript
async function generateOverview()
```

### generateGitStatus

**Signature:**
```javascript
async function generateGitStatus()
```

### generateCIStatus

**Signature:**
```javascript
async function generateCIStatus(modules)
```

**Parameters:**
- `modules`

### generateDependencyStatus

**Signature:**
```javascript
async function generateDependencyStatus()
```

### generateCodeMetrics

**Signature:**
```javascript
async function generateCodeMetrics()
```

### generateIssuesStatus

**Signature:**
```javascript
async function generateIssuesStatus(modules)
```

**Parameters:**
- `modules`

### generateTestStatus

**Signature:**
```javascript
async function generateTestStatus()
```

### generateDocStatus

**Signature:**
```javascript
async function generateDocStatus()
```

### generatePerformanceStatus

**Signature:**
```javascript
async function generatePerformanceStatus()
```

### generateMarkdownReport

**Signature:**
```javascript
function generateMarkdownReport(data)
```

**Parameters:**
- `data`

### generateHTMLReport

**Signature:**
```javascript
function generateHTMLReport(data)
```

**Parameters:**
- `data`

### generateTextReport

**Signature:**
```javascript
function generateTextReport(data)
```

**Parameters:**
- `data`

## Script Details

- **Command**: `apex report-status`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex report-status

// With arguments
apex report-status --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/report-status.js)
