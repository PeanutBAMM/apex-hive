# MCP Integration Guide

## 🤖 What is MCP?

Model Context Protocol (MCP) is Anthropic's standard for integrating tools with Claude Desktop. Apex Hive includes a full MCP server implementation for seamless Claude integration.

## 🚀 Setup

### Quick Install

1. **Run the installer**
```bash
node install-mcp.js
```javascript

2. **Restart Claude Desktop**

3. **Test the integration**
Type in Claude:
```javascript
apex help
```javascript

### Manual Setup

If automatic installation fails:

1. **Register with Claude CLI**
```bash
claude mcp add apex-hive -s user "node /path/to/apex-hive/mcp-server.js"
```javascript

2. **Verify registration**
```bash
claude mcp list
```javascript

3. **Restart Claude Desktop**

## 💡 Usage in Claude

### Direct Commands
```javascript
apex ci:status
apex search "authentication"
apex doc:generate
```javascript

### Natural Language
```javascript
apex "fix the CI"
apex "what's broken?"
apex "generate documentation"
```javascript

### Recipes
```javascript
apex start-day
apex fix-all
apex commit-and-push
```javascript

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
```javascript

### Request Flow
```javascript
Claude → MCP Protocol → apex-hive server → Router → Script → Response
```javascript

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
```javascript

## MCP-Specific Settings
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
```javascript

### Error Response
```json
{
  "content": [{
    "type": "text",
    "text": "Error: Details here\nStack trace..."
  }],
  "isError": true
}
```javascript

## 🎯 Best Practices

### 1. Use Natural Language
Instead of memorizing commands:
```javascript
apex "find all TypeScript files"
apex "check what's broken"
apex "clean up console logs"
```javascript

### 2. Leverage Recipes
For complex workflows:
```javascript
apex start-day
apex fix-all
apex deploy-safe
```javascript

### 3. Check Status First
Before making changes:
```javascript
apex ci:status
apex git:status
apex detect-issues
```javascript

## 📝 Working with Large Output Commands

### The Token Limit Challenge

Some commands like `detect-issues` can generate output exceeding Claude's 25,000 token limit, causing errors. Use pagination and filters to manage output size.

### Using Pagination

The `detect-issues` command supports pagination to limit output:

```javascript
// Get first 10 issues
apex detect-issues --page 1 --limit 10

// Get next 10 issues
apex detect-issues --page 2 --limit 10

// With MCP tool
mcp__apex-hive__apex command="detect-issues" args={"limit": 10, "page": 1}
```

### Using Severity Filters

Filter by severity to see only critical issues:

```javascript
// Only high severity issues
apex detect-issues --severity high

// Medium and above
apex detect-issues --severity medium

// With MCP tool
mcp__apex-hive__apex command="detect-issues" args={"severity": "high"}
```

### Combining Filters

Use multiple filters together:

```javascript
// High severity issues, page 1, limit 5
apex detect-issues --severity high --page 1 --limit 5

// With MCP tool
mcp__apex-hive__apex command="detect-issues" args={
  "severity": "high",
  "limit": 5,
  "page": 1
}
```

### Tips for Managing Large Outputs

1. **Start Small**: Begin with `--limit 5` to assess the volume
2. **Use Severity**: Focus on high-priority issues first
3. **Page Through**: Process issues in batches
4. **Natural Language**: Try "show me the first 5 critical issues"

⚠️ **Warning**: Without pagination, `detect-issues` on large codebases can exceed token limits and fail to display results.

## 🛠️ Troubleshooting

### MCP Not Working?

1. **Check registration**
```bash
claude mcp list | grep apex-hive
```javascript

2. **Verify path**
```bash
which node
ls -la /path/to/apex-hive/mcp-server.js
```javascript

3. **Test directly**
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-server.js
```javascript

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
```javascript
apex "fix all issues, generate docs, and run tests"
```javascript

### Conditional Execution
```javascript
apex "if CI is broken, fix it"
```javascript

### Status Reports
```javascript
apex "give me a full status report"
```javascript

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
```javascript
apex cache:clear  # Clear if needed
apex cache:warm-readmes  # Pre-warm cache
```javascript

## 📈 Monitoring

### Debug Mode
```bash
LOG_LEVEL=DEBUG claude
```javascript

### View Logs
- Check Claude's developer console
- Look for `[MCP]` prefixed messages
- Monitor stderr output

---

*MCP integration makes Apex Hive a powerful companion for Claude Desktop users!*