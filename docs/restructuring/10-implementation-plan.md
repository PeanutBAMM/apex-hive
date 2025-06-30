# Implementation Plan - Apex Hive

<overview>
Complete implementation roadmap for transitioning from the current system to the simplified Apex Hive architecture.
</overview>

## 🎯 Implementation Strategy

<approach>
### Clean Rebuild Approach

Instead of refactoring in place, we'll build Apex Hive fresh:

1. **Sparse Clone** - Only essential files
2. **Clean Build** - New structure from scratch  
3. **Progressive Migration** - Scripts one by one
4. **Parallel Running** - Test before switching
5. **Clean Cutover** - Replace when stable
</approach>

## 📅 Implementation Timeline

<timeline>
### Week 1: Foundation (5 days)

#### Day 1-2: Setup & Extraction
```bash
#!/bin/bash
# setup-apex-hive.sh

# Create workspace
mkdir apex-hive-workspace
cd apex-hive-workspace

# Sparse clone with minimal history
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/user/apex-hive-minds apex-hive-source

cd apex-hive-source

# Only checkout essentials
git sparse-checkout init --cone
git sparse-checkout set \
  scripts \
  docs/development \
  docs/scripts-refactor \
  docs/setup \
  docs/troubleshooting \
  docs/ci-cd \
  docs/restructuring \
  packages/@apex-hive-minds/mcp-rag-server

# Create build directory
cd ..
mkdir apex-hive
cd apex-hive

# Initialize new package
npm init @apex-hive/core -y
```

#### Day 3: Core Modules
- [ ] MCP Gateway (50 lines)
- [ ] Output Formatter
- [ ] Apex Router (200 lines)
- [ ] Test with Claude

#### Day 4: Essential Modules
- [ ] Cache Module (single LRU with persistent patterns)
- [ ] FileOps (with locks)
- [ ] Simple RAG wrapper
- [ ] GitOps basics

#### Day 5: Integration Testing
- [ ] MCP registration test
- [ ] Stdout pollution check
- [ ] Basic command routing
- [ ] Cache persistence for system docs

### Week 2: Essential Scripts (5 days)

#### Day 6-7: Core Scripts (20 scripts)
```javascript
// Priority 1: Essential scripts
const essentialScripts = [
  // Core (5)
  'init', 'build', 'test', 'search', 'save-conversation',
  
  // CI essentials (3)
  'ci-monitor', 'ci-fix', 'ci-status',
  
  // Doc essentials (5)
  'doc-generate', 'doc-validate', 'doc-update-readme',
  'doc-fix-links', 'doc-organize',
  
  // Quality essentials (4)
  'quality-lint', 'quality-fix-all', 'quality-console-clean',
  'quality-fix-versions',
  
  // Git essentials (3)
  'git-commit', 'git-push', 'git-status'
];
```

#### Day 8: Smart Features
- [ ] NL Pattern matching (NL + EN)
- [ ] Basic recipes (5-10 core)
- [ ] CLAUDE.md generation

#### Day 9-10: Testing Essential Scripts
- [ ] All 20 essential scripts working
- [ ] Core recipes tested
- [ ] Basic performance check

### Week 3: Remaining Scripts (5 days)

#### Day 11-13: Additional Scripts (40 scripts)
```javascript
// Priority 2: Additional functionality
const additionalScripts = [
  // Remaining CI (3)
  'ci-parse', 'ci-heal', 'ci-watch', 'ci-smart-push',
  
  // Remaining Doc (10)
  'doc-generate-changed', 'doc-generate-missing', 'doc-update',
  'doc-validate-xml', 'doc-validate-links', 'doc-sync',
  'doc-add-xml', 'doc-search', 'doc-post-merge', 'doc-check',
  
  // Remaining Quality (4)
  'quality-validate', 'quality-format', 'quality-setup', 'quality-check',
  
  // All Backlog (5)
  'backlog-analyze', 'backlog-score', 'backlog-sync',
  'backlog-display', 'backlog-table',
  
  // All XML (3)
  'xml-validate', 'xml-add', 'xml-clean',
  
  // Remaining Git (5)
  'git-pull', 'git-tag', 'git-push-tags', 'git-init', 'git-branch',
  
  // Deploy & Detection (7)
  'deploy', 'version-bump', 'changelog-generate', 'release',
  'detect-issues', 'fix-detected', 'report',
  
  // Others (3)
  'test-setup', 'code', 'cache-warm-readmes', 'cache-clear'
];
```

#### Day 14-15: Advanced Features
- [ ] All recipes (20+)
- [ ] Advanced NL patterns
- [ ] README hot-loading
- [ ] Performance optimization

### Week 4: Polish & Launch (5 days)

#### Day 16-17: Integration Testing
- [ ] All 60 scripts verified
- [ ] All recipes working
- [ ] NL commands tested
- [ ] Performance benchmarks

#### Day 18-19: Documentation & Cleanup
- [ ] Complete documentation
- [ ] CLAUDE.md finalized
- [ ] Migration guide
- [ ] Clean up code

#### Day 20: Launch
- [ ] Final testing
- [ ] Deploy Apex Hive
- [ ] Monitor for 24 hours
- [ ] Celebrate! 🎉
</timeline>

## 🏗️ Build Process

<build>
### Directory Structure
```
apex-hive/
├── package.json           # @apex-hive/core
├── index.js              # Main entry
├── mcp-server.js         # MCP gateway
├── apex-router.js        # Command router
├── output-formatter.js   # Token optimization
│
├── modules/
│   ├── cache.js          # Two-tier cache
│   ├── file-ops.js       # Safe file operations
│   ├── rag-system.js     # Ripgrep wrapper
│   └── git-ops.js        # Git operations
│
├── scripts/              # All 45 scripts (flat)
│   ├── ci-monitor.js
│   ├── doc-generate.js
│   └── ... (43 more)
│
├── config/
│   ├── recipes.json      # Workflow definitions
│   ├── patterns.js       # NL patterns
│   ├── patterns-nl.js    # Dutch patterns
│   └── registry.js       # Script registry
│
└── data/
    └── CLAUDE.md         # Auto-generated
```

### Build Script
```javascript
// build-apex-hive.js
import { promises as fs } from 'fs';
import path from 'path';

async function build() {
  console.log('🏗️  Building Apex Hive...\n');
  
  // Step 1: Create structure
  const dirs = [
    'modules',
    'scripts',
    'config', 
    'data'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✅ Created ${dir}/`);
  }
  
  // Step 2: Generate core files
  await generateMCPGateway();
  await generateRouter();
  await generateCache();
  await generateFileOps();
  
  // Step 3: Migrate scripts
  await migrateAllScripts();
  
  // Step 4: Generate configs
  await generateRecipes();
  await generatePatterns();
  await generateRegistry();
  
  // Step 5: Generate CLAUDE.md
  await generateClaudeInstructions();
  
  console.log('\n✨ Apex Hive build complete!');
}

async function generateMCPGateway() {
  const content = `#!/usr/bin/env node
// Stdout protection - FIRST LINE
console.log = console.error;

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import ApexRouter from './apex-router.js';
import { formatOutput } from './output-formatter.js';

const server = new Server({
  name: 'apex-hive-gateway',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

const router = new ApexRouter();
await router.initialize();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { command, args } = request.params.arguments;
  
  try {
    const result = await router.execute(command, args);
    const formatted = await formatOutput(result, { command, args });
    
    return {
      content: [{
        type: 'text',
        text: formatted
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: \`Error: \${error.message}\\n\${error.stack}\`
      }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
`;
  
  await fs.writeFile('mcp-server.js', content);
  console.log('✅ Generated mcp-server.js');
}

build().catch(console.error);
```
</build>

## 🌍 Nederlandse Taal Support

<nl-support>
### Pattern Implementation
```javascript
// config/patterns-nl.js
module.exports = [
  // Nederlandse commando's
  { match: /fix de (ci|build|tests?)/i, recipe: 'fix-ci' },
  { match: /commit en push/i, recipe: 'commit-push' },
  { match: /ruim(t?) (de )?code op/i, recipe: 'clean-code' },
  { match: /zoek naar (.+)/i, handler: m => ({ command: 'search', args: { query: m[1] }}) },
  { match: /wat is (er )?kapot\??/i, recipe: 'detect-issues' },
  { match: /start mijn dag/i, recipe: 'start-day' },
  { match: /einde van de dag/i, recipe: 'end-day' },
  { match: /maak schoon/i, recipe: 'clean-all' },
  { match: /genereer docs?/i, command: 'doc:generate' },
  { match: /test alles/i, command: 'test' }
];

// Merge met Engelse patterns
const englishPatterns = require('./patterns.js');
module.exports = [...module.exports, ...englishPatterns];
```

### CLAUDE.md met NL
```markdown
## 💬 Natural Language Commands (NL/EN)

### Nederlands
- "fix de CI" → CI problemen oplossen
- "zoek naar authentication" → Doorzoek codebase
- "commit en push" → Complete commit workflow
- "wat is kapot?" → Toon alle problemen
- "ruim code op" → Quality fixes
- "start mijn dag" → Daily startup routine

### English
- "fix the CI" → Fix CI issues
- "search for authentication" → Search codebase
- "commit and push" → Full commit workflow
- "what's broken?" → Show all issues
```
</nl-support>

## ✅ Pre-Implementation Checklist

<checklist>
### Environment Setup
- [ ] Node.js 18+ installed
- [ ] Ripgrep installed and working
- [ ] Git configured
- [ ] Claude Desktop installed
- [ ] MCP SDK available

### Source Code Ready
- [ ] Repository accessible
- [ ] All tests passing
- [ ] Documentation current
- [ ] No uncommitted changes

### Build Tools
- [ ] npm/yarn working
- [ ] ESLint configured
- [ ] Test runner ready
- [ ] Build scripts prepared
</checklist>

## 🔄 Migration Process

<migration>
### Phase 1: Parallel Development
1. Build Apex Hive in separate directory
2. Keep original system running
3. Test each component independently
4. No changes to original code

### Phase 2: Integration Testing
```bash
# Test MCP registration
claude mcp add apex-hive-test -s user "node /path/to/apex-hive/mcp-server.js"

# Test commands
apex help
apex status
apex search "test"
apex ci:status

# Verify no stdout pollution
timeout 2s node mcp-server.js 2>/dev/null | wc -c
# Should output: 0
```

### Phase 3: Gradual Migration
1. Route specific commands to new system
2. Monitor for issues
3. Compare outputs
4. Build confidence

### Phase 4: Cutover
```bash
# Remove old MCP
claude mcp remove apex-rag -s user

# Add new MCP
claude mcp add apex-hive -s user "node /path/to/apex-hive/mcp-server.js"

# Restart Claude
# Test all functionality
```
</migration>

## 🚨 Rollback Plan

<rollback>
### If Issues Occur
1. **Immediate**: Switch back to old MCP server
2. **Debug**: Check logs for errors
3. **Fix**: Address specific issues
4. **Retry**: Test fixes in isolation

### Rollback Commands
```bash
# Quick rollback
claude mcp remove apex-hive -s user
claude mcp add apex-rag -s user "node /path/to/old/mcp-server.js"

# Restart Claude
```

### Backup Strategy
- Keep old system intact
- Tag working versions
- Document each change
- Test rollback process
</rollback>

## 📊 Success Metrics

<metrics>
### Performance Targets
- **Startup Time**: <500ms
- **Command Latency**: <100ms  
- **Memory Usage**: <100MB
- **Cache Hit Rate**: >80%

### Functionality Tests
- ✅ All 45 scripts working
- ✅ All recipes executing
- ✅ NL commands recognized
- ✅ No stdout pollution
- ✅ Cache persistence
- ✅ Error handling

### Quality Metrics
- 0 ESLint errors
- 100% critical path coverage
- Clean dependency tree
- No security warnings
</metrics>

## 🚀 Launch Checklist

<launch>
### Final Verification
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] CLAUDE.md generated
- [ ] Rollback tested

### Communication
- [ ] Team notified
- [ ] Changelog updated
- [ ] Migration guide ready
- [ ] Support plan in place

### Go-Live
1. Final backup of old system
2. Deploy Apex Hive
3. Update MCP registration
4. Monitor for 24 hours
5. Celebrate! 🎉
</launch>

---

**Ready to begin implementation?** Start with Day 1: Setup & Extraction!