# Apex Hive MCP Troubleshooting Guide

## Issue: "tool_use ids were found without tool_result blocks immediately after"

This error typically occurs when there's a protocol mismatch or stdout pollution in the MCP server.

## Solution Applied

1. **Complete stdout silence** - All console.log and console.error calls are silenced
2. **Simplified error handling** - Removed stack traces from error responses
3. **Clean protocol implementation** - Following MCP SDK patterns exactly

## Testing the MCP Server

### 1. Test for stdout pollution
```bash
timeout 2s node mcp-server.js 2>/dev/null | wc -c
```
Expected output: `0` (zero bytes)

### 2. Test the protocol directly
```bash
node test-mcp-protocol.js
```
This should show successful initialize, list tools, and call tool responses.

### 3. Test with Claude Code

First, ensure the server is properly registered:
```bash
# Remove old registration if exists
claude mcp remove apex-hive 2>/dev/null || true

# Add fresh registration
claude mcp add apex-hive -s user "node $(pwd)/mcp-server.js"

# Verify registration
claude mcp get apex-hive
```

### 4. Start Claude Code with debugging
```bash
# On Windows WSL
claude.exe

# On Linux/Mac
claude
```

## Common Issues and Fixes

### Issue: Server not found
- Make sure you're in the apex-hive directory when registering
- Use absolute paths: `node /full/path/to/apex-hive/mcp-server.js`

### Issue: Permission denied
```bash
chmod +x mcp-server.js
chmod +x index.js
```

### Issue: Module not found
```bash
npm install
```

### Issue: Still getting the tool_use error
1. Restart Claude Code completely
2. Clear any Claude Code cache/state
3. Try with a fresh conversation

## What the Fixed Server Does

1. **No stdout output** - Prevents JSON-RPC protocol corruption
2. **Simple responses** - Clean text responses without complex formatting
3. **Proper error handling** - Returns errors as valid MCP responses
4. **Async initialization** - Router is initialized before server starts

## Testing Individual Commands

Once MCP is working in Claude Code, you can test:
- `apex help` - Should show help text
- `apex search test` - Should search for "test" in files
- `apex "fix the CI"` - Should understand natural language

## Debug Mode

If you need to debug, use the debug server:
```bash
node mcp-server-debug.js
# Check mcp-debug.log for protocol messages
```

## Next Steps

1. If the issue persists, check the Claude Code logs
2. Try with a minimal test: just ask Claude to run "apex help"
3. Make sure no other MCP servers are conflicting

---

*Last updated: 2025-06-30*