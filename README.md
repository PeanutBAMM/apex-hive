# 🚀 Apex Hive

> Powerful AI development automation with 60+ scripts for CI/CD, documentation, quality control, and more.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Scripts](https://img.shields.io/badge/scripts-60+-green.svg)](scripts/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

## ✨ Features

- **60+ Automation Scripts**: CI/CD, documentation, quality control, backlog management
- **Natural Language Support**: English and Dutch command patterns
- **MCP Integration**: Works seamlessly with Claude Desktop
- **Zero Stdout Pollution**: Clean MCP server implementation
- **Recipe Workflows**: Combine multiple commands for complex tasks
- **Smart Caching**: LRU cache for performance
- **Ripgrep Powered**: Ultra-fast code search

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download Apex Hive
cd apex-hive

# Install dependencies
npm install

# Make install script executable
chmod +x install-mcp.js

# Register with Claude
node install-mcp.js
```

### 2. Verify Installation

```bash
# Run verification
node verify-installation.js

# All checks should pass ✅
```

### 3. Restart Claude Desktop

After installation, restart Claude Desktop to load the MCP server.

### 4. Test It Out

In Claude, try these commands:

```bash
# Show help
apex help

# Check CI status
apex ci:status

# Search codebase
apex search "function authenticate"

# Natural language
apex "fix the CI"
apex "wat is kapot?"  # Dutch
```

## 📚 Command Categories

### CI/CD (7 commands)
- `apex ci:monitor` - Real-time CI monitoring
- `apex ci:fix` - Auto-fix CI issues
- `apex ci:smart-push` - Push with CI checks
- [See all...](CLAUDE.md#cicd-commands)

### Documentation (15 commands)
- `apex doc:generate` - Generate docs
- `apex doc:validate` - Validate structure
- `apex doc:fix-links` - Fix broken links
- [See all...](CLAUDE.md#documentation-commands)

### Quality Control (8 commands)
- `apex quality:lint` - Run linting
- `apex quality:fix-all` - Fix all issues
- `apex quality:console-clean` - Remove console.logs
- [See all...](CLAUDE.md#quality-control)

### Git Operations (8 commands)
- `apex git:commit` - Smart commits
- `apex git:status` - Enhanced status
- `apex git:branch` - Branch management
- [See all...](CLAUDE.md#git-operations)

[View all 60+ commands →](CLAUDE.md)

## 🎯 Recipe Workflows

Combine commands for powerful workflows:

```bash
# Morning routine
apex start-day
# → git:pull → ci:status → backlog:display

# Commit and push
apex commit-and-push  
# → git:commit → ci:smart-push → ci:monitor

# Fix everything
apex fix-all
# → quality:fix-all → doc:generate → test:run
```

## 🌍 Natural Language

Apex Hive understands natural language:

### English
- "fix the CI" → `apex ci:fix`
- "what's broken?" → `apex detect-issues`
- "generate docs" → `apex doc:generate`

### Dutch (Nederlands)
- "fix de CI" → `apex ci:fix`
- "wat is kapot?" → `apex detect-issues`
- "commit en push" → commit and push workflow

## 🛠️ Configuration

### MCP Registration

```bash
# Automatic registration
node install-mcp.js

# Manual registration
claude mcp add apex-hive -s user "node /path/to/apex-hive/mcp-server.js"

# Verify registration
claude mcp list
```

### Options

Most commands support:
- `--dry-run` - Preview changes
- `--verbose` - Detailed output
- `--force` - Skip confirmations
- `--help` - Command help

## 📂 Project Structure

```
apex-hive/
├── mcp-server.js       # MCP gateway (50 lines)
├── apex-router.js      # Command router (200 lines)
├── scripts/            # 60+ automation scripts
├── modules/            # Shared modules
├── config/             # Configuration files
├── CLAUDE.md          # Full command reference
└── README.md          # This file
```

## 🧪 Testing

```bash
# Run tests
node test-scripts.js

# Test specific category
node test-scripts.js --category ci

# Test MCP integration
bash test-mcp.sh
```

## 🚀 Advanced Usage

### Direct Script Execution

```bash
# Run scripts directly
node index.js ci:status
node index.js search "TODO"
node index.js quality:fix-all --dry-run
```

### Module System

Scripts can access shared modules:
- `cache` - LRU caching
- `fileOps` - Safe file operations
- `rag` - Ripgrep search
- `gitOps` - Git helpers

### Custom Recipes

Add custom workflows to `config/recipes.json`:

```json
{
  "my-workflow": {
    "description": "My custom workflow",
    "steps": ["git:pull", "test:run", "git:push"]
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new scripts
4. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Built for the Apex AI ecosystem
- Powered by ripgrep for fast searching
- MCP SDK for Claude integration

---

**Need help?** Check [CLAUDE.md](CLAUDE.md) for the complete command reference or run `apex help`.