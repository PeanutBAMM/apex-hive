# Troubleshooting Guide

## 🔍 Common Issues

### Installation Issues

#### "Cannot find module" Error
```javascript
Error: Cannot find module 'lru-cache'
```javascript
**Solution:**
```bash
npm install
```javascript

#### "Scripts directory not found"
```javascript
Error: ENOENT: no such file or directory
```javascript
**Solution:**
```bash
# Verify you're in the right directory
pwd
# Should show: /path/to/apex-hive

# Check structure
ls -la
```javascript

## Verification Fails
```javascript
❌ Modules load correctly: Cannot find module
```javascript
**Solution:**
```bash
# Install dependencies
npm install

# Run verification
node verify-installation.js
```javascript

## MCP Integration Issues

#### "apex not recognized" in Claude
**Solutions:**
1. Restart Claude Desktop
2. Re-register MCP:
```bash
claude mcp remove apex-hive
node install-mcp.js
```javascript
3. Restart Claude again

#### "No output" from MCP commands
**Check stdout pollution:**
```bash
node mcp-server.js < /dev/null
# Should output nothing to stdout
```javascript

## MCP Registration Failed
```bash
# Manual registration
claude mcp add apex-hive -s user "node $(pwd)/mcp-server.js"
```javascript

## Command Execution Issues

#### "Command not found"
```javascript
Error: Unknown command: xyz
```javascript
**Solutions:**
1. Check available commands:
```bash
apex help
```javascript
2. Verify command exists:
```bash
apex help | grep "command-name"
```javascript

#### "Permission denied"
```javascript
Error: EACCES: permission denied
```javascript
**Solution:**
```bash
# Make scripts executable
chmod +x scripts/*.js
chmod +x index.js
chmod +x mcp-server.js
```javascript

## Natural Language Not Working
**Example:** `apex "fix the CI"` not recognized

**Solutions:**
1. Use quotes for natural language:
```bash
apex "fix the CI"  # Correct
apex fix the CI    # Wrong
```javascript
2. Check patterns file exists:
```bash
ls config/patterns*.js
```javascript

### CI/CD Issues

#### "Git command failed"
```javascript
Error: Git push failed: fatal: No upstream branch
```javascript
**Solution:**
```bash
# Set upstream branch
git push --set-upstream origin $(git branch --show-current)
# Or use
apex git:push --upstream
```javascript

## "CI logs not found"
**Solutions:**
1. Ensure GitHub CLI is installed:
```bash
gh --version
```javascript
2. Authenticate with GitHub:
```bash
gh auth login
```javascript

### Performance Issues

#### Commands Running Slowly
**Solutions:**
1. Check cache status:
```bash
apex cache:status --detailed
```
2. Clear cache if needed:
```bash
apex cache:clear
```
3. Check disk space:
```bash
df -h
# Also check cache directory
du -sh ~/.apex-cache/
```
4. Disable cache temporarily:
```bash
APEX_NO_CACHE=true apex search "test"
```

#### High Memory Usage
The new file-based cache doesn't use memory, but if disk usage is high:
```bash
# Check cache sizes
apex cache:status

# Clear specific namespace
apex cache:clear --namespace search

# Check cache directory size
du -sh ~/.apex-cache/*
```

### Cache Diagnostics

#### Cache Not Working
**Check cache health:**
```bash
# View cache statistics
apex cache:status

# Check hit rates
apex cache:status --detailed | grep hitRate

# Verify cache directory exists
ls -la ~/.apex-cache/
```

#### Low Cache Hit Rate
**Solutions:**
1. Pre-warm cache for better performance:
```bash
apex cache:warm-readmes
```
2. Check TTL settings in cache status
3. Verify files are being cached:
```bash
# Run command twice and check hits increase
apex search "test"
apex cache:status | grep hits
apex search "test"  
apex cache:status | grep hits  # Should show increased hits
```

## Documentation Issues

#### "No documentation found"
**Solution:**
```bash
# Generate missing docs
apex doc:generate-missing
```javascript

## Broken Links in Docs
**Solution:**
```bash
# Find and fix broken links
apex doc:validate-links
apex doc:fix-links
```javascript

## Quality Control Issues

#### ESLint Errors
```javascript
Error: Linting failed
```javascript
**Solutions:**
1. Auto-fix issues:
```bash
apex quality:fix-all
```javascript
2. Check specific files:
```bash
npx eslint scripts/problematic-file.js
```javascript

#### "Console.log detected"
**Solution:**
```bash
apex quality:console-clean
```javascript

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
```javascript

## Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=DEBUG apex ci:status

# Dry run mode
apex ci:fix --dry-run

# Verbose output
apex doc:generate --verbose
```javascript

## MCP Debugging
```bash
# List MCP servers
claude mcp list

# Test MCP directly
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-server.js

# Check MCP output
node mcp-server.js 2>debug.log
```javascript

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

# Remove cache directory completely
rm -rf ~/.apex-cache/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Re-verify
node verify-installation.js

# Re-register MCP
claude mcp remove apex-hive
node install-mcp.js
```

## Check File Permissions
```bash
# List all permissions
ls -la scripts/

# Fix permissions
find . -name "*.js" -exec chmod +x {} \;
```javascript

## Trace Execution
```bash
# See what's happening
NODE_DEBUG=* apex search "test" 2>trace.log
```javascript

## 📞 Getting Help

### 1. Built-in Help
```bash
apex help
apex <command> --help
```javascript

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