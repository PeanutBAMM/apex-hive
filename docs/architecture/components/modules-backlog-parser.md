# backlog-parser.js

<module>backlog-parser</module>
<description>Parse BACKLOG.md file into structured backlog items</description>

**File**: `modules/backlog-parser.js`
**Language**: javascript
**Lines**: 296
**Last Modified**: 2025-07-01T19:09:45.656Z

## Functions

### parseBacklogFile

Parse BACKLOG.md file into structured backlog items

**Parameters:**
- `filePath` (string): Path to BACKLOG.md file

**Returns:** Array of parsed backlog items

```javascript
export async function parseBacklogFile(filePath = "BACKLOG.md")
```

### parseBacklogContent

Parse markdown content into structured backlog items

**Parameters:**
- `content` (string): Markdown content

**Returns:** Array of parsed backlog items

```javascript
export function parseBacklogContent(content)
```

### estimateEffort

Estimate effort based on title and description

**Parameters:**
- `title`: No description
- `description`: No description

```javascript
function estimateEffort(title, description)
```

### estimateValue

Estimate value based on title, description and priority

**Parameters:**
- `title`: No description
- `description`: No description
- `priority`: No description

```javascript
function estimateValue(title, description, priority)
```

### estimateRisk

Estimate risk based on title and description

**Parameters:**
- `title`: No description
- `description`: No description

```javascript
function estimateRisk(title, description)
```

### extractTags

Extract tags from text

**Parameters:**
- `text`: No description

```javascript
function extractTags(text)
```

### loadBacklogItems

Load and parse backlog with fallback to sample data

```javascript
export async function loadBacklogItems()
```

### getSampleItems

Get sample backlog items for testing

```javascript
function getSampleItems()
```

## Source Code

View the full source code: [backlog-parser.js](modules/backlog-parser.js)
