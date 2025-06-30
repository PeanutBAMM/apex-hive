# MCP Integration Guide

## 🤖 What is MCP?

Model Context Protocol (MCP) is Anthropic's standard for integrating tools with Claude Desktop. Apex Hive includes a full MCP server implementation for seamless Claude integration.

## 🚀 Setup

### Quick Install

1. **Run the installer**
```bash
node install-mcp.js
```

2. **Restart Claude Desktop**

3. **Test the integration**
Type in Claude:
```
apex help
```

### Manual Setup

If automatic installation fails:

1. **Register with Claude CLI**
```bash
claude mcp add apex-hive -s user "node /path/to/apex-hive/mcp-server.js"
```

2. **Verify registration**
```bash
claude mcp list
```

3. **Restart Claude Desktop**

## 💡 Usage in Claude

### Direct Commands
```
apex ci:status
apex search "authentication"
apex doc:generate
```

### Natural Language
```
apex "fix the CI"
apex "what's broken?"
apex "generate documentation"
```

### Recipes
```
apex start-day
apex fix-all
apex commit-and-push
```

## 🏗️ MCP Architecture

### Server Implementation
```javascript
// mcp-server.js structure
const server = new Server({
  name: 'apex-hive-gateway',
  version: '1.0.0'
});

// Single tool definition
const APEX_TOOL = {
  name: 'apex',
  description: 'Execute Apex Hive commands',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string' },
      args: { type: 'object' }
    }
  }
};
```

### Request Flow
```
Claude → MCP Protocol → apex-hive server → Router → Script → Response
```

## 📋 MCP Features

### Tool Registration
- Single `apex` tool exposed
- Flexible command/args structure
- Natural language support built-in

### Error Handling
- Graceful error messages
- Stack traces for debugging
- Proper MCP error responses

### Output Formatting
- Token-optimized responses
- Structured data display
- Progress indicators

## 🔧 Configuration

### Environment Variables
```bash
# Optional settings
LOG_LEVEL=DEBUG        # Enable debug logging
APEX_NO_CACHE=true    # Disable caching
APEX_DRY_RUN=true     # Preview mode
```

### MCP-Specific Settings
The MCP server:
- Redirects console.log to stderr
- Handles stdio transport
- Formats output for Claude

## 📊 Response Format

### Success Response
```json
{
  "content": [{
    "type": "text",
    "text": "Command output here..."
  }]
}
```

### Error Response
```json
{
  "content": [{
    "type": "text",
    "text": "Error: Details here\nStack trace..."
  }],
  "isError": true
}
```

## 🎯 Best Practices

### 1. Use Natural Language
Instead of memorizing commands:
```
apex "find all TypeScript files"
apex "check what's broken"
apex "clean up console logs"
```

### 2. Leverage Recipes
For complex workflows:
```
apex start-day
apex fix-all
apex deploy-safe
```

### 3. Check Status First
Before making changes:
```
apex ci:status
apex git:status
apex detect-issues
```

## 🛠️ Troubleshooting

### MCP Not Working?

1. **Check registration**
```bash
claude mcp list | grep apex-hive
```

2. **Verify path**
```bash
which node
ls -la /path/to/apex-hive/mcp-server.js
```

3. **Test directly**
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-server.js
```

### Common Issues

**"apex not found"**
- Restart Claude Desktop
- Re-run `install-mcp.js`

**"No output"**
- Check for stdout pollution
- Verify script permissions

**"Error executing"**
- Check error logs
- Run command directly via CLI

## 📚 Advanced Usage

### Batch Operations
```
apex "fix all issues, generate docs, and run tests"
```

### Conditional Execution
```
apex "if CI is broken, fix it"
```

### Status Reports
```
apex "give me a full status report"
```

## 🔐 Security

The MCP server:
- Only executes predefined scripts
- No arbitrary code execution
- Validates all inputs
- Sandboxed operations

## 🚀 Performance

### Optimizations
- Command result caching
- Lazy module loading
- Efficient output formatting
- Minimal token usage

### Cache Management
```
apex cache:clear  # Clear if needed
apex cache:warm-readmes  # Pre-warm cache
```

## 📈 Monitoring

### Debug Mode
```bash
LOG_LEVEL=DEBUG claude
```

### View Logs
- Check Claude's developer console
- Look for `[MCP]` prefixed messages
- Monitor stderr output

---

*MCP integration makes Apex Hive a powerful companion for Claude Desktop users!*