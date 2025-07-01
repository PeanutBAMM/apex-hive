# Apex Hive - Claude Integration Guide

## 🚀 Overview

Apex Hive is a powerful development automation system with 64+ scripts for CI/CD, documentation, quality control, conversation memory, and more. This guide helps Claude understand and use all available commands.

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

- `apex detect-issues` - Detect all types of issues in codebase
- `apex fix-detected` - Fix issues found by detection
- `apex report` - Generate comprehensive status report

### Cache Management

- `apex cache:warm-readmes` - Pre-cache README files for performance
- `apex cache:warm-docs` - Pre-cache high-value documentation files
- `apex cache:warm-conversations` - Pre-cache recent conversation summaries
- `apex cache:warm-all` - Pre-cache READMEs, documentation, and conversations (used by cron)
- `apex cache:clear` - Clear all caches
- `apex cache:status` - Display cache statistics and status

### Conversation Memory

- `apex save-conversation` - Save conversation with detailed narrative summary
- `apex cache:warm-conversations` - Warm cache with recent conversations from disk
- Natural language: "sla dit gesprek op", "save this conversation"

### Aliases & Helpers

- `apex commit` - Quick commit (alias for git:commit)
- `apex push` - Smart push with CI (alias for ci:smart-push)
- `apex help` - Show help and available commands

## 🎯 Recipe Workflows

Apex Hive supports complex workflows through recipes:

### Development Workflows
- `apex start-day` - Runs: git:pull → ci:status → backlog:display
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

# Warm documentation cache
apex cache:warm-all
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
6. **Cache warming** happens automatically daily at 08:00 CET

## 🕰️ Automated Cache System

The unified cache system automatically warms READMEs, documentation, and conversation summaries:

- **Schedule**: Every day at 08:00 CET
- **Coverage**: 
  - Project READMEs (excluding node_modules)
  - 8 high-value documentation files
  - Last 50 conversation summaries
- **Storage**: All cached data stored in `~/.apex-cache/` with namespaces:
  - `~/.apex-cache/files/` - README and documentation files
  - `~/.apex-cache/conversations/` - Conversation summaries
  - `~/.apex-cache/commands/` - Command results
  - `~/.apex-cache/search/` - Search results
- **Benefits**: 
  - 80-90% cache hit rate for development queries
  - Quick access to recent conversation context
  - Improved Claude response times
- **Logging**: Cache operations logged to `~/.apex-cache/cron.log`
- **Manual trigger**: `apex cache:warm-all` to refresh immediately

### Cache Details:
- Uses unified persistent file-based cache with TTL support
- Automatically filters out node_modules, .git, dist, and build directories
- Supports 21+ files with ~95KB total cache size
- TTL: 24 hours for documentation, 7 days for conversations
- Hash-based storage for collision-free caching

## 💭 Conversation Memory System

Save and retrieve conversation summaries for better context retention:

### Usage:
```bash
# Save conversation with summary from Claude
apex save-conversation \
  --title "Implemented cache system" \
  --tags "cache,performance,optimization"

# Warm conversation cache
apex cache:warm-conversations --limit 30

# Check conversation cache status
apex cache:status conversations --detailed
```

### Features:
- Stores conversation summaries up to 7 days
- Keywords automatically extracted from summaries
- Quick access to recent conversations
- Integrated with unified cache system
- Performance-optimized for Claude's needs

## 🆘 Troubleshooting

If a command fails:
1. Check with `apex detect-issues`
2. View detailed logs with `--verbose`
3. Try `apex ci:heal` for CI issues
4. Use `apex quality:fix-all` for code issues

---

*Generated: 2025-07-01*
*Total Commands: 69*
