# Documentation Scripts Improvements

<module>doc-scripts-improvements</module>
<description>Overview of improvements made to the documentation scripts system for better integration, quality control, and workflow automation in the Apex Hive system</description>
<category>Documentation</category>

## Overview

This document describes the improvements made to the documentation scripts to create a more intelligent and integrated documentation workflow.

## Improvements Made

### 1. Enhanced doc:generate-changed

**File**: `scripts/doc-generate-changed.js`

#### New Features:
- **Existing Documentation Detection**: Now checks if documentation already exists before generating new docs
- **Update Integration**: Can update existing documentation instead of creating duplicates
- **Smart Location Detection**: Searches multiple locations including script-specific subdirectories

#### New Options:
```javascript
{
  updateExisting: false, // Set to true to update existing docs
  // ... other options
}
```

#### How It Works:
1. For each changed file, it calls `findExistingDoc()` to check for existing documentation
2. If documentation exists and `updateExisting` is true, it calls doc:update
3. If documentation exists and `updateExisting` is false, it skips the file
4. Only generates new documentation for files without existing docs

### 2. Extended doc:update

**File**: `scripts/doc-update.js`

#### New Features:
- **Script Documentation Updates**: Can now update script documentation with new functions/methods
- **Source File Analysis**: Extracts functions, classes, and JSDoc from source files
- **Intelligent Section Updates**: Updates specific sections while preserving manual content

#### New Functionality:
```javascript
// Update specific documentation with source file changes
await updateScriptDoc(docContent, sourceFile, modules);
```

#### Updates Performed:
- Line count updates
- Last modified date
- Function signatures and parameters
- Class methods
- JSDoc extraction

### 3. Enhanced doc:validate-and-fix-xml

**File**: `scripts/doc-validate-and-fix-xml.js`

#### New Quality Rules:
1. **Description Quality**:
   - Must be at least 20 characters
   - Must contain at least 10 words
   - No placeholder text like "No description"
   - No raw parameter lists like "- `args`: No description"

2. **Module Name Quality**:
   - Must be at least 3 characters
   - Cannot be placeholder like "module-name"
   - Extracted from file path if possible

3. **Category Tags**:
   - Automatically adds category tag for scripts
   - Maps script prefixes to categories (ci → CI/CD, doc → Documentation, etc.)

#### Better Content Extraction:
- Extracts descriptions from Overview sections
- Falls back to first meaningful paragraph
- Generates meaningful descriptions if none found
- Fixes both **File**: and **Path**: markers

### 4. Improved Workflow Integration

#### Recipe: update-all-docs
```json
"update-all-docs": [
  "doc:generate-changed",    // Check for changes & skip existing
  "doc:update",             // Update existing docs (when integrated)
  "doc:validate-and-fix-xml", // Fix XML quality
  "doc:fix-links",          // Fix broken links
  "doc:organize"            // Place in correct folders
]
```

## Script Cooperation

### Direct Script Calls
While technically possible, scripts should generally NOT call each other directly:
```javascript
// Not recommended
if (modules["doc:update"]) {
  await modules["doc:update"].run(args);
}
```

### Recipe-Based Workflow (Recommended)
Scripts work together through recipes which provide:
- Sequential execution
- Shared cache context via `_recipeCache`
- Automatic error handling
- Progress tracking

## Usage Examples

### Generate Documentation for Changed Files
```bash
# Generate new docs only (default)
apex doc:generate-changed

# Update existing docs if found
apex doc:generate-changed --update-existing

# Dry run to see what would happen
apex doc:generate-changed --dry-run --update-existing
```

### Update All Documentation
```bash
# Run the complete workflow
apex update-all-docs

# Dry run first
apex update-all-docs --dry-run
```

### Validate and Fix XML
```bash
# Validate and auto-fix XML tags
apex doc:validate-and-fix-xml

# Dry run to see issues
apex doc:validate-and-fix-xml --dry-run
```

## Benefits

1. **No More Duplicates**: doc:generate-changed now detects existing docs
2. **Better Quality**: Stricter XML validation ensures meaningful documentation
3. **Intelligent Updates**: Can update existing docs with new code changes
4. **Automated Workflow**: Complete documentation pipeline in one recipe

## Future Improvements

1. **Better doc:update Integration**: Currently doc:update needs to be called directly from doc:generate-changed
2. **Smarter Description Generation**: Use AI to generate better descriptions from code context
3. **Incremental Updates**: Only update changed sections of documentation
4. **Cross-Reference Detection**: Detect and update cross-references between documents

---

*Generated: 2025-07-04*