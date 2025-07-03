# Recipes Guide

Recipes are pre-configured workflows that combine multiple commands into powerful automation sequences. Think of them as "macros" for common development tasks.

## 🎯 What Are Recipes?

Recipes are:
- **Sequential workflows** - Commands run in order
- **Atomic operations** - All succeed or fail together
- **Time savers** - One command instead of many
- **Best practices** - Proven command combinations

## 📚 Available Recipes

### Development Workflows

#### `start-day`
Begin your work day with all necessary updates and checks.
```bash
apex start-day
```javascript
**Steps:**
1. `cache:clear` - Clear all caches for fresh start
2. `cache:warm-all` - Warm cache with latest data
3. `git:pull` - Get latest changes
4. `test` - Run test suite
5. `backlog:display` - Show current tasks
6. `ci:status` - Check CI health

#### `end-day`
Wrap up your work day properly.
```bash
apex end-day
```javascript
**Steps:**
1. `doc:organize` - Organize documentation
2. `git:status` - Check uncommitted changes
3. `save-conversation` - Save AI conversation logs

#### `commit-and-push`
Complete commit workflow with CI monitoring.
```bash
apex commit-and-push
```javascript
**Steps:**
1. `git:commit` - Create smart commit
2. `ci:smart-push` - Push with CI awareness
3. `ci:monitor` - Watch CI status

### Fix Workflows

#### `fix-all`
Fix all common issues in one go.
```bash
apex fix-all
```javascript
**Steps:**
1. `quality:fix-all` - Fix code quality issues
2. `doc:generate` - Generate missing docs
3. `test:run` - Run tests to verify

#### `ci-fix-all`
Complete CI repair workflow.
```bash
apex ci-fix-all
```javascript
**Steps:**
1. `ci:parse` - Parse CI logs
2. `ci:fix` - Apply fixes
3. `ci:heal` - Self-healing adjustments
4. `ci:monitor` - Verify success

### Documentation Workflows

#### `doc-complete`
Complete documentation generation and validation.
```bash
apex doc-complete
```javascript
**Steps:**
1. `doc:generate-missing` - Create missing docs
2. `doc:validate` - Validate all docs
3. `doc:update-readme` - Update README

#### `doc-fix-all`
Fix all documentation issues.
```bash
apex doc-fix-all
```javascript
**Steps:**
1. `doc:fix-links` - Repair broken links
2. `doc:add-xml` - Add XML tags
3. `doc:organize` - Organize structure

### Quality Workflows

#### `clean-code`
Clean and format entire codebase.
```bash
apex clean-code
```javascript
**Steps:**
1. `quality:lint` - Run linter
2. `quality:console-clean` - Remove console.logs
3. `quality:format` - Format code

#### `quality-check-all`
Run all quality checks.
```bash
apex quality-check-all
```javascript
**Steps:**
1. `quality:lint` - Lint code
2. `quality:validate` - Validate metrics
3. `test:run` - Run test suite

### Release Workflows

#### `deploy-safe`
Safe deployment with all checks.
```bash
apex deploy-safe
```javascript
**Steps:**
1. `test:run` - Run all tests
2. `version:bump` - Update version
3. `deploy` - Deploy application
4. `ci:monitor` - Monitor deployment

#### `release-patch`
Release a patch version.
```bash
apex release-patch
```javascript
**Steps:**
1. `version:bump:patch` - Bump patch version
2. `changelog:generate` - Update CHANGELOG
3. `git:tag` - Create git tag
4. `git:push-tags` - Push tags

#### `release-minor`
Release a minor version.
```bash
apex release-minor
```javascript
**Steps:**
1. `version:bump:minor` - Bump minor version
2. `changelog:generate` - Update CHANGELOG
3. `git:tag` - Create git tag
4. `git:push-tags` - Push tags

### Special Workflows

#### `pre-commit`
Run before committing changes.
```bash
apex pre-commit
```javascript
**Steps:**
1. `doc:check` - Check documentation
2. `doc:generate-missing` - Generate missing docs
3. `quality:fix-all` - Fix quality issues
4. `test` - Run tests
5. `doc:validate` - Validate docs

#### `post-merge`
Run after merging branches.
```bash
apex post-merge
```javascript
**Steps:**
1. `doc:post-merge` - Update docs
2. `doc:organize` - Organize files
3. `doc:update-readme` - Update README
4. `cache:warm-readmes` - Warm cache

## 🔧 Using Recipes

### Basic Usage
```bash
apex <recipe-name>
```javascript

### With Options
```bash
apex <recipe-name> --dry-run
apex <recipe-name> --verbose
```javascript

### Natural Language
```bash
apex "start my day"
apex "commit and push everything"
apex "fix all the things"
```javascript

## 📝 Recipe Configuration

Recipes are defined in `config/recipes.json`:

```json
{
  "recipe-name": {
    "description": "What this recipe does",
    "steps": ["command1", "command2", "command3"]
  }
}
```javascript

## 🎨 Creating Custom Recipes

### 1. Edit recipes.json
```json
{
  "my-workflow": {
    "description": "My custom workflow",
    "steps": [
      "git:pull",
      "quality:fix-all",
      "test",
      "git:commit",
      "git:push"
    ]
  }
}
```javascript

### 2. Use your recipe
```bash
apex my-workflow
```javascript

## 💡 Recipe Best Practices

1. **Keep recipes focused** - Each recipe should have one clear purpose
2. **Order matters** - Commands run sequentially
3. **Test first** - Include tests in critical workflows
4. **Document recipes** - Add clear descriptions
5. **Use --dry-run** - Preview recipe actions

## 🚀 Power User Tips

### Chain Recipes
```bash
apex fix-all && apex commit-and-push
```javascript

### Conditional Execution
```bash
apex test && apex deploy-safe
```javascript

### Morning Routine
```bash
apex start-day && apex backlog:analyze
```javascript

### End of Sprint
```bash
apex doc-complete && apex release-minor
```javascript

## 📊 Recipe Success Tracking

Each recipe execution shows:
- ✅ Successful steps
- ❌ Failed steps
- ⏱️ Execution time
- 📊 Summary report

Example output:
```javascript
Recipe: fix-all
✅ All steps completed successfully

1. ✓ quality:fix-all
   → Fixed 12 issues
2. ✓ doc:generate
   → Generated 5 documents
3. ✓ test:run
   → All tests passed (42/42)
```javascript

---

*Recipes make complex workflows simple. Use them to automate your development process!*