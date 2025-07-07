#!/usr/bin/env node
// verify-installation.js - Verify Apex Hive installation

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
╔═══════════════════════════════════════════════════╗
║        🔍 Apex Hive Installation Verification     ║
╚═══════════════════════════════════════════════════╝
`);

let passed = 0;
let failed = 0;

async function check(name, test) {
  try {
    const result = await test();
    if (result) {
      // console.log(`✅ ${name}`);
      passed++;
    } else {
      // console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    // console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Run checks
await check('CLAUDE.md exists', async () => {
  const exists = await fs.access(path.join(__dirname, 'CLAUDE.md')).then(() => true).catch(() => false);
  return exists;
});

await check('MCP server file exists', async () => {
  const exists = await fs.access(path.join(__dirname, 'mcp-server.js')).then(() => true).catch(() => false);
  return exists;
});

await check('All 70+ scripts exist', async () => {
  const scriptsDir = path.join(__dirname, 'scripts');
  const files = await fs.readdir(scriptsDir);
  return files.length >= 70;
});

await check('No stdout pollution', async () => {
  try {
    const stdout = execSync(`timeout 1s node ${path.join(__dirname, 'mcp-server.js')}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return stdout === '';
  } catch (error) {
    // Timeout is expected, check if stdout was empty
    return !error.stdout || error.stdout.trim() === '';
  }
});

await check('Help command works', async () => {
  execSync(`node ${path.join(__dirname, 'index.js')} help`, { stdio: 'ignore' });
  return true;
});

await check('Search command works', async () => {
  execSync(`node ${path.join(__dirname, 'index.js')} search "test"`, { stdio: 'ignore' });
  return true;
});

await check('Dutch NL works', async () => {
  try {
    // Capture both stdout and stderr
    const result = execSync(`node ${path.join(__dirname, 'index.js')} "zoek naar test" 2>&1`, { 
      encoding: 'utf8'
    });
    return result.includes('Results') || result.includes('matches') || result.includes('Found');
  } catch (error) {
    return false;
  }
});

await check('Package.json valid', async () => {
  const pkg = JSON.parse(await fs.readFile(path.join(__dirname, 'package.json'), 'utf8'));
  return pkg.name === 'apex-hive' && pkg.version && pkg.type === 'module';
});

await check('Registry has 70+ commands', async () => {
  const { default: registry } = await import('./config/registry.js');
  return Object.keys(registry).length >= 70;
});

await check('Modules load correctly', async () => {
  await import('./modules/unified-cache.js');
  await import('./modules/file-ops.js');
  await import('./modules/rag-system.js');
  await import('./modules/git-ops.js');
  return true;
});

// Summary
console.log(`
╔═══════════════════════════════════════════════════╗
║                    📊 Summary                     ║
╚═══════════════════════════════════════════════════╝

✅ Passed: ${passed}
❌ Failed: ${failed}
📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%

${failed === 0 ? '🎉 All checks passed! Apex Hive is ready to use.' : '⚠️  Some checks failed. Please fix the issues above.'}

📋 MCP Registration Command:
claude mcp add apex-hive -s user "node ${path.join(__dirname, 'mcp-server.js')}"

📚 Next Steps:
1. Run: node install-mcp.js
2. Restart Claude Desktop
3. Test: apex help
`);

process.exit(failed > 0 ? 1 : 0);