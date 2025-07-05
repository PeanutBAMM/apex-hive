# Conversation Memory System

<overview>
The Conversation Memory System enables saving and retrieving detailed conversation summaries with narrative context. The system follows a simple, reliable pattern: save to filesystem first, then warm the cache for performance.
</overview>

## 🎯 Purpose

The conversation memory system provides:

1. **Detailed Context**: Rich narrative summaries of development sessions
2. **Persistent Storage**: All conversations saved as markdown files
3. **Fast Access**: Cache warming for recent conversations
4. **Natural Language**: Easy commands like "save this conversation"

## 🏗️ Architecture

### Simple Flow

```
1. Save Conversation → Filesystem (conversations/*.md)
2. Cache Warming → Read from disk → Store in cache
3. Fast Access → Retrieve from cache
```

### Components

```
apex-hive/
├── conversations/            # Persistent storage
│   ├── index.json           # Conversation index
│   ├── README.md            # Auto-generated index
│   └── *.md                 # Individual conversations
├── scripts/
│   ├── save-conversation.js # Save with narrative summary
│   └── cache-warm-conversations.js # Warm from disk
└── ~/.apex-cache/
    └── conversations/       # Performance cache
```

## 📝 Usage

### Saving Conversations

```bash
# Direct command
apex save-conversation --title "Feature Implementation" --tags "auth,security"

# Natural language (English)
apex "save this conversation"
apex "remember this session"

# Natural language (Dutch)
apex "sla dit gesprek op"
apex "bewaar deze conversatie"
```

### What Gets Saved

Each conversation includes:

1. **Narrative Summary** (~2000 words)
   - What was accomplished
   - Challenges encountered
   - Solutions implemented
   - Technical details
   - Development workflow

2. **Metadata**
   - Project name and branch
   - Timestamp and tags
   - File modifications
   - Git commits
   - Recent commands

### Example Output

```markdown
# Feature Implementation Session

**Date**: 2025-01-01T10:00:00Z
**Tags**: `auth`, `security`
**Project**: apex-hive
**Branch**: feature/auth

## Conversation Summary

Today's development session focused on the **apex-hive** project on the `feature/auth` branch.

### What We Accomplished

Throughout this session, we made significant progress on several fronts:

**New Implementations:**
- Implemented JWT authentication system
- Added role-based access control
- Created secure session management

### Challenges & Solutions

The main challenge was integrating the authentication system with the existing 
cache infrastructure. We solved this by...

[... continues with detailed narrative ...]
```

## 🔄 Cache Management

### Automatic Warming

The cache can be warmed on-demand with the last 5 conversations:

```bash
# Manual warm (last 5 conversations)
apex cache:warm-conversations

# Warm all caches including conversations
apex cache:warm-all
```

### Cache Details

- **Namespace**: `conversations`
- **TTL**: 7 days
- **Limit**: Last 5 conversations (reduced from 50 for size)
- **Size**: ~2KB per conversation summary

## 💡 Best Practices

### 1. Save Regularly

Save conversations after significant work:
- Major feature implementations
- Complex debugging sessions
- Important architectural decisions
- After resolving challenging issues

### 2. Use Descriptive Titles

```bash
# Good
apex save-conversation --title "Implemented OAuth2 with Google"

# Less descriptive
apex save-conversation --title "Auth work"
```

### 3. Tag Consistently

Use consistent tags for easy searching:
- Feature areas: `auth`, `cache`, `ui`
- Types: `bugfix`, `feature`, `refactor`
- Technologies: `react`, `nodejs`, `docker`

## 🔍 Implementation Details

### Narrative Summary Generation

The system automatically generates detailed summaries by analyzing:

1. **Git History**: Recent commits and their messages
2. **File Changes**: Modified files grouped by type
3. **Command History**: Development workflow patterns
4. **Project Context**: Current branch and project state

### Storage Format

Conversations are stored as markdown files with:
- Human-readable narrative summary
- Structured metadata
- Full context preservation
- Automatic index generation

## 🛠️ Troubleshooting

### Common Issues

1. **No narrative summary in old files**
   - These were created before the feature was added
   - New conversations will include full narratives

2. **Cache not updating**
   - Run `apex cache:warm-conversations` manually
   - Check cache status with `apex cache:status`

3. **Natural language not working**
   - Restart Claude to reload MCP server
   - Check patterns in `config/patterns.js`

### Debug Commands

```bash
# Check cache status
apex cache:status conversations

# Warm with verbose output
apex cache:warm-conversations --verbose

# Test save functionality
apex save-conversation --title "Test" --dryRun
```

## 🚀 Why This Design?

1. **Reliability**: Filesystem storage ensures data persistence
2. **Simplicity**: No complex cache-only modes or dual systems
3. **Performance**: Cache provides fast access when needed
4. **Compatibility**: Works like README/docs caching
5. **Debuggability**: Easy to inspect markdown files

## 📚 Related Documentation

- [Unified Cache System](./unified-cache.md)
- [Natural Language Patterns](natural-language.md)
- [Cache Management](../02-guides/cache-management.md)

---

*Last updated: 2025-01-01*