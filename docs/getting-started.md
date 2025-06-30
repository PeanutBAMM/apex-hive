# Getting Started with Apex Hive

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- Git
- Claude Desktop (for MCP integration)

### Quick Install

1. **Clone the repository**
```bash
git clone https://github.com/apex-hive/apex-hive.git
cd apex-hive
```

2. **Install dependencies**
```bash
npm install
```

3. **Verify installation**
```bash
node verify-installation.js
```

4. **Register with Claude Desktop** (optional)
```bash
node install-mcp.js
```

## 🎯 First Commands

### Using the CLI directly

```bash
# Show help
node index.js help

# Search for code
node index.js search "authenticate"

# Check CI status
node index.js ci:status
```

### Using aliases (after npm link)

```bash
# Link globally
npm link

# Now use apex command
apex help
apex search "test"
apex ci:status
```

### Using with Claude Desktop

After MCP registration:
1. Restart Claude Desktop
2. Type: `apex help`
3. Or use natural language: `apex "fix the CI"`

## 💡 Basic Usage

### Command Structure
```
apex <command> [options]
apex <recipe>
apex "<natural language>"
```

### Examples

**Direct commands:**
```bash
apex ci:status
apex doc:generate
apex test
```

**Recipes (workflows):**
```bash
apex start-day
apex commit-and-push
apex fix-all
```

**Natural language:**
```bash
apex "what's broken?"
apex "generate documentation"
apex "commit and push my changes"
```

**Dutch support:**
```bash
apex "wat is kapot?"
apex "genereer documentatie"
apex "commit en push"
```

## 🔧 Configuration

### Environment Variables
- `LOG_LEVEL` - Set logging level (DEBUG, INFO, WARN, ERROR)
- `APEX_NO_CACHE` - Disable caching
- `APEX_DRY_RUN` - Preview commands without executing

### Config Files
- `config/recipes.json` - Workflow recipes
- `config/patterns.js` - English patterns
- `config/patterns-nl.js` - Dutch patterns
- `config/registry.js` - Command registry

## 📚 Next Steps

1. Explore [Natural Language Guide](./natural-language.md)
2. Learn about [Recipes](./recipes.md)
3. See all [Commands](./commands-reference.md)
4. Read [Troubleshooting](./troubleshooting.md) if needed

## 🆘 Quick Help

- **List all commands**: `apex help`
- **Search commands**: `apex help | grep doc`
- **Get command info**: `apex <command> --help`
- **Report issues**: GitHub Issues

---

*Happy automating with Apex Hive! 🚀*