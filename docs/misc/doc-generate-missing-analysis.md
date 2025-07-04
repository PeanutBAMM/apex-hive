# doc:generate-missing Analysis

<module>doc-generate-missing-analysis</module>
<description>Analysis of the improvements made to doc:generate-missing script for complete project documentation coverage</description>
<category>Documentation</category>

## Overview

The `doc:generate-missing` script has been updated to provide complete documentation coverage for the entire Apex Hive project, not just scripts. However, there are still some issues to resolve.

## What Was Changed

### 1. Multiple Source Directories
- Changed from single `source` to `sources` array
- Default scans entire project (`["."]`)
- Can specify multiple directories to scan

### 2. Intelligent Documentation Location Mapping
Added smart location detection based on file type:

- **Scripts** (`scripts/*.js`) → `docs/scripts/{category}/{name}.md`
- **Modules** (`modules/*.js`) → `docs/architecture/reference/api/api-{name}.md`
- **Config** (`config/*.js`) → `docs/architecture/reference/configuration/{name}.md`
- **Root files** → `docs/architecture/components/{name}.md`

### 3. Better File Filtering
- Excludes test files (`*.test.js`, `*.spec.js`)
- Excludes debug/temp files (`*-debug.js`, `*-fixed.js`)
- Excludes build artifacts and common directories

### 4. Lower Threshold
- Reduced from 100 to 10 lines
- Catches more utility files and configs

## Current Issues

### 1. Detection Problem
The script currently reports that ALL files are missing documentation, even though we know many have docs. This suggests the `findExistingDocForFile` function isn't working correctly.

Possible causes:
- File path format mismatch (`./ prefix` vs no prefix)
- Case sensitivity issues
- The function checks if content includes the filename, but docs might use different naming

### 2. Still Using Old Path Generation
When generating new docs, it still uses the old `getDocPath` which puts everything in `docs/api/`. The intelligent mapping is only used for detection, not generation.

### 3. MCP Parameter Issues
The MCP interface doesn't properly pass the `sources` parameter, requiring fallback to legacy `source` parameter.

## How It Should Work

1. **Scan all JavaScript files** in the project
2. **Check each file** against multiple possible documentation locations
3. **Skip files** that already have documentation
4. **Generate docs** only for truly missing files
5. **Place new docs** in the correct location based on file type

## Next Steps

To fix the remaining issues:

1. Debug why `findExistingDocForFile` isn't finding existing docs
2. Update doc generation to use intelligent paths
3. Add better logging to understand what's happening
4. Test with specific files we know have documentation

## Usage

```bash
# Scan entire project
apex doc:generate-missing --dry-run

# Scan specific directories
apex doc:generate-missing --source . --dry-run

# Lower threshold for small files
apex doc:generate-missing --threshold 5 --dry-run

# Generate actual documentation
apex doc:generate-missing
```

## Expected Behavior

For a project with:
- 65 scripts (most have docs in `docs/scripts/`)
- 8 modules (all have docs in `docs/architecture/reference/api/`)
- 4 config files (some have docs)
- 15+ root files (few have docs)

The script should find ~20-30 files needing documentation, not 90.

---

*Generated: 2025-07-04*