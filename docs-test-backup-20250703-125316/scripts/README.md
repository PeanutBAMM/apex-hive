# Apex Hive Scripts Documentation

This directory contains comprehensive documentation for all Apex Hive scripts, organized by category.

## 📂 Script Categories

### [CI/CD Scripts](./ci/)
Continuous Integration and Deployment automation
- **ci.md** - CI monitoring, parsing, fixing, healing, watching, and status commands

### [Documentation Scripts](./doc/)
Documentation generation and management
- **doc.md** - Generate, update, validate, organize documentation
- **xml.md** - XML documentation handling

### [Quality Scripts](./quality/)
Code quality and testing tools
- **quality.md** - Linting, formatting, version fixing, console cleaning
- **test.md** - Test execution and setup
- **detect-issues.md** - Issue detection and analysis

### [Git Scripts](./git/)
Version control operations
- **git.md** - Status, pull, tag, branch management
- **commit.md** - Smart commit creation
- **push.md** - Push operations and tag management

### [Backlog Scripts](./backlog/)
Project management and backlog handling
- **backlog.md** - Analyze, score, sync, display backlog items

### [Cache Scripts](./cache/)
Cache management and optimization
- **cache.md** - Clear, status, warm operations
- **cache-warm.md** - Specific cache warming strategies

### [Deployment Scripts](./deployment/)
Build and release management
- **deploy.md** - Deployment automation
- **release.md** - Release preparation
- **build.md** - Build processes
- **version.md** - Version management

### [Utility Scripts](./utilities/)
Various helper scripts
- **code.md** - Code generation stubs
- **fix-detected.md** - Auto-fix detected issues
- **init.md** - Project initialization
- **report.md** - Status reporting
- **save-conversation.md** - Conversation persistence
- **search.md** - Code search functionality

## 🚀 Usage

Each script documentation includes:
- **Purpose**: What the script does
- **Usage**: How to run it
- **Options**: Available parameters
- **Examples**: Common use cases
- **Output**: Expected results

## 🔧 Common Patterns

Most scripts support these options:
- `--dry-run` - Preview changes without applying
- `--verbose` - Detailed output
- `--force` - Skip confirmations
- `--help` - Show help

## 📊 Script Statistics

- **Total Scripts**: 67
- **Categories**: 8
- **Most Used**: CI and Documentation scripts
- **Newest**: Cache warming and conversation saving

## See Also

- [Commands Reference](../reference/commands-reference.md) - Complete command list
- [Natural Language](../guides/natural-language.md) - Using commands in English/Dutch
- [Recipes](../guides/recipes.md) - Complex workflow combinations