# test-setup.js

## File Information

- **Path**: `./scripts/test-setup.js`
- **Language**: javascript
- **Lines**: 1027
- **Size**: 24.6KB
- **Type**: Script
- **Last Modified**: 2025-07-04T19:45:39.836Z

## Overview

test-setup.js - Setup test environment and configuration

## Dependencies

- `../modules/file-ops.js`
- `fs`
- `child_process`
- `path`
- `vitest/config`
- `@playwright/test`
- `vitest`
- `ava`
- `ava`
- `@playwright/test`

## Exports

- `async` (value)
- `default` (value)
- `default` (value)

## Functions

### run

**Signature:**
```javascript
export async function run(args = {})
```

**Parameters:**
- `args = {}`

### detectExistingSetup

**Signature:**
```javascript
async function detectExistingSetup()
```

### installTestFramework

**Signature:**
```javascript
async function installTestFramework(framework, options)
```

**Parameters:**
- `framework`
- `options`

### generateConfigs

**Signature:**
```javascript
async function generateConfigs(framework, options)
```

**Parameters:**
- `framework`
- `options`

### generateJestConfig

**Signature:**
```javascript
function generateJestConfig(options)
```

**Parameters:**
- `options`

### generateJestCIConfig

**Signature:**
```javascript
function generateJestCIConfig(options)
```

**Parameters:**
- `options`

### generateMochaConfig

**Signature:**
```javascript
function generateMochaConfig(options)
```

**Parameters:**
- `options`

### generateVitestConfig

**Signature:**
```javascript
function generateVitestConfig(options)
```

**Parameters:**
- `options`

### generateAvaConfig

**Signature:**
```javascript
function generateAvaConfig(options)
```

**Parameters:**
- `options`

### generateC8Config

**Signature:**
```javascript
function generateC8Config()
```

### generatePlaywrightConfig

**Signature:**
```javascript
function generatePlaywrightConfig()
```

### createTestDirectories

**Signature:**
```javascript
async function createTestDirectories(framework, options)
```

**Parameters:**
- `framework`
- `options`

### updatePackageScripts

**Signature:**
```javascript
async function updatePackageScripts(framework, options)
```

**Parameters:**
- `framework`
- `options`

### getTestCommand

**Signature:**
```javascript
function getTestCommand(framework)
```

**Parameters:**
- `framework`

### getUnitPattern

**Signature:**
```javascript
function getUnitPattern(framework)
```

**Parameters:**
- `framework`

### getIntegrationPattern

**Signature:**
```javascript
function getIntegrationPattern(framework)
```

**Parameters:**
- `framework`

### getCoverageCommand

**Signature:**
```javascript
function getCoverageCommand(framework)
```

**Parameters:**
- `framework`

### getWatchCommand

**Signature:**
```javascript
function getWatchCommand(framework)
```

**Parameters:**
- `framework`

### getCICommand

**Signature:**
```javascript
function getCICommand(framework)
```

**Parameters:**
- `framework`

### createSampleTests

**Signature:**
```javascript
async function createSampleTests(framework, options)
```

**Parameters:**
- `framework`
- `options`

### generateSetupFile

**Signature:**
```javascript
function generateSetupFile(framework)
```

**Parameters:**
- `framework`

### generateSampleUnitTest

**Signature:**
```javascript
function generateSampleUnitTest(framework)
```

**Parameters:**
- `framework`

### generateSampleIntegrationTest

**Signature:**
```javascript
function generateSampleIntegrationTest(framework)
```

**Parameters:**
- `framework`

### generateSampleE2ETest

**Signature:**
```javascript
function generateSampleE2ETest()
```

### setupCIConfig

**Signature:**
```javascript
async function setupCIConfig(framework)
```

**Parameters:**
- `framework`

## Script Details

- **Command**: `apex test-setup`
- **Accepts Arguments**: Yes
- **Supports Dry Run**: Yes

## Usage

```javascript
// Run this script via the apex command
apex test-setup

// With arguments
apex test-setup --arg value
```

## Related Documentation

- [Apex Hive Commands Reference](../../architecture/reference/commands/)
- [Script Development Guide](../../development/scripts/)

## See Also

- [Source Code](./scripts/test-setup.js)
