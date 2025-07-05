# doc-organize.js - Documentation Organization System

<module>doc-organize</module>
<description>The doc-organize script is a sophisticated documentation management system that automatically categorizes and organizes markdown files based on their content, headers, and naming patterns. It uses deterministic rules to ensure consistent placement of documentation across the project.</description>

**File**: `scripts/doc-organize.js`  
**Command**: `apex doc:organize`  
**Purpose**: Automatically organizes documentation files into a well-structured hierarchy

## Overview

The doc-organize script is a sophisticated documentation management system that automatically categorizes and organizes markdown files based on their content, headers, and naming patterns. It uses deterministic rules to ensure consistent placement of documentation across the project.

## Architecture

### Flow Diagram

```
┌─────────────────┐
│ Find all .md    │
│ files in docs/  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Read content &  │
│ extract headers │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply 40+ rules │
│ to categorize   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Plan file moves │
│ (if needed)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute moves & │
│ create READMEs  │
└─────────────────┘
```

## Documentation Structure

The system organizes documents into 7 main categories with 30+ subfolders:

### 1. **getting-started/** 
*Installation and setup guides*
- Direct placement for setup, installation, and quickstart guides
- No subfolders

### 2. **architecture/**
*System architecture and design*
- **design/** - Architecture documents, MCP integration
- **features/** - System features (cache, backlog, RAG, memory)
- **components/** - Module and utility documentation
- **patterns/** - Design patterns and conventions
- **reference/** - Reference documentation
  - **api/** - API documentation (api-*.md files)
  - **commands/** - Command reference, recipes
  - **configuration/** - Config documentation

### 3. **scripts/**
*Script documentation*
- **ci-scripts/** - CI/CD related scripts
- **documentation-scripts/** - Doc generation, validation, organization
- **quality-scripts/** - Linting, testing, formatting
- **git-scripts/** - Git operations and workflows
- **cache-scripts/** - Cache management
- **backlog-scripts/** - Backlog operations
- **deployment-scripts/** - Deploy, release, versioning
- **core-scripts/** - Init, search, save operations
- **detection-scripts/** - Issue detection and reporting
- **context-scripts/** - Startup context and analysis

### 4. **development/**
*Development guides*
- **testing/** - Test documentation
- **contributing/** - Contribution guidelines
- **best-practices/** - Coding standards
- **deployment/** - Deployment guides
- **monitoring/** - Monitoring and metrics

### 5. **troubleshooting/**
*Troubleshooting and debugging*
- **known-issues/** - Documented issues
- **debugging/** - Debug guides
- **solutions/** - Problem solutions

### 6. **changes/**
*Change logs and updates*
- Version history and change documentation

### 7. **misc/**
*Other documentation*
- **test-results/** - Test reports and validation results

## Categorization Rules

The script uses a priority-based rule system. Rules are evaluated in order, and the first matching rule determines the document's location.

### Priority 1: Explicit API Files
```javascript
if (name.startsWith('api-')) {
  return ['architecture', 'reference', 'api'];
}
```

### Priority 2: Source File References
Documents that reference source files via `**File**: \`path/to/file.js\`` are categorized based on the source location:
- `scripts/*.js` → Appropriate script subfolder
- `modules/*.js` → architecture/components
- `config/*.js` → architecture/reference/configuration
- Root `.js` files → getting-started (if install/setup) or architecture/reference/configuration

### Priority 3: Content-Based Rules

#### Changes Documentation
- Files with "changes-" in name → **changes/**

#### System Features
Documents with "System" in title AND implementation details:
- Cache system → **architecture/features/**
- Backlog system → **architecture/features/**
- RAG system → **architecture/features/**
- Memory system → **architecture/features/**

#### Architecture & Design
- Title contains "Architecture" → **architecture/design/**
- MCP-related content → **architecture/design/**

#### Components
- Title contains "Module", "Component", or "Utility" → **architecture/components/**

#### Scripts
- Name/title contains "Script" or has Usage/Command sections → **scripts/{type}/**
- Script type is determined by prefix mapping (ci-, doc-, quality-, etc.)

#### Workflows
- Recipes and workflows → **architecture/reference/commands/**

#### Development
- Testing documentation → **development/testing/**
- Contributing guides → **development/contributing/**
- Best practices → **development/best-practices/**
- Deployment guides → **development/deployment/**
- Monitoring → **development/monitoring/**

#### Troubleshooting
- Contains "Troubleshoot", "Debug", or "Error" → **troubleshooting/**

#### Test Results
- Files with test-results, reports, validation → **misc/test-results/**

### Priority 4: Default
- Anything else → **misc/**

## Script Type Detection

For script documentation, the system maps prefixes to categories:

```javascript
const scriptMap = {
  'ci': 'ci-scripts',
  'doc': 'documentation-scripts',
  'quality': 'quality-scripts',
  'git': 'git-scripts',
  'cache': 'cache-scripts',
  'backlog': 'backlog-scripts',
  'deploy': 'deployment-scripts',
  'detect': 'detection-scripts',
  'startup': 'context-scripts',
  // ... 40+ mappings total
};
```

## Usage Examples

### Basic Usage
```bash
# Organize documentation (dry-run by default)
apex doc:organize --dry-run

# Actually organize files
apex doc:organize

# Organize without creating index files
apex doc:organize --no-index
```

### Common Scenarios

1. **New API documentation**
   - Name it `api-endpoints.md`
   - Will go to `architecture/reference/api/`

2. **Script documentation**
   - Include `**File**: \`scripts/my-script.js\``
   - Will go to appropriate script subfolder

3. **System feature documentation**
   - Title: "Cache System Implementation"
   - Will go to `architecture/features/`

4. **Troubleshooting guide**
   - Include "Debugging" or "Error" in title
   - Will go to `troubleshooting/`

## README Generation

The system automatically creates:

1. **Main README** (`docs/README.md`)
   - Overview of all categories
   - Document counts
   - Navigation links

2. **Category READMEs** (e.g., `docs/scripts/README.md`)
   - File tree showing all documents
   - Direct document links
   - Statistics (total docs, subfolders)
   - Navigation links

**Note**: Only main category folders get READMEs. Subfolders are shown in the tree view of their parent category.

## Troubleshooting

### Document Goes to Wrong Location

1. **Check the title** - First H1 header is primary signal
2. **Check for source file reference** - `**File**:` tag overrides many rules  
3. **Review content headers** - H2/H3 headers influence categorization
4. **Check filename** - Prefixes like `api-`, `test-results-` have special meaning

### Debugging Categorization

Add debug output to see why a document was categorized:
```javascript
console.error(`[DEBUG] ${doc.name} → ${targetPath.join('/')}`);
```

### Force Specific Location

To ensure a document goes to a specific location:
1. Use explicit prefixes (api-, changes-)
2. Include source file reference
3. Use clear titles matching the category

### Common Issues

**Issue**: Script docs not going to right subfolder  
**Solution**: Ensure script name prefix matches mapping (ci-, doc-, quality-, etc.)

**Issue**: Architecture docs scattered  
**Solution**: Use "Architecture" in title for design docs, "System" for features

**Issue**: Test results in wrong location  
**Solution**: Include "test-results" or "report" in filename

## Edge Cases

1. **README.md files** - Ignored (never moved)
2. **Empty directories** - Automatically cleaned up after moves
3. **Duplicate names** - Later file overwrites earlier in same target location
4. **No title** - Falls back to filename for categorization
5. **Multiple matching rules** - First rule wins (priority order)

## Best Practices

1. **Use descriptive titles** - First H1 is the primary categorization signal
2. **Include source references** - `**File**: \`path/to/source.js\`` for accuracy
3. **Follow naming conventions** - api-*, test-results-*, changes-*
4. **Run dry-run first** - Always preview changes before executing
5. **Check the file tree** - Category READMEs show complete structure

## Integration

The doc-organize script integrates with:
- `doc:cleanup` - Runs organize after cleanup
- `doc:sync` - Can trigger organization 
- Git hooks - Can auto-organize on commit
- CI/CD - Ensures documentation stays organized

---

*This documentation will be automatically organized to `docs/scripts/documentation-scripts/` by the very script it documents!* 🤯