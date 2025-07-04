# save-conversation.js

<module>save-conversation</module>
<description>- `args`: No description</description>
<category>Core</category>

**File**: `scripts/save-conversation.js`
**Language**: javascript
**Lines**: 866
**Last Modified**: 2025-07-04T10:25:49.075Z

## Functions

### run

**Parameters:**
- `args`: No description

```javascript
export async function run(args = {})
```

### generateTitle

```javascript
function generateTitle()
```

### gatherContext

```javascript
async function gatherContext()
```

### generateSummary

```javascript
async function generateSummary()
```

### gatherMetadata

```javascript
async function gatherMetadata()
```

### formatAsMarkdown

**Parameters:**
- `data`: No description

```javascript
function formatAsMarkdown(data)
```

### formatAsClaudeContext

**Parameters:**
- `data`: No description

```javascript
function formatAsClaudeContext(data)
```

### updateConversationIndex

**Parameters:**
- `directory`: No description
- `conversationData`: No description

```javascript
async function updateConversationIndex(directory, conversationData)
```

### getRecentConversations

**Parameters:**
- `limit`: No description

```javascript
export async function getRecentConversations(limit = 10)
```

### extractKeywords

**Parameters:**
- `summary`: No description
- `count`: No description

```javascript
export function extractKeywords(summary, count = 10)
```

### createTextSummary

**Parameters:**
- `summaryData`: No description
- `context`: No description
- `metadata`: No description

```javascript
async function createTextSummary(summaryData, context, metadata)
```

## Source Code

View the full source code: [save-conversation.js](scripts/save-conversation.js)
