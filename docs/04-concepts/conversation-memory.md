# Conversation Memory System

<overview>
The Conversation Memory System enables Claude to save and retrieve conversation summaries, providing better context retention across sessions. This system is integrated with the unified cache infrastructure for persistence and performance.
</overview>

## 🎯 Purpose

The conversation memory system addresses several key needs:

1. **Context Retention**: Preserve important conversation context across sessions
2. **Quick Recall**: Fast access to recent conversation summaries
3. **Pattern Recognition**: Identify common topics and workflows
4. **Performance**: Leverage the unified cache for efficient storage

## 🏗️ Architecture

### Components

```
apex-hive/
├── modules/
│   └── unified-cache.js          # Added conversationCache export
├── scripts/
│   ├── save-conversation.js      # Enhanced with cache support
│   ├── cache-warm-conversations.js # New warming script
│   ├── cache-warm-all.js         # Updated to include conversations
│   └── cache-status.js           # Shows conversation stats
└── config/
    └── registry.js               # Added conversation commands
```

### Cache Structure

Conversations are stored in the unified cache with:
- **Namespace**: `conversations`
- **TTL**: 7 days (configurable)
- **Max Size**: 10MB per conversation
- **Key Format**: `conversation-YYYY-MM-DD-{hash}`

## 📝 Usage

### Saving Conversations

The `save-conversation` script now supports cache storage:

```bash
# Save to cache (preferred)
apex save-conversation-to-cache \
  --title "Implemented conversation memory" \
  --conversationSummary "Full summary text here..." \
  --tags "memory,cache,claude"

# Traditional file save (legacy)
apex save-conversation \
  --title "Session notes" \
  --directory "conversations"
```

### Parameters

- `title` (required): Brief title for the conversation
- `conversationSummary` (required for cache): The actual summary text
- `tags`: Array of keywords for categorization
- `useCache`: Boolean to enable cache storage (default: true)

### Retrieving Conversations

Recent conversations can be accessed through:

```javascript
// In scripts
import { getRecentConversations } from "./save-conversation.js";

const recent = await getRecentConversations(10);
// Returns array of conversation objects with metadata
```

### Cache Management

```bash
# Warm conversation cache
apex cache:warm-conversations --limit 50

# Check conversation cache status
apex cache:status conversations --detailed

# View all cache statistics including conversations
apex cache:status
```

## 🔄 Integration with Cache System

The conversation memory is fully integrated with the unified cache:

### Automatic Warming

The daily cron job (`cache:warm-all`) now includes conversations:
1. Warms README files
2. Warms high-value documentation
3. Warms last 50 conversations

### Cache Benefits

- **Persistence**: Survives MCP restarts
- **Performance**: Hash-based lookups
- **Deduplication**: Automatic handling of duplicates
- **TTL Management**: Auto-expiry after 7 days

## 💡 Best Practices

### 1. Summary Guidelines

Keep summaries concise but informative:
- 50-1000 words ideal
- Include key decisions made
- Note important code changes
- Mention any blockers or issues

### 2. Tagging Strategy

Use consistent tags:
- Feature names: `authentication`, `cache-system`
- Technologies: `react`, `nodejs`, `typescript`
- Actions: `bugfix`, `refactor`, `implementation`

### 3. Regular Warming

Run cache warming regularly:
```bash
# Manual warm (last 50 conversations)
apex cache:warm-conversations

# Check what's cached
apex cache:status conversations
```

## 🔍 Implementation Details

### Cache Key Generation

```javascript
const timestamp = new Date().toISOString();
const id = crypto
  .createHash('md5')
  .update(`${timestamp}-${title}`)
  .digest('hex')
  .substring(0, 12);

const cacheKey = `conversation-${datePrefix}-${id}`;
```

### Metadata Structure

Each cached conversation includes:
```javascript
{
  id: "abc123",
  title: "Conversation title",
  summary: "Full summary text...",
  keywords: ["tag1", "tag2"],
  timestamp: "2025-01-01T10:00:00Z",
  wordCount: 250,
  characterCount: 1500,
  context: { /* optional context data */ },
  metadata: { /* optional metadata */ }
}
```

### Recent Access Keys

For quick access to recent conversations:
```javascript
const recentKey = `recent-${Date.now()}-${id}`;
// TTL: 24 hours for recent list
```

## 🛠️ Troubleshooting

### Common Issues

1. **Cache not saving**
   - Check cache directory permissions
   - Verify summary is provided
   - Check cache size limits

2. **Conversations not found**
   - Run `apex cache:warm-conversations`
   - Check TTL hasn't expired
   - Verify cache namespace

3. **Performance issues**
   - Limit conversation size to < 10MB
   - Use warming for frequently accessed items
   - Check cache stats for capacity

### Debug Commands

```bash
# Check if cache is working
apex cache:status conversations

# Warm with verbose output
apex cache:warm-conversations --verbose

# Test save functionality
apex save-conversation-to-cache \
  --title "Test" \
  --conversationSummary "Test summary" \
  --dryRun
```

## 🚀 Future Enhancements

Potential improvements:
1. **Search functionality**: Full-text search across summaries
2. **Auto-summarization**: Generate summaries from git history
3. **Export/Import**: Backup conversation history
4. **Analytics**: Track common patterns and topics
5. **Integration**: Connect with external knowledge bases

## 📚 Related Documentation

- [Unified Cache System](./unified-cache.md)
- [Cache Management](../02-guides/cache-management.md)
- [MCP Integration](../02-guides/mcp-integration.md)

---

*Last updated: 2025-01-01*