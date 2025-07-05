# git-commit.js

<module>git-commit</module>
<description>- `args`: No description</description>
<category>Git</category>

**File**: `scripts/git-commit.js`
**Language**: javascript
**Lines**: 284
**Last Modified**: 2025-07-04T10:25:49.045Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args = {})
```

### generateCommitMessage

**Parameters:**
- `status`: No description
- `type`: No description
- `scope`: No description
- `breaking`: No description

```javascript
async function generateCommitMessage(status, type, scope, breaking)
```

### parseGitStatus

**Parameters:**
- `status`: No description

```javascript
function parseGitStatus(status)
```

### formatConventionalCommit

**Parameters:**
- `type`: No description
- `scope`: No description
- `description`: No description
- `breaking`: No description

```javascript
function formatConventionalCommit(type, scope, description, breaking)
```

### findCommonDirectory

**Parameters:**
- `files`: No description

```javascript
function findCommonDirectory(files)
```

### determineScope

**Parameters:**
- `files`: No description

```javascript
function determineScope(files)
```

## Source Code

View the full source code: [git-commit.js](scripts/git-commit.js)
