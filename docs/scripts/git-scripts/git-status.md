# git-status.js

<module>git-status</module>
<description>- `args`: No description</description>
<category>Git</category>

**File**: `scripts/git-status.js`
**Language**: javascript
**Lines**: 308
**Last Modified**: 2025-07-04T10:25:49.064Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args)
```

### getGitStatus

**Parameters:**
- `verbose`: No description
- `showIgnored`: No description

```javascript
async function getGitStatus(verbose, showIgnored)
```

### getChangeType

**Parameters:**
- `statusCode`: No description

```javascript
function getChangeType(statusCode)
```

### formatStatus

**Parameters:**
- `status`: No description
- `verbose`: No description

```javascript
function formatStatus(status, verbose)
```

### getStatusIcon

**Parameters:**
- `type`: No description

```javascript
function getStatusIcon(type)
```

## Source Code

View the full source code: [git-status.js](scripts/git-status.js)
