# Script Architecture

## Core Concept
**Direct Script Execution - No Managers, No Workers, Just Scripts**

## Simplified Structure

```javascript
scripts/
├── ci-monitor.js
├── ci-parse.js
├── ci-fix.js
├── ci-heal.js
├── doc-generate.js
├── doc-sync.js
├── doc-validate.js
├── quality-lint.js
├── quality-fix-all.js
├── quality-console-clean.js
├── backlog-analyze.js
├── backlog-score.js
├── xml-validate.js
├── xml-clean.js
└── ... (35+ scripts total)
```javascript

## Script Template

Each script follows a simple pattern:

```javascript
// scripts/ci-fix.js
export async function run(args) {
  // Direct implementation - no abstraction layers
  console.error('[CI-FIX] Starting CI fix process');
  
  // 1. Check what's broken
  const errors = await checkCIStatus();
  
  // 2. Fix what we can
  const fixes = [];
  for (const error of errors) {
    if (canAutoFix(error)) {
      const result = await fixError(error);
      fixes.push(result);
    }
  }
  
  // 3. Return clear result
  return {
    fixed: fixes.length,
    remaining: errors.length - fixes.length,
    details: fixes
  };
}

// Helper functions in same file
async function checkCIStatus() { ... }
async function fixError(error) { ... }
```javascript

## Key Principles

### 1. Single File = Single Purpose
- Each script does ONE thing well
- No complex inheritance chains
- Easy to understand and modify

### 2. Direct Execution
```javascript
// Old way: Router → Lead → Manager → Worker
// New way: Router → Script

// Direct call from router
const result = await import('./scripts/ci-fix.js').run(args);
```javascript

### 3. Shared Utilities (when needed)
```javascript
// scripts/utils/git.js
export async function getCurrentBranch() { ... }
export async function commitChanges(message) { ... }

// Used by multiple scripts
import { getCurrentBranch } from './utils/git.js';
```javascript

## Complete Script Registry

All 60 scripts registered for lazy loading:

```javascript
// config/registry.js
module.exports = {
  // CI Scripts (6)
  'ci:monitor': './scripts/ci-monitor.js',
  'ci:parse': './scripts/ci-parse.js',
  'ci:fix': './scripts/ci-fix.js',
  'ci:heal': './scripts/ci-heal.js',
  'ci:watch': './scripts/ci-watch.js',
  'ci:smart-push': './scripts/ci-smart-push.js',
  
  // Documentation Scripts (15)
  'doc:generate': './scripts/doc-generate.js',
  'doc:generate-changed': './scripts/doc-generate-changed.js',
  'doc:generate-missing': './scripts/doc-generate-missing.js',
  'doc:update': './scripts/doc-update.js',
  'doc:update-readme': './scripts/doc-update-readme.js',
  'doc:validate': './scripts/doc-validate.js',
  'doc:validate-xml': './scripts/doc-validate-xml.js',
  'doc:validate-links': './scripts/doc-validate-links.js',
  'doc:fix-links': './scripts/doc-fix-links.js',
  'doc:organize': './scripts/doc-organize.js',
  'doc:sync': './scripts/doc-sync.js',
  'doc:add-xml': './scripts/doc-add-xml.js',
  'doc:search': './scripts/doc-search.js',
  'doc:post-merge': './scripts/doc-post-merge.js',
  'doc:check': './scripts/doc-check.js',
  
  // Quality Scripts (8)
  'quality:lint': './scripts/quality-lint.js',
  'quality:fix-versions': './scripts/quality-fix-versions.js',
  'quality:console-clean': './scripts/quality-console-clean.js',
  'quality:fix-all': './scripts/quality-fix-all.js',
  'quality:validate': './scripts/quality-validate.js',
  'quality:format': './scripts/quality-format.js',
  'quality:setup': './scripts/quality-setup.js',
  'quality:check': './scripts/quality-check.js',
  
  // Backlog Scripts (5)
  'backlog:analyze': './scripts/backlog-analyze.js',
  'backlog:score': './scripts/backlog-score.js',
  'backlog:sync': './scripts/backlog-sync.js',
  'backlog:display': './scripts/backlog-display.js',
  'backlog:table': './scripts/backlog-table.js',
  
  // XML Scripts (3)
  'xml:validate': './scripts/xml-validate.js',
  'xml:add': './scripts/xml-add.js',
  'xml:clean': './scripts/xml-clean.js',
  
  // Git Scripts (8)
  'git:commit': './scripts/git-commit.js',
  'git:push': './scripts/git-push.js',
  'git:status': './scripts/git-status.js',
  'git:pull': './scripts/git-pull.js',
  'git:tag': './scripts/git-tag.js',
  'git:push --tags': './scripts/git-push-tags.js',
  'git:init': './scripts/git-init.js',
  'git:branch': './scripts/git-branch.js',
  
  // Core Scripts (8)
  'init': './scripts/init-project.js',
  'build': './scripts/build.js',
  'test': './scripts/test-runner.js',
  'test:run': './scripts/test-runner.js', // Alias
  'test:setup': './scripts/test-setup.js',
  'search': './scripts/search.js',
  'save-conversation': './scripts/save-conversation.js',
  'code': './scripts/code-stub.js', // Placeholder for workflow
  
  // Deployment Scripts (4)
  'deploy': './scripts/deploy.js',
  'version:bump': './scripts/version-bump.js',
  'changelog:generate': './scripts/changelog-generate.js',
  'release': './scripts/release.js',
  
  // Detection Scripts (3)
  'detect-issues': './scripts/detect-issues.js',
  'fix-detected': './scripts/fix-detected.js',
  'report': './scripts/report-status.js',
  
  // Cache Scripts (2)
  'cache:warm-readmes': './scripts/cache-warm-readmes.js',
  'cache:clear': './scripts/cache-clear.js',
  
  // Workflow Helpers (2)
  'commit': './scripts/git-commit.js', // Alias for git:commit
  'push': './scripts/git-push.js' // Alias for git:push
};
```javascript

## Script Categories Summary

- **CI/CD**: 6 scripts for continuous integration
- **Documentation**: 15 scripts for doc management
- **Quality**: 8 scripts for code quality
- **Backlog**: 5 scripts for task management
- **XML**: 3 scripts for XML tag management
- **Git**: 8 scripts for version control
- **Core**: 8 essential scripts
- **Deployment**: 4 scripts for releases
- **Detection**: 3 scripts for smart detection
- **Cache**: 2 cache management scripts
- **Workflow**: 2 helper aliases

**Total: 60 scripts** (expanded from 45)

## Script Communication

Scripts can call other scripts when needed:

```javascript
// scripts/quality-fix-all.js
export async function run(args) {
  const results = [];
  
  // Run multiple quality scripts
  const lint = await import('./quality-lint.js');
  results.push(await lint.run(args));
  
  const versions = await import('./quality-fix-versions.js');
  results.push(await versions.run(args));
  
  const console = await import('./quality-console-clean.js');
  results.push(await console.run(args));
  
  return {
    message: 'All quality fixes completed',
    results
  };
}
```javascript

## Benefits

1. **Simplicity** - No complex hierarchies
2. **Performance** - Lazy loading, minimal overhead
3. **Maintainability** - Each script is self-contained
4. **Testability** - Easy to test individual scripts
5. **Flexibility** - Scripts can be complex or simple as needed

## Migration from Lead-Manager-Worker

### Before:
```javascript
apex-lead.js → ci-manager.js → monitor-worker.js
             → ci-manager.js → fix-worker.js
```javascript

### After:
```javascript
apex-router.js → ci-monitor.js
               → ci-fix.js
```javascript

All the orchestration logic moves to:
- **Router** for smart routing
- **Recipes** for workflows
- **Scripts** call each other when needed