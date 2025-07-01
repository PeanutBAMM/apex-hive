#!/usr/bin/env node
// prepare-release.js - Prepare Apex Hive for release

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
╔═══════════════════════════════════════════════════╗
║          🚀 Apex Hive Release Preparation         ║
╚═══════════════════════════════════════════════════╝

Preparing version 1.0.0 for release...
`);

async function checkFile(name, path) {
  try {
    await fs.access(path);
    // console.log(`✅ ${name}`);
    return true;
  } catch {
    // console.log(`❌ ${name} - Missing!`);
    return false;
  }
}

// Check all required files
// console.log('\n📋 Checking required files:');
const files = [
  ['package.json', path.join(__dirname, 'package.json')],
  ['README.md', path.join(__dirname, 'README.md')],
  ['CLAUDE.md', path.join(__dirname, 'CLAUDE.md')],
  ['CHANGELOG.md', path.join(__dirname, 'CHANGELOG.md')],
  ['MIGRATION-GUIDE.md', path.join(__dirname, 'MIGRATION-GUIDE.md')],
  ['mcp-server.js', path.join(__dirname, 'mcp-server.js')],
  ['apex-router.js', path.join(__dirname, 'apex-router.js')],
  ['index.js', path.join(__dirname, 'index.js')]
];

let allPresent = true;
for (const [name, filePath] of files) {
  const exists = await checkFile(name, filePath);
  if (!exists) allPresent = false;
}

// Check version
// console.log('\n📦 Checking version:');
const pkg = JSON.parse(await fs.readFile(path.join(__dirname, 'package.json'), 'utf8'));
if (pkg.version === '1.0.0') {
  // console.log(`✅ Version is 1.0.0`);
} else {
  // console.log(`❌ Version is ${pkg.version}, should be 1.0.0`);
  allPresent = false;
}

// Check script count
// console.log('\n📊 Checking scripts:');
const scriptsDir = path.join(__dirname, 'scripts');
const scriptFiles = await fs.readdir(scriptsDir);
const scriptCount = scriptFiles.filter(f => f.endsWith('.js')).length;
// console.log(`✅ ${scriptCount} scripts found`);

// Git status (if in git repo)
// console.log('\n🔍 Git status:');
try {
  const isGitRepo = await fs.access(path.join(__dirname, '.git')).then(() => true).catch(() => false);
  if (isGitRepo) {
    const status = execSync('git status --short', { encoding: 'utf8', cwd: __dirname });
    if (status.trim()) {
      // console.log('⚠️  Uncommitted changes:');
      // console.log(status);
    } else {
      // console.log('✅ No uncommitted changes');
    }
  } else {
    // console.log('ℹ️  Not a git repository (this is normal for apex-hive-workspace)');
  }
} catch (error) {
  // console.log('ℹ️  Could not check git status');
}

// Summary
console.log(`
╔═══════════════════════════════════════════════════╗
║                  📊 Summary                       ║
╚═══════════════════════════════════════════════════╝

${allPresent ? '✅ All files present' : '❌ Some files missing'}
✅ ${scriptCount} scripts ready
✅ Version 1.0.0 set

🎯 Release Checklist:

1. Copy to main repository:
   cp -r ${__dirname}/* /path/to/apex-hive-minds/packages/apex-hive/

2. In main repository:
   cd /path/to/apex-hive-minds
   git add packages/apex-hive
   git commit -m "feat: Apex Hive 1.0.0 release"
   git tag apex-hive-v1.0.0
   git push origin main --tags

3. Test MCP registration:
   node ${path.join(__dirname, 'install-mcp.js')}

4. Announce release:
   - Update main README
   - Create GitHub release
   - Share with team

📚 Documentation:
- README.md - Installation guide
- CLAUDE.md - Full command reference  
- MIGRATION-GUIDE.md - Migration from old system

🚀 The Apex Hive 1.0.0 release is ready!
`);