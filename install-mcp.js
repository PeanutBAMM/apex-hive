#!/usr/bin/env node
// install-mcp.js - Help user install Apex Hive as MCP server

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
╔═══════════════════════════════════════════════════╗
║           🚀 Apex Hive MCP Installation           ║
╚═══════════════════════════════════════════════════╝

This script will help you register Apex Hive with Claude.

📍 Current directory: ${__dirname}
`);

// Check if claude CLI is available
try {
  execSync('which claude', { stdio: 'ignore' });
  console.log('✅ Claude CLI detected\n');
} catch {
  console.error(`❌ Claude CLI not found!

Please install the Claude CLI first:
https://github.com/anthropics/claude-cli

Or run manually:
claude mcp add apex-hive -s user "node ${path.join(__dirname, 'mcp-server.js')}"
`);
  process.exit(1);
}

// Check if already registered
try {
  const mcpList = execSync('claude mcp list', { encoding: 'utf8' });
  if (mcpList.includes('apex-hive')) {
    console.log(`⚠️  Apex Hive is already registered!

To update or reinstall:
1. Remove existing: claude mcp remove apex-hive
2. Run this script again

To test if it works:
- Restart Claude Desktop
- Type: apex help
`);
    process.exit(0);
  }
} catch (error) {
  // Ignore errors, continue with installation
}

// Prepare installation command
const mcp_command = `claude mcp add apex-hive -s user "node ${path.join(__dirname, 'mcp-server.js')}"`;

console.log(`📋 Installation command:
${mcp_command}

🔧 What this does:
- Registers Apex Hive as an MCP server
- Makes all 60+ commands available in Claude
- Enables natural language support (EN/NL)

Press ENTER to install, or Ctrl+C to cancel...`);

// Wait for user confirmation
process.stdin.once('data', () => {
  console.log('\n🚀 Installing Apex Hive...\n');
  
  try {
    const output = execSync(mcp_command, { 
      encoding: 'utf8',
      stdio: 'inherit' 
    });
    
    console.log(`
✅ Installation successful!

🎉 Next steps:
1. Restart Claude Desktop
2. Test with: apex help
3. Try natural language: "fix de CI"

📚 Available commands:
- apex ci:status
- apex search <query>
- apex doc:generate
- apex quality:fix-all
- apex backlog:display
- ... and 60+ more!

See CLAUDE.md for full documentation.
`);
    
  } catch (error) {
    console.error(`
❌ Installation failed!

Error: ${error.message}

Manual installation:
${mcp_command}

If you're seeing permission errors, try:
- Running as administrator (Windows)
- Using sudo (Mac/Linux)
`);
    process.exit(1);
  }
});