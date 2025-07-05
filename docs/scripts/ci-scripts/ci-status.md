# ci-status.js

<module>ci-status</module>
<description>- `args`: No description</description>
<category>CI/CD</category>

**File**: `scripts/ci-status.js`
**Language**: javascript
**Lines**: 620
**Last Modified**: 2025-07-01T19:09:45.681Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args = {})
```

### detectCIPlatform

```javascript
async function detectCIPlatform()
```

### getGitHubStatus

**Parameters:**
- `options`: No description

```javascript
async function getGitHubStatus(options)
```

### getGitLabStatus

**Parameters:**
- `options`: No description

```javascript
async function getGitLabStatus(options)
```

### getJenkinsStatus

**Parameters:**
- `options`: No description

```javascript
async function getJenkinsStatus(options)
```

### getCircleCIStatus

**Parameters:**
- `options`: No description

```javascript
async function getCircleCIStatus(options)
```

### getTravisStatus

**Parameters:**
- `options`: No description

```javascript
async function getTravisStatus(options)
```

### getLocalStatus

**Parameters:**
- `options`: No description

```javascript
async function getLocalStatus(options)
```

### mapGitHubStatus

**Parameters:**
- `status`: No description
- `conclusion`: No description

```javascript
function mapGitHubStatus(status, conclusion)
```

### formatStatusOutput

**Parameters:**
- `statusData`: No description
- `platform`: No description

```javascript
function formatStatusOutput(statusData, platform)
```

## Source Code

View the full source code: [ci-status.js](scripts/ci-status.js)
