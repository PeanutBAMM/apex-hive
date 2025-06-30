# 🔄 Migration Guide: Old System → Apex Hive

This guide helps you migrate from the old Lead-Manager-Worker system to the new Apex Hive architecture.

## 📊 Architecture Changes

### Old System (Complex)
```javascript
Lead (apex-lead.js)
  ├── CI Manager
  │     └── Workers (monitor, fix, heal...)
  ├── Doc Manager
  │     └── Workers (generate, validate...)
  └── ... 5 Managers total
```javascript

### New System (Simple)
```javascript
MCP Gateway (mcp-server.js)
  └── Apex Router (apex-router.js)
        └── 60 Direct Scripts
```javascript

## 🔧 Command Mapping

### CI Commands
| Old Command | New Command | Notes |
|------------|-------------|-------|
| `npm run apex ci monitor` | `apex ci:monitor` | Direct execution |
| `npm run ci:watch` | `apex ci:watch` | Simplified |
| `npm run push` | `apex push` or `apex ci:smart-push` | Smart push with CI |

### Documentation Commands
| Old Command | New Command | Notes |
|------------|-------------|-------|
| `npm run apex doc generate` | `apex doc:generate` | Faster execution |
| `npm run docs:sync` | `apex doc:sync` | Same functionality |
| `npm run docs:validate` | `apex doc:validate` | More thorough |

### Quality Commands
| Old Command | New Command | Notes |
|------------|-------------|-------|
| `npm run apex quality lint` | `apex quality:lint` | Direct linting |
| `npm run fix:all` | `apex quality:fix-all` | Comprehensive fixes |
| `npm run clean:console` | `apex quality:console-clean` | Remove console.logs |

### Backlog Commands
| Old Command | New Command | Notes |
|------------|-------------|-------|
| `npm run apex backlog analyze` | `apex backlog:analyze` | AI-powered analysis |
| `npm run backlog:show` | `apex backlog:display` | Visual display |

## 🚀 Migration Steps

### 1. Backup Current Setup
```bash
# Save your current configuration
cp package.json package.json.backup
cp -r scripts scripts.backup
```javascript

## 2. Install Apex Hive
```bash
# Clone or download Apex Hive
cd ../apex-hive-workspace/apex-hive

# Install dependencies
npm install

# Register with Claude
node install-mcp.js
```javascript

## 3. Update Package.json Scripts

Remove old npm scripts and add new ones:

```json
{
  "scripts": {
    // Remove these old scripts:
    // "apex": "node scripts/apex-lead.js",
    // "ci:watch": "node scripts/apex-lead.js ci monitor",
    
    // Add these new scripts (optional):
    "apex": "node index.js",
    "apex:help": "node index.js help",
    "apex:status": "node index.js ci:status"
  }
}
```javascript

### 4. Update CI/CD Workflows

#### GitHub Actions
```yaml
# Old
- run: npm run apex ci monitor

# New
- run: npx apex ci:monitor
```javascript

## Local Development
```bash
# Old workflow
npm run apex ci monitor
npm run apex doc generate
npm run apex quality lint

# New workflow (in Claude)
apex ci:monitor
apex doc:generate
apex quality:lint

# Or use recipes
apex start-day
apex fix-all
```javascript

## 5. Natural Language Migration

The new system supports natural language:

```bash
# Old: Complex commands
npm run apex ci fix && npm run apex ci monitor

# New: Natural language
apex "fix the CI"
apex "wat is kapot?"
```javascript

## 🔍 Key Differences

### 1. **No More Managers**
- Old: Lead → Manager → Worker hierarchy
- New: Direct script execution

### 2. **MCP Integration**
- Old: CLI only
- New: Full Claude Desktop integration

### 3. **Natural Language**
- Old: Exact commands only
- New: English and Dutch patterns

### 4. **Performance**
- Old: ~500ms overhead
- New: <100ms overhead

### 5. **Recipe Workflows**
- Old: Manual command chaining
- New: Pre-defined workflows

## 📝 Configuration Migration

### Old Config Structure
```javascript
scripts/
├── apex-lead.js
├── workers/
│   ├── ci/
│   ├── docs/
│   └── ...
└── config/
```javascript

### New Config Structure
```javascript
apex-hive/
├── scripts/          # All 60 scripts flat
├── config/
│   ├── registry.js   # Command registry
│   ├── patterns.js   # NL patterns
│   └── recipes.json  # Workflows
└── modules/          # Shared functionality
```javascript

## ⚠️ Breaking Changes

1. **Command Syntax**
   - Old: `npm run apex <manager> <command>`
   - New: `apex <category>:<command>`

2. **Script Location**
   - Old: Nested in workers/
   - New: Flat in scripts/

3. **Configuration**
   - Old: Multiple config files
   - New: Centralized in config/

4. **Output Format**
   - Old: Console output
   - New: Structured JSON

## 🆘 Troubleshooting

### "Command not found"
```bash
# Ensure MCP is registered
claude mcp list

# Should show apex-hive
# If not, run:
node install-mcp.js
```javascript

## "Script not working"
```bash
# Test directly
node index.js <command>

# Check with dry-run
apex <command> --dry-run
```javascript

## "Different output format"
The new system returns structured JSON. Update any scripts that parse output:

```javascript
// Old
const output = execSync('npm run apex ci status');
const lines = output.toString().split('\n');

// New
const result = JSON.parse(execSync('apex ci:status'));
console.log(result.data);
```javascript

## 📚 Resources

- [Full Command Reference](CLAUDE.md)
- [README](README.md)
- [Architecture Docs](../docs/restructuring/)

## 💡 Tips

1. **Start with recipes** - They combine common workflows
2. **Use natural language** - Faster than typing exact commands
3. **Leverage Claude** - The MCP integration is powerful
4. **Keep old backup** - Until fully migrated

---

Need help? Run `apex help` or check [CLAUDE.md](CLAUDE.md) for all commands.