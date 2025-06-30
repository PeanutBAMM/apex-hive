# Recipes and Workflows

## Core Concept
**Pre-defined workflows for common development tasks**

## Recipe Structure

Recipes are defined in `config/recipes.json` as arrays of commands executed in sequence.

```json
{
  "recipe-name": [
    "command-1",
    "command-2",
    "command-3"
  ]
}
```javascript

## Development Workflows

### commit-push
Full commit workflow with quality checks and documentation.

```json
"commit-push": [
  "quality:fix-all",        // Fix all quality issues
  "test",                   // Run tests (stops on fail)
  "doc:generate-changed",   // Generate docs for changes
  "doc:update-readme",      // Update README indexes
  "git:commit",            // Create commit
  "git:push",              // Push to remote
  "ci:monitor"             // Monitor CI status
]
```javascript

### pre-commit
Lightweight pre-commit checks.

```json
"pre-commit": [
  "doc:check",             // Check doc coverage
  "doc:generate-missing",  // Generate missing docs
  "quality:fix-all",       // Fix quality issues
  "test",                  // Run tests
  "doc:validate"          // Validate docs
]
```javascript

### develop
Standard development workflow.

```json
"develop": [
  "code",                  // Write code
  "test",                  // Test changes
  "doc:generate-changed",  // Document changes
  "commit"                // Commit work
]
```javascript

## CI/CD Workflows

### fix-ci
Automated CI fixing workflow.

```json
"fix-ci": [
  "ci:monitor",           // Check CI status
  "ci:parse",            // Parse error logs
  "ci:fix",              // Apply fixes
  "test:run"             // Verify fixes
]
```javascript

### ci-recovery
Full CI recovery workflow.

```json
"ci-recovery": [
  "ci:monitor",          // Assess damage
  "ci:parse",           // Identify issues
  "ci:heal",            // Self-healing
  "quality:fix-all",    // Fix code issues
  "test",               // Verify
  "git:commit",         // Commit fixes
  "git:push"           // Push fixes
]
```javascript

## Documentation Workflows

### doc-maintenance
Complete documentation maintenance.

```json
"doc-maintenance": [
  "doc:organize",         // Organize in folders
  "doc:update-readme",    // Update indexes
  "xml:validate",         // Check XML tags
  "xml:fix",             // Fix XML issues
  "doc:validate-links",   // Check links
  "doc:fix-links"        // Fix broken links
]
```javascript

### post-merge
Post-merge documentation updates.

```json
"post-merge": [
  "doc:post-merge",      // Analyze merged code
  "doc:organize",        // Organize new docs
  "doc:update-readme",   // Update indexes
  "cache:warm-readmes"   // Pre-load cache
]
```javascript

### doc-refresh
Full documentation refresh.

```json
"doc-refresh": [
  "doc:generate-missing",  // Find undocumented
  "doc:update",           // Update existing
  "doc:organize",         // Reorganize
  "doc:update-readme",    // Update indexes
  "doc:validate",         // Validate all
  "doc:fix-links"        // Fix issues
]
```javascript

## Quality Workflows

### clean-code
Complete code cleanup.

```json
"clean-code": [
  "quality:lint",          // Run linter
  "quality:console-clean", // Remove console.logs
  "quality:format",        // Format code
  "quality:fix-versions"   // Fix package versions
]
```javascript

### quality-check
Quality validation workflow.

```json
"quality-check": [
  "quality:validate",      // Validate code
  "test",                 // Run tests
  "doc:validate",         // Check docs
  "xml:validate"          // Check XML
]
```javascript

## Deployment Workflows

### deploy-production
Production deployment workflow.

```json
"deploy-production": [
  "git:pull",             // Get latest
  "quality:fix-all",      // Ensure quality
  "test",                 // Full test suite
  "build",                // Build packages
  "doc:generate",         // Update docs
  "deploy",               // Deploy
  "ci:monitor"           // Monitor deployment
]
```javascript

### release
Release preparation workflow.

```json
"release": [
  "version:bump",         // Bump version
  "changelog:generate",   // Update changelog
  "doc:update",          // Update docs
  "test",                // Final tests
  "build",               // Build release
  "git:tag",             // Tag release
  "git:push --tags"      // Push tags
]
```javascript

## Special Workflows

### fix
Smart fix workflow that detects what needs fixing.

```json
"fix": [
  "detect-issues",       // Analyze problems
  "fix-detected",        // Fix what's found
  "test",                // Verify fixes
  "report"               // Report results
]
```javascript

### init-project
New project initialization.

```json
"init-project": [
  "init",                // Initialize structure
  "doc:generate",        // Generate initial docs
  "git:init",           // Initialize git
  "quality:setup",       // Setup quality tools
  "test:setup"          // Setup testing
]
```javascript

## Conditional Execution

Recipes support conditional execution:

```javascript
// In router implementation
async runRecipe(name, context) {
  const steps = this.recipes[name];
  
  for (const step of steps) {
    const result = await this.execute(step, context);
    
    // Stop conditions
    if (step === 'test' && result.failed) {
      console.error('[RECIPE] Tests failed, stopping');
      break;
    }
    
    if (result.error && !result.recoverable) {
      console.error('[RECIPE] Unrecoverable error, stopping');
      break;
    }
  }
}
```javascript

## Natural Language Triggers

Recipes can be triggered by natural language:

```javascript
patterns: [
  {
    match: /commit.*push/i,
    recipe: "commit-push"
  },
  {
    match: /fix.*ci|ci.*broken/i,
    recipe: "fix-ci"
  },
  {
    match: /clean.*code|format/i,
    recipe: "clean-code"
  },
  {
    match: /update.*docs?|document/i,
    recipe: "doc-maintenance"
  }
]
```javascript

## Custom Recipes

Projects can define custom recipes in `.apex-hive-minds/recipes.json`:

```json
{
  "custom-workflow": [
    "custom:step1",
    "custom:step2",
    "test",
    "deploy:custom"
  ]
}
```javascript

## Recipe Composition

Recipes can include other recipes:

```json
{
  "full-maintenance": [
    "@clean-code",        // Include clean-code recipe
    "@doc-maintenance",   // Include doc-maintenance
    "test",              // Additional steps
    "report"
  ]
}
```javascript

## Benefits

1. **Consistency** - Same workflow every time
2. **Efficiency** - One command, multiple actions
3. **Safety** - Built-in checks and stops
4. **Flexibility** - Easy to customize
5. **Discovery** - Natural language support