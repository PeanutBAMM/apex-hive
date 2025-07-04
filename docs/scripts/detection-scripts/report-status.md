# report-status.js

<module>report-status</module>
<description>report-status.js - Generate comprehensive status reports</description>
<category>Detection</category>

## File Information

- **Path**: `scripts/report-status.js`
- **Language**: javascript
- **Lines**: 728
- **Size**: 19.4KB

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

## Usage

```javascript
import async from 'scripts/report-status.js';

// TODO: Add usage example
```

## See Also

- [Source Code](scripts/report-status.js)
