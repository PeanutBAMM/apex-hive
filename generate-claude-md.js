#!/usr/bin/env node
// Generate CLAUDE.md from registry

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import registry from './config/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script descriptions based on first-line comments
const descriptions = {
  // CI Scripts
  'ci:monitor': 'Monitor GitHub Actions CI status in real-time',
  'ci:parse': 'Parse CI logs for errors and warnings',
  'ci:fix': 'Auto-fix common CI issues',
  'ci:heal': 'Self-healing CI system that detects and fixes problems',
  'ci:watch': 'Watch CI runs and notify on status changes',
  'ci:smart-push': 'Intelligent git push with CI monitoring',
  'ci:status': 'Comprehensive CI status report',
  
  // Documentation Scripts
  'doc:generate': 'Generate documentation for changed files',
  'doc:generate-changed': 'Generate docs only for recently changed files',
  'doc:generate-missing': 'Generate documentation for files without docs',
  'doc:update': 'Update existing documentation',
  'doc:update-readme': 'Update README files automatically',
  'doc:validate': 'Validate documentation structure and completeness',
  'doc:validate-xml': 'Validate XML documentation tags',
  'doc:validate-links': 'Check all documentation links for validity',
  'doc:fix-links': 'Fix broken documentation links',
  'doc:organize': 'Organize documentation files into proper structure',
  'doc:sync': 'Sync documentation structure across repos',
  'doc:add-xml': 'Add XML documentation tags to files',
  'doc:search': 'Search through documentation',
  'doc:post-merge': 'Run documentation tasks after git merge',
  'doc:check': 'Check documentation status and coverage',
  
  // Quality Scripts
  'quality:lint': 'Run linting checks on codebase',
  'quality:fix-versions': 'Fix dependency version issues',
  'quality:console-clean': 'Remove console.log statements from code',
  'quality:fix-all': 'Fix all auto-fixable quality issues',
  'quality:validate': 'Validate code quality metrics',
  'quality:format': 'Format code according to standards',
  'quality:setup': 'Setup quality tools and configurations',
  'quality:check': 'Run comprehensive quality checks',
  
  // Backlog Scripts
  'backlog:analyze': 'Analyze backlog items and priorities',
  'backlog:score': 'Score backlog items by importance',
  'backlog:sync': 'Sync backlog with project management tools',
  'backlog:display': 'Display backlog in visual format',
  'backlog:table': 'Show backlog as a formatted table',
  
  // XML Scripts
  'xml:validate': 'Validate XML files and structure',
  'xml:add': 'Add XML content to files',
  'xml:clean': 'Clean and format XML files',
  
  // Git Scripts
  'git:commit': 'Create smart git commit with AI-generated message',
  'git:push': 'Push changes with safety checks',
  'git:status': 'Enhanced git status with more details',
  'git:pull': 'Pull changes with conflict detection',
  'git:tag': 'Create and manage git tags',
  'git:push-tags': 'Push tags to remote repository',
  'git:init': 'Initialize git repository with best practices',
  'git:branch': 'Manage git branches efficiently',
  
  // Core Scripts
  'init': 'Initialize new Apex project',
  'build': 'Build the project',
  'test': 'Run test suite',
  'test:run': 'Run test suite (alias)',
  'test:setup': 'Setup test environment',
  'search': 'Search codebase using ripgrep',
  'save-conversation': 'Save AI conversation for reference',
  'code': 'Generate code stubs and boilerplate',
  
  // Deployment Scripts
  'deploy': 'Deploy application to production',
  'version:bump': 'Bump version numbers',
  'changelog:generate': 'Generate CHANGELOG from commits',
  'release': 'Complete release workflow',
  
  // Detection Scripts
  'detect-issues': 'Detect all types of issues in codebase',
  'fix-detected': 'Fix issues found by detection',
  'report': 'Generate comprehensive status report',
  
  // Cache Scripts
  'cache:warm-readmes': 'Pre-cache README files for performance',
  'cache:clear': 'Clear all caches',
  'cache:status': 'Display cache statistics and status',
  
  // Workflow Helpers
  'commit': 'Quick commit (alias for git:commit)',
  'push': 'Smart push with CI (alias for ci:smart-push)',
  
  // Special
  'help': 'Show help and available commands'
};

async function generateClaudeMd() {
  console.log('Generating CLAUDE.md...');
  
  let content = `# Apex Hive - Claude Integration Guide

## 🚀 Overview

Apex Hive is a powerful development automation system with 60+ scripts for CI/CD, documentation, quality control, and more. This guide helps Claude understand and use all available commands.

## 📋 Available Commands

### Quick Access
- \`apex help\` - Show all available commands
- \`apex status\` - Check system status (alias: \`apex ci:status\`)
- \`apex search <query>\` - Search codebase
- \`apex commit\` - Quick commit with AI message
- \`apex push\` - Smart push with CI monitoring

### Natural Language Support

#### English Patterns
- "fix the CI" → \`apex ci:fix\`
- "what's broken?" → \`apex detect-issues\`
- "check status" → \`apex ci:status\`
- "generate docs" → \`apex doc:generate\`
- "run tests" → \`apex test\`

#### Dutch Patterns (Nederlands)
- "fix de CI" → \`apex ci:fix\`
- "wat is kapot?" → \`apex detect-issues\`
- "commit en push" → runs commit and push workflow
- "genereer docs" → \`apex doc:generate\`
- "voer tests uit" → \`apex test\`

## 📚 Complete Command Reference

`;

  // Group commands by category
  const categories = {
    'CI/CD Commands': [],
    'Documentation Commands': [],
    'Quality Control': [],
    'Backlog Management': [],
    'XML Processing': [],
    'Git Operations': [],
    'Core Commands': [],
    'Deployment': [],
    'Detection & Reporting': [],
    'Cache Management': [],
    'Aliases & Helpers': []
  };

  // Categorize commands
  for (const [cmd, scriptPath] of Object.entries(registry)) {
    if (!scriptPath && cmd !== 'help') continue;
    
    const desc = descriptions[cmd] || 'No description available';
    const entry = `- \`apex ${cmd}\` - ${desc}`;
    
    if (cmd.startsWith('ci:')) {
      categories['CI/CD Commands'].push(entry);
    } else if (cmd.startsWith('doc:')) {
      categories['Documentation Commands'].push(entry);
    } else if (cmd.startsWith('quality:')) {
      categories['Quality Control'].push(entry);
    } else if (cmd.startsWith('backlog:')) {
      categories['Backlog Management'].push(entry);
    } else if (cmd.startsWith('xml:')) {
      categories['XML Processing'].push(entry);
    } else if (cmd.startsWith('git:')) {
      categories['Git Operations'].push(entry);
    } else if (['deploy', 'version:bump', 'changelog:generate', 'release'].includes(cmd)) {
      categories['Deployment'].push(entry);
    } else if (['detect-issues', 'fix-detected', 'report'].includes(cmd)) {
      categories['Detection & Reporting'].push(entry);
    } else if (cmd.startsWith('cache:')) {
      categories['Cache Management'].push(entry);
    } else if (['commit', 'push', 'help'].includes(cmd)) {
      categories['Aliases & Helpers'].push(entry);
    } else {
      categories['Core Commands'].push(entry);
    }
  }

  // Add categories to content
  for (const [category, commands] of Object.entries(categories)) {
    if (commands.length === 0) continue;
    content += `\n### ${category}\n\n`;
    content += commands.join('\n') + '\n';
  }

  // Add recipes section
  content += `
## 🎯 Recipe Workflows

Apex Hive supports complex workflows through recipes:

### Development Workflows
- \`apex start-day\` - Runs: git:pull → ci:status → backlog:display
- \`apex commit-and-push\` - Runs: git:commit → ci:smart-push → ci:monitor
- \`apex fix-all\` - Runs: quality:fix-all → doc:generate → test:run

### CI/CD Workflows
- \`apex ci-fix-all\` - Runs: ci:parse → ci:fix → ci:heal → ci:monitor
- \`apex deploy-safe\` - Runs: test:run → version:bump → deploy → ci:monitor

### Documentation Workflows
- \`apex doc-complete\` - Runs: doc:generate-missing → doc:validate → doc:update-readme
- \`apex doc-fix-all\` - Runs: doc:fix-links → doc:add-xml → doc:organize

## 💡 Usage Examples

### Basic Commands
\`\`\`bash
# Check CI status
apex ci:status

# Search for a function
apex search "authenticate"

# Generate missing docs
apex doc:generate-missing

# Fix all quality issues
apex quality:fix-all
\`\`\`

### Natural Language
\`\`\`bash
# English
apex "fix the CI"
apex "what's broken?"
apex "generate documentation"

# Dutch
apex "fix de CI"
apex "wat is kapot?"
apex "genereer documentatie"
\`\`\`

### Advanced Workflows
\`\`\`bash
# Morning routine
apex start-day

# Before deploying
apex deploy-safe

# Fix everything
apex fix-all
\`\`\`

## 🔧 Options

Most commands support these options:
- \`--dry-run\` - Preview changes without applying
- \`--verbose\` - Show detailed output
- \`--force\` - Skip confirmations
- \`--help\` - Show command-specific help

## 📊 Output Format

All commands return structured JSON:
\`\`\`json
{
  "success": true,
  "data": {...},
  "message": "Operation completed",
  "error": null
}
\`\`\`

## 🚀 Quick Tips

1. **Use recipes** for complex workflows
2. **Natural language** works for common tasks
3. **Dry run** first to preview changes
4. **Check CI** before pushing changes
5. **Generate docs** after code changes

## 🆘 Troubleshooting

If a command fails:
1. Check with \`apex detect-issues\`
2. View detailed logs with \`--verbose\`
3. Try \`apex ci:heal\` for CI issues
4. Use \`apex quality:fix-all\` for code issues

---

*Generated: ${new Date().toISOString()}*
*Total Commands: ${Object.keys(registry).length}*
`;

  // Write the file
  const claudeMdPath = path.join(__dirname, 'CLAUDE.md');
  await fs.writeFile(claudeMdPath, content, 'utf8');
  
  console.log(`✅ Generated CLAUDE.md with ${Object.keys(registry).length} commands`);
  console.log(`📄 File saved to: ${claudeMdPath}`);
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateClaudeMd().catch(console.error);
}

export { generateClaudeMd };