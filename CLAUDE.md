# Apex Hive - Claude Integration Guide

## 🚀 Overview

Apex Hive is a powerful development automation system with 67 commands (59 scripts + 8 recipes) for CI/CD, documentation, quality control, and more. This guide helps Claude understand and use all available commands.

**Note**: This is now a public repository, which provides free GitHub Actions CI/CD minutes.

## 📋 Available Commands

### Quick Access
- `apex help` - Show all available commands
- `apex status` - Check system status (alias: `apex ci:status`)
- `apex search <query>` - Search codebase
- `apex commit` - Quick commit with AI message
- `apex push` - Smart push with CI monitoring

### Natural Language Support

#### English Patterns
- "fix the CI" → `apex ci:fix`
- "what's broken?" → `apex detect-issues`
- "check status" → `apex ci:status`
- "generate docs" → `apex doc:generate`
- "run tests" → `apex test`

#### Dutch Patterns (Nederlands)
- "fix de CI" → `apex ci:fix`
- "wat is kapot?" → `apex detect-issues`
- "commit en push" → runs commit and push workflow
- "genereer docs" → `apex doc:generate`
- "voer tests uit" → `apex test`

## 📚 Complete Command Reference


### CI/CD Commands

- `apex ci:monitor` - Monitor GitHub Actions CI status in real-time
- `apex ci:parse` - Parse CI logs for errors and warnings
- `apex ci:fix` - Auto-fix common CI issues
- `apex ci:heal` - Self-healing CI system that detects and fixes problems
- `apex ci:watch` - Watch CI runs and notify on status changes
- `apex ci:smart-push` - Intelligent git push with CI monitoring
- `apex ci:status` - Comprehensive CI status report

### Documentation Commands

- `apex doc:generate` - Generate documentation for changed files
- `apex doc:generate-changed` - Generate docs only for recently changed files
- `apex doc:generate-missing` - Generate documentation for files without docs
- `apex doc:update` - Update existing documentation
- `apex doc:update-readme` - Update README files automatically
- `apex doc:validate` - Validate documentation structure and completeness
- `apex doc:validate-xml` - Validate XML documentation tags
- `apex doc:validate-links` - Check all documentation links for validity
- `apex doc:fix-links` - Fix broken documentation links
- `apex doc:organize` - Organize documentation files into proper structure
- `apex doc:sync` - Sync documentation structure across repos
- `apex doc:add-xml` - Add XML documentation tags to files
- `apex doc:search` - Search through documentation
- `apex doc:post-merge` - Run documentation tasks after git merge
- `apex doc:check` - Check documentation status and coverage

### Quality Control

- `apex quality:lint` - Run linting checks on codebase
- `apex quality:fix-versions` - Fix dependency version issues
- `apex quality:console-clean` - Remove console.log statements from code
- `apex quality:fix-all` - Fix all auto-fixable quality issues
- `apex quality:validate` - Validate code quality metrics
- `apex quality:format` - Format code according to standards
- `apex quality:setup` - Setup quality tools and configurations
- `apex quality:check` - Run comprehensive quality checks

### Backlog Management

- `apex backlog:analyze` - Analyze backlog items and priorities
- `apex backlog:score` - Score backlog items by importance
- `apex backlog:sync` - Sync backlog with project management tools
- `apex backlog:display` - Display backlog in visual format
- `apex backlog:table` - Show backlog as a formatted table

**Note**: The backlog system now reads real items from `BACKLOG.md` instead of using hardcoded sample data. It automatically parses markdown structure, detects priorities from headers, and estimates effort/value for each item.

### XML Processing

- `apex xml:validate` - Validate XML files and structure
- `apex xml:add` - Add XML content to files
- `apex xml:clean` - Clean and format XML files

### Git Operations

- `apex git:commit` - Create smart git commit with AI-generated message
- `apex git:push` - Push changes with safety checks
- `apex git:status` - Enhanced git status with more details
- `apex git:pull` - Pull changes with conflict detection
- `apex git:tag` - Create and manage git tags
- `apex git:push-tags` - Push tags to remote repository
- `apex git:init` - Initialize git repository with best practices
- `apex git:branch` - Manage git branches efficiently

### Core Commands

- `apex init` - Initialize new Apex project
- `apex build` - Build the project
- `apex test` - Run test suite
- `apex test:run` - Run test suite (alias)
- `apex test:setup` - Setup test environment
- `apex search` - Search codebase using ripgrep
- `apex save-conversation` - Save AI conversation with narrative summary
- `apex code` - Generate code stubs and boilerplate

### Deployment

- `apex deploy` - Deploy application to production
- `apex version:bump` - Bump version numbers
- `apex changelog:generate` - Generate CHANGELOG from commits
- `apex release` - Complete release workflow

### Detection & Reporting

- `apex detect-issues` - Detect issues with pagination (--page 1 --limit 20)
  - **Improved**: Issues are now grouped by file to reduce noise
  - **Better filtering**: False positive TODO/FIXME detection eliminated
  - **Cleaner output**: From 363 to ~170 issues through intelligent grouping
- `apex fix-detected` - Fix issues found by detection
- `apex report` - Generate comprehensive status report

### Cache Management

- `apex cache:warm-readmes` - Pre-cache README files for performance
- `apex cache:warm-docs` - Pre-cache high-value documentation files
- `apex cache:warm-conversations` - Warm cache with recent conversation summaries (max 5)
- `apex cache:warm-scripts` - Pre-cache frequently used scripts and recipes
- `apex cache:warm-all` - Pre-cache READMEs, documentation, conversations, scripts, and recipes
- `apex cache:clear` - Clear all caches with detailed statistics per namespace
- `apex cache:status` - Display cache statistics and status

### Context & Intelligence

- `apex startup-context` - Intelligent project context analyzer showing:
  - Previous conversation summary with full details
  - Cache statistics (READMEs, docs, conversations, scripts)
  - Git status with uncommitted changes and recent commits
  - System issues summary with top 3 issues
  - Recommended focus areas based on context
  - Top 5 backlog items

### Aliases & Helpers

- `apex commit` - Quick commit (alias for git:commit)
- `apex push` - Smart push with CI (alias for ci:smart-push)
- `apex help` - Show help and available commands

## 🎯 Recipe Workflows

Apex Hive supports complex workflows through recipes:

### Development Workflows
- `apex start-day` - Enhanced startup sequence:
  - `startup-context` - Analyze previous session and project state
  - `cache:clear` - Clear old cache data
  - `cache:warm-all` - Warm all caches including scripts/recipes
  - `git:pull` - Sync with remote
  - `detect-issues` - Check for code quality issues
  - `backlog:display` - Show prioritized backlog
- `apex commit-and-push` - Runs: git:commit → ci:smart-push → ci:monitor
- `apex fix-all` - Runs: quality:fix-all → doc:generate → test:run

### CI/CD Workflows
- `apex ci-fix-all` - Runs: ci:parse → ci:fix → ci:heal → ci:monitor
- `apex deploy-safe` - Runs: test:run → version:bump → deploy → ci:monitor

### Documentation Workflows
- `apex doc-complete` - Runs: doc:generate-missing → doc:validate → doc:update-readme
- `apex doc-fix-all` - Runs: doc:fix-links → doc:add-xml → doc:organize

## 💡 Usage Examples

### Basic Commands
```bash
# Check CI status
apex ci:status

# Search for a function
apex search "authenticate"

# Generate missing docs
apex doc:generate-missing

# Fix all quality issues
apex quality:fix-all
```

### Natural Language
```bash
# English
apex "fix the CI"
apex "what's broken?"
apex "generate documentation"

# Dutch
apex "fix de CI"
apex "wat is kapot?"
apex "genereer documentatie"
```

### Advanced Workflows
```bash
# Morning routine
apex start-day

# Before deploying
apex deploy-safe

# Fix everything
apex fix-all
```

## 🔧 Options

Most commands support these options:
- `--dry-run` - Preview changes without applying
- `--verbose` - Show detailed output
- `--force` - Skip confirmations
- `--help` - Show command-specific help

## 📊 Output Format

All commands return structured JSON:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed",
  "error": null
}
```

## 🚀 Quick Tips

1. **Use recipes** for complex workflows
2. **Natural language** works for common tasks
3. **Dry run** first to preview changes
4. **Check CI** before pushing changes
5. **Generate docs** after code changes
6. **Cache warming** available on-demand with `apex cache:warm-all`

## 🗄️ Unified Cache System

The unified cache system provides on-demand caching of READMEs, documentation, and conversation summaries:

- **On-Demand**: Use `apex cache:warm-all` to warm all caches
- **Coverage**: 
  - Project READMEs (excluding node_modules)
  - 8 high-value documentation files
  - Last 5 conversation summaries
- **Storage**: All cached data stored in `~/.apex-cache/` with namespaces:
  - `~/.apex-cache/files/` - README and documentation files
  - `~/.apex-cache/conversations/` - Conversation summaries
  - `~/.apex-cache/commands/` - Command results
  - `~/.apex-cache/search/` - Search results
- **Benefits**: 
  - 80-90% cache hit rate for development queries
  - Quick access to recent conversation context
  - Improved Claude response times
- **Manual trigger**: `apex cache:warm-all` to refresh immediately

### Cache Details:
- Uses unified persistent file-based cache with TTL support
- Automatically filters out node_modules, .git, dist, and build directories
- Supports 23+ files with ~100KB total cache size
- TTL: 24 hours for documentation, 7 days for conversations
- Hash-based storage for collision-free caching

## 🚀 Cached File Operations (NEW)

The file-ops module now provides cached file operations with dramatic performance improvements:

### Features:
- **Batch Operations**: `batchRead()` and `batchWrite()` for multiple files
- **File Locking**: Prevents race conditions during concurrent access
- **Memory Protection**: `batchReadSafe()` chunks large file sets
- **Persistent Cache**: Survives between MCP calls via unified-cache
- **82% Faster**: Second read of same file (7.97ms → 1.42ms)
- **Cache Hit Tracking Fixed**: Cache hits now properly tracked between MCP calls

### Usage in Scripts:
```javascript
// Old way (direct fs - no cache)
import { promises as fs } from "fs";
const content = await fs.readFile(file, "utf8");

// New way (cached file-ops)
import { readFile, batchRead } from "../modules/file-ops.js";
const content = await readFile(file); // Uses cache!

// Batch operations
const { results, errors } = await batchRead(['file1.js', 'file2.js']);
```

### Migration Status:
- **✅ Converted (20/66)**: quality-console-clean, doc-generate-changed, detect-issues, cache-warm-readmes, git-commit, startup-context, and 14 more
- **❌ TODO (41/66)**: All other scripts still use direct fs operations

### Performance Impact:
- **70-80% token reduction** when all scripts converted
- **Recipe execution** much faster with shared cache context
- **Cache hits properly tracked** between MCP server calls
- **No breaking changes** - fully backwards compatible

### Cache Hit Tracking Fix:
- Previously, cache stats were reset between MCP calls
- Now uses persistent unified-cache for hit/miss tracking
- Proper hit rates shown in `apex cache:status`
- Cache effectiveness accurately measured across sessions

## 💭 Conversation Memory System

Save and retrieve conversation summaries for better context retention:

### Usage:
```bash
# Save conversation with summary from Claude
apex save-conversation \
  --title "Implemented cache system" \
  --tags "cache,performance,optimization"

# Via MCP: tags can be string or array
mcp__apex-hive__apex command="save-conversation" \
  args={"title": "Title", "tags": ["cache", "fix"]}

# Warm conversation cache
apex cache:warm-conversations --limit 5

# Check conversation cache status
apex cache:status conversations --detailed
```

### Features:
- Stores conversation summaries up to 7 days
- Keywords automatically extracted from summaries
- Quick access to recent conversations (max 5 cached)
- Integrated with unified cache system
- Performance-optimized for Claude's needs

## 🧪 Testing

Run tests with Jest:
```bash
# Run all tests
npm test

# Run in watch mode
npm test:watch

# Run with coverage
npm test:coverage

# Run specific test file
npm test test/cache/unified-cache.test.js
```

Tests run automatically on GitHub Actions for:
- Push to master/main
- Pull requests
- Multiple Node.js versions (18.x, 20.x)

## 🆘 Troubleshooting

If a command fails:
1. Check with `apex detect-issues --page 1 --limit 10`
2. View detailed logs with `--verbose`
3. Try `apex ci:heal` for CI issues
4. Use `apex quality:fix-all` for code issues

### Performance Tips
- Cache operations: <1ms for hits, ~5s for warming
- Concurrent access supported
- Use `apex cache:status` to monitor performance

---

*Generated: 2025-07-01*
*Total Commands: 67 (59 scripts + 8 recipes)*
