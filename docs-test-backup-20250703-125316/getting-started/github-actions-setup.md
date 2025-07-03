# GitHub Actions Setup Guide

## Overview

This guide covers setting up GitHub Actions CI/CD for your Apex Hive project. Since this is a public repository, you get free GitHub Actions minutes without billing concerns.

## Public vs Private Repositories

### Public Repository Benefits
- **Free CI/CD**: Unlimited GitHub Actions minutes for public repos
- **No billing setup**: Works immediately without payment methods
- **Community contributions**: Others can contribute to your project
- **Showcase work**: Great for portfolios and demonstrations

### Private Repository Limitations
- Requires billing setup for GitHub Actions
- Limited free minutes per month
- May encounter "billing failed" errors without valid payment

## GitHub Actions Configuration

### Pre-configured Workflows

Apex Hive includes two workflow files:

1. **`.github/workflows/ci.yml`** - Main CI pipeline
2. **`.github/workflows/test.yml`** - Test runner

Both workflows are configured with:
- `timeout-minutes: 30` to prevent stuck runs
- Multiple Node.js versions (18.x, 20.x)
- Automatic triggering on push and PR

### Workflow Features

#### CI Workflow
```yaml
name: CI
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      matrix:
        node-version: [18.x, 20.x]
```

Runs on:
- Push to main/master
- Pull requests
- Manual trigger (workflow_dispatch)

#### Test Workflow
Specifically for running Jest tests with:
- Test result reporting
- Coverage collection
- Failure notifications

## Monitoring CI Status

### Using Apex Commands

```bash
# Check current CI status
apex ci:status

# Monitor CI in real-time
apex ci:monitor

# Parse CI logs for errors
apex ci:parse

# Auto-fix common CI issues
apex ci:fix
```

### Smart Push Workflow

```bash
# Recommended push flow
apex push

# Or use the recipe
apex commit-push
```

This will:
1. Push changes to GitHub
2. Monitor CI automatically
3. Report results when complete
4. Fetch logs if failures occur

## Common CI Issues and Fixes

### 1. ESLint Errors
```bash
apex quality:fix-all
apex quality:lint
```

### 2. Test Failures
```bash
apex test
apex test:setup
```

### 3. Console.log Statements
```bash
apex quality:console-clean
```

### 4. Documentation Issues
```bash
apex doc:validate
apex doc:fix-links
```

## Setting Up for Your Project

### 1. Ensure Public Repository

If your repo is private and you're getting billing errors:
1. Go to Settings → General
2. Scroll to "Danger Zone"
3. Click "Change repository visibility"
4. Select "Make public"

### 2. Verify Workflows Exist

```bash
ls -la .github/workflows/
```

Should show:
- `ci.yml`
- `test.yml`

### 3. Check Workflow Status

```bash
# List recent workflow runs
gh run list

# View specific run
gh run view

# Watch latest run
gh run watch
```

## Best Practices

### 1. Always Use Smart Push
```bash
apex push
# or
npm run push
```

This monitors CI and reports issues immediately.

### 2. Fix Issues Before Pushing
```bash
# Run local checks first
apex quality:fix-all
apex test
apex doc:validate
```

### 3. Handle CI Failures

When CI fails:
1. `apex ci:parse` - Identify issues
2. `apex ci:fix` - Auto-fix if possible
3. Fix manually if needed
4. Push fixes with `apex push`

### 4. Timeout Configuration

All workflows include `timeout-minutes: 30` to prevent:
- Stuck CI runs
- Wasted compute resources
- Blocking other workflows

## Integration with Apex Hive

### Automated Monitoring

The `apex push` command includes:
```javascript
// Automatic CI monitoring after push
execSync('npm run ci:watch', { stdio: 'inherit' });
```

### CI Commands

All CI commands in `scripts/ci-*.js`:
- `ci:monitor` - Real-time monitoring
- `ci:parse` - Log analysis
- `ci:fix` - Automated fixes
- `ci:heal` - Self-healing system
- `ci:status` - Current status
- `ci:watch` - Wait for completion

### Recipe Integration

The `commit-push` recipe includes:
1. Quality fixes
2. Tests
3. Documentation
4. Smart push with monitoring

## Troubleshooting

### "Billing Failed" Error

**Solution**: Make repository public
- This only occurs on private repos
- Public repos have unlimited free Actions

### Stuck CI Runs

**Solution**: 
```bash
# Cancel stuck run
gh run cancel <run-id>

# All workflows now have timeout-minutes: 30
```

### No CI Runs Triggering

**Check**:
1. Workflows exist in `.github/workflows/`
2. Branch names match (main/master)
3. Valid YAML syntax

### CI Not Finding Commands

**Ensure**:
1. `package.json` has all script entries
2. Dependencies are installed
3. Node version matches (18.x or 20.x)

## Advanced Configuration

### Adding New Workflows

Create `.github/workflows/new-workflow.yml`:
```yaml
name: New Workflow
on: [push, pull_request]
jobs:
  task:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run your-command
```

### Matrix Testing

Test across multiple configurations:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

### Caching Dependencies

Speed up CI with caching:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

---

*Last updated: 2025-07-01*