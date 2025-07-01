# Apex Hive

Smart command system with natural language support.

## Installation

```bash
npm install apex-hive
apex init
```

## Quick Start

```bash
# Search for code
apex search "function authenticate"

# Check CI status
apex ci:monitor

# Run tests
apex test

# Get help
apex help
```

## Features

- 🚀 69 built-in scripts for common tasks
- 🌍 Natural language support (English & Dutch)
- 🔍 Fast search with ripgrep integration
- 🤖 CI/CD automation with self-healing
- 📚 Smart documentation generation
- 🔧 Extensible recipe system

## Available Commands

### Ci Commands
- `apex ci:monitor`
- `apex ci:parse`
- `apex ci:fix`
- `apex ci:heal`
- `apex ci:watch`
- ...and 2 more

### Doc Commands
- `apex doc:generate`
- `apex doc:generate-changed`
- `apex doc:generate-missing`
- `apex doc:update`
- `apex doc:update-readme`
- ...and 10 more

### Quality Commands
- `apex quality:lint`
- `apex quality:fix-versions`
- `apex quality:console-clean`
- `apex quality:fix-all`
- `apex quality:validate`
- ...and 3 more

### Backlog Commands
- `apex backlog:analyze`
- `apex backlog:score`
- `apex backlog:sync`
- `apex backlog:display`
- `apex backlog:table`

### Xml Commands
- `apex xml:validate`
- `apex xml:add`
- `apex xml:clean`

### Git Commands
- `apex git:commit`
- `apex git:push`
- `apex git:status`
- `apex git:pull`
- `apex git:tag`
- ...and 3 more

### Core Commands
- `apex init`
- `apex build`
- `apex test`
- `apex search`
- `apex save-conversation`
- ...and 8 more

### Test Commands
- `apex test:run`
- `apex test:setup`

### Version Commands
- `apex version:bump`

### Changelog Commands
- `apex changelog:generate`

### Cache Commands
- `apex cache:warm-readmes`
- `apex cache:warm-docs`
- `apex cache:warm-conversations`
- `apex cache:warm-all`
- `apex cache:clear`
- ...and 1 more

### CI Commands
- `ci:monitor` - Monitor CI status
- `ci:parse` - Parse CI logs
- `ci:fix` - Fix CI issues
- `ci:heal` - Self-healing CI
- `ci:watch` - Watch CI progress
- `ci:smart-push` - Smart push with monitoring

### Documentation Commands
- `doc:generate` - Generate documentation
- `doc:update` - Update existing docs
- `doc:validate` - Validate documentation
- `doc:sync` - Sync documentation

### Core Commands
- `search` - Search codebase
- `test` - Run tests
- `init` - Initialize project
- `help` - Show help

## Configuration

Configuration is stored in `.apex-hive/config.json`.

## License

MIT

---
*Last updated by Apex Hive on 2025-07-01T19:09:45.816Z*
