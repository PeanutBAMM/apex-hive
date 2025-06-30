# Troubleshooting Guide

## 🔍 Common Issues

### Installation Issues

#### "Cannot find module" Error
```
Error: Cannot find module 'lru-cache'
```
**Solution:**
```bash
npm install
```

#### "Scripts directory not found"
```
Error: ENOENT: no such file or directory
```
**Solution:**
```bash
# Verify you're in the right directory
pwd
# Should show: /path/to/apex-hive

# Check structure
ls -la
```

#### Verification Fails
```
❌ Modules load correctly: Cannot find module
```
**Solution:**
```bash
# Install dependencies
npm install

# Run verification
node verify-installation.js
```

### MCP Integration Issues

#### "apex not recognized" in Claude
**Solutions:**
1. Restart Claude Desktop
2. Re-register MCP:
```bash
claude mcp remove apex-hive
node install-mcp.js
```
3. Restart Claude again

#### "No output" from MCP commands
**Check stdout pollution:**
```bash
node mcp-server.js < /dev/null
# Should output nothing to stdout
```

#### MCP Registration Failed
```bash
# Manual registration
claude mcp add apex-hive -s user "node $(pwd)/mcp-server.js"
```

### Command Execution Issues

#### "Command not found"
```
Error: Unknown command: xyz
```
**Solutions:**
1. Check available commands:
```bash
apex help
```
2. Verify command exists:
```bash
apex help | grep "command-name"
```

#### "Permission denied"
```
Error: EACCES: permission denied
```
**Solution:**
```bash
# Make scripts executable
chmod +x scripts/*.js
chmod +x index.js
chmod +x mcp-server.js
```

#### Natural Language Not Working
**Example:** `apex "fix the CI"` not recognized

**Solutions:**
1. Use quotes for natural language:
```bash
apex "fix the CI"  # Correct
apex fix the CI    # Wrong
```
2. Check patterns file exists:
```bash
ls config/patterns*.js
```

### CI/CD Issues

#### "Git command failed"
```
Error: Git push failed: fatal: No upstream branch
```
**Solution:**
```bash
# Set upstream branch
git push --set-upstream origin $(git branch --show-current)
# Or use
apex git:push --upstream
```

#### "CI logs not found"
**Solutions:**
1. Ensure GitHub CLI is installed:
```bash
gh --version
```
2. Authenticate with GitHub:
```bash
gh auth login
```

### Performance Issues

#### Commands Running Slowly
**Solutions:**
1. Clear cache:
```bash
apex cache:clear
```
2. Check disk space:
```bash
df -h
```
3. Disable cache temporarily:
```bash
APEX_NO_CACHE=true apex search "test"
```

#### High Memory Usage
**Solution:**
```bash
# Reduce cache size in modules/cache.js
# Change: max: 500
# To: max: 100
```

### Documentation Issues

#### "No documentation found"
**Solution:**
```bash
# Generate missing docs
apex doc:generate-missing
```

#### Broken Links in Docs
**Solution:**
```bash
# Find and fix broken links
apex doc:validate-links
apex doc:fix-links
```

### Quality Control Issues

#### ESLint Errors
```
Error: Linting failed
```
**Solutions:**
1. Auto-fix issues:
```bash
apex quality:fix-all
```
2. Check specific files:
```bash
npx eslint scripts/problematic-file.js
```

#### "Console.log detected"
**Solution:**
```bash
apex quality:console-clean
```

## 🛠️ Diagnostic Commands

### System Check
```bash
# Full system verification
node verify-installation.js

# Check Node version
node --version  # Should be 18+

# Check npm packages
npm list

# Check git
git --version
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=DEBUG apex ci:status

# Dry run mode
apex ci:fix --dry-run

# Verbose output
apex doc:generate --verbose
```

### MCP Debugging
```bash
# List MCP servers
claude mcp list

# Test MCP directly
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-server.js

# Check MCP output
node mcp-server.js 2>debug.log
```

## 📊 Error Messages Explained

### "Recipe failed"
**Meaning:** One or more steps in a recipe failed
**Solution:** Run steps individually to find the issue

### "Cache miss"
**Meaning:** Requested data not in cache
**Solution:** Normal behavior, will fetch fresh data

### "Pattern not matched"
**Meaning:** Natural language input not recognized
**Solution:** Try rephrasing or use direct command

### "Module not initialized"
**Meaning:** Required module not loaded
**Solution:** Restart apex or check module files

## 🔧 Advanced Troubleshooting

### Reset Everything
```bash
# Clear all caches
apex cache:clear

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Re-verify
node verify-installation.js

# Re-register MCP
claude mcp remove apex-hive
node install-mcp.js
```

### Check File Permissions
```bash
# List all permissions
ls -la scripts/

# Fix permissions
find . -name "*.js" -exec chmod +x {} \;
```

### Trace Execution
```bash
# See what's happening
NODE_DEBUG=* apex search "test" 2>trace.log
```

## 📞 Getting Help

### 1. Built-in Help
```bash
apex help
apex <command> --help
```

### 2. Check Logs
- Look for `[ERROR]` in output
- Check stderr vs stdout
- Enable debug logging

### 3. Common Fixes
- Restart Claude Desktop
- Clear cache
- Reinstall dependencies
- Check file permissions

### 4. Report Issues
- GitHub Issues (include full error)
- Include `node verify-installation.js` output
- Mention your OS and Node version

---

*Most issues can be resolved by running `verify-installation.js` and following its suggestions.*