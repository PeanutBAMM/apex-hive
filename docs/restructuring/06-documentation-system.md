# Documentation System Architecture

## Core Concept
**Automatic, Intelligent Documentation Generation & Management**

## Overview

The documentation system is a first-class citizen in Apex Hive Minds, providing:
- Automatic generation on commits
- Smart updates for existing docs  
- XML-compliant formatting
- README hot-load caching
- Cross-reference management

## Documentation Scripts

### Generation Scripts
- `doc:generate` - Generate docs for new files
- `doc:generate-changed` - Generate for staged changes
- `doc:generate-missing` - Find and document undocumented files
- `doc:update` - Update existing documentation
- `doc:update-readme` - Update folder README indexes

### Validation Scripts
- `doc:validate` - General validation
- `doc:validate-xml` - Check XML tag compliance
- `doc:validate-links` - Check for broken links
- `doc:check` - Pre-commit documentation check

### Fix Scripts
- `doc:fix-links` - Fix broken links
- `doc:organize` - Move docs to correct folders
- `doc:sync` - Sync documentation state

### Utility Scripts
- `doc:add-xml` - Add XML tags to existing docs
- `doc:search` - Search documentation
- `doc:post-merge` - Post-merge doc updates

## XML Formatting Rules

### Required Structure
```markdown
# Document Title

<overview>
Brief overview of the component or feature.
</overview>

<purpose>
Why this exists and what problem it solves.
</purpose>

<usage>
How to use this component with examples.
</usage>

<api>
API reference and method signatures.
</api>

<examples>
Practical usage examples.
</examples>

<troubleshooting>
Common issues and solutions.
</troubleshooting>

<related>
Links to related documentation.
</related>
```

### XML Rules
1. **No duplicate headers** - XML tag replaces ## header
2. **All tags must close** - `<tag>content</tag>`
3. **H2 sections only** - XML tags for H2 level
4. **Required tags** - overview, purpose, usage minimum

## Automatic Generation

### Pre-Commit Hook
```javascript
// Runs automatically before every commit
async function preCommitDocs() {
  const staged = await git.getStagedFiles();
  
  // 1. Check for new files without docs
  const undocumented = await findUndocumentedFiles(staged);
  
  // 2. Generate documentation
  for (const file of undocumented) {
    const doc = await generateDocumentation(file);
    const docPath = getDocPath(file);
    await fileOps.write(docPath, doc);
    await git.add(docPath);
  }
  
  // 3. Update existing docs
  await updateExistingDocs(staged);
  
  // 4. Update README indexes
  await updateReadmeIndexes(staged);
  
  // 5. Validate everything
  await validateDocs();
}
```

### Generation Logic
```javascript
async function generateDocumentation(file) {
  const analysis = await analyzeCode(file);
  
  return `# ${analysis.name}

<overview>
${generateOverview(analysis)}
</overview>

<purpose>
${generatePurpose(analysis)}
</purpose>

<usage>
\`\`\`javascript
${generateUsageExamples(analysis)}
\`\`\`
</usage>

<api>
${generateAPIReference(analysis)}
</api>

<examples>
${generatePracticalExamples(analysis)}
</examples>

<troubleshooting>
${generateCommonIssues(analysis)}
</troubleshooting>

<related>
${findRelatedDocs(analysis).map(d => `- [${d.title}](${d.path})`).join('\n')}
</related>`;
}
```

## README Hot-Load Caching

### Cache Implementation
```javascript
class DocumentationCache {
  constructor() {
    // README files are special - always in memory
    this.readmeCache = new Map();
    this.lastUpdate = new Map();
  }
  
  async initialize() {
    // Load all README files at startup
    console.error('[DOC-CACHE] Loading README files...');
    
    const readmes = await findFiles('**/README.md');
    
    for (const readme of readmes) {
      await this.loadReadme(readme);
    }
    
    console.error(`[DOC-CACHE] Loaded ${readmes.length} README files`);
    
    // Watch for changes
    this.watchReadmes();
  }
  
  async loadReadme(path) {
    const content = await fs.readFile(path, 'utf8');
    const parsed = this.parseReadme(content);
    
    this.readmeCache.set(path, {
      content,
      parsed,
      folder: path.dirname(path),
      files: parsed.files,
      keywords: parsed.keywords,
      lastUpdate: Date.now()
    });
  }
  
  parseReadme(content) {
    // Extract structured data from README
    const files = [];
    const keywords = [];
    
    // Parse <files> section
    const filesMatch = content.match(/<files>([\s\S]*?)<\/files>/);
    if (filesMatch) {
      const lines = filesMatch[1].trim().split('\n');
      for (const line of lines) {
        const match = line.match(/- \*\*(.+?)\*\* - (.+)/);
        if (match) {
          files.push({
            name: match[1],
            description: match[2]
          });
        }
      }
    }
    
    // Parse <keywords> section
    const keywordsMatch = content.match(/<keywords>([\s\S]*?)<\/keywords>/);
    if (keywordsMatch) {
      keywords.push(...keywordsMatch[1].split(',').map(k => k.trim()));
    }
    
    return { files, keywords };
  }
  
  // Use cache for smart navigation
  findFileByDescription(query) {
    const results = [];
    
    for (const [path, data] of this.readmeCache) {
      for (const file of data.files) {
        if (file.description.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file: file.name,
            folder: data.folder,
            description: file.description,
            readme: path
          });
        }
      }
    }
    
    return results;
  }
}
```

### Performance Benefits
1. **Instant folder context** - No file system reads
2. **Smart search routing** - Know which folders to search
3. **Quick navigation** - Find files by description
4. **Always fresh** - File watcher updates cache

## Update Triggers

### Automatic Triggers
```javascript
const docTriggers = {
  // File changes
  'file:added': ['doc:generate', 'doc:update-readme'],
  'file:modified': ['doc:update'],
  'file:deleted': ['doc:update-readme'],
  'file:moved': ['doc:fix-links', 'doc:update-readme'],
  
  // Git events
  'pre-commit': ['doc:generate-changed', 'doc:validate'],
  'post-merge': ['doc:post-merge', 'doc:organize'],
  
  // CI events
  'ci:error': ['doc:troubleshooting-add'],
  'ci:fixed': ['doc:troubleshooting-update']
};
```

### Manual Triggers
- `apex doc:generate` - Force generation
- `apex doc:update-all` - Update everything
- `apex doc:fix-all` - Fix all issues

## Integration Recipes

### Development Workflow
```json
{
  "develop": [
    "code",
    "test",
    "doc:generate-changed",
    "commit"
  ]
}
```

### Pre-Push Workflow
```json
{
  "pre-push": [
    "quality:fix-all",
    "test",
    "doc:generate-missing",
    "doc:update-readme",
    "doc:validate",
    "doc:fix-links",
    "git:push"
  ]
}
```

### Post-Merge Workflow
```json
{
  "post-merge": [
    "doc:post-merge",
    "doc:organize", 
    "doc:update-readme",
    "doc:generate-troubleshooting",
    "cache:warm-readmes"
  ]
}
```

### Documentation Maintenance
```json
{
  "doc-maintenance": [
    "doc:organize",
    "doc:update-readme",
    "xml:validate",
    "xml:fix",
    "doc:validate-links",
    "doc:fix-links"
  ]
}
```

## Troubleshooting Auto-Generation

### Error Detection
```javascript
async function detectAndDocumentErrors(ciLog) {
  const errors = parseCIErrors(ciLog);
  
  for (const error of errors) {
    // Check if already documented
    const existing = await rag.searchDocs(error.message, {
      paths: ['docs/troubleshooting']
    });
    
    if (existing.length === 0) {
      // Generate new troubleshooting doc
      const doc = await generateTroubleshootingDoc(error);
      const path = `docs/troubleshooting/${slugify(error.type)}.md`;
      await fileOps.write(path, doc);
    }
  }
}
```

### Troubleshooting Template
```markdown
# Troubleshooting: [Error Type]

<problem>
Description of the error and when it occurs.
</problem>

<symptoms>
- Error message: `[exact error]`
- Occurs when: [conditions]
- Affected files: [files]
</symptoms>

<solution>
Step by step solution to fix the issue.
</solution>

<prevention>
How to prevent this error in the future.
</prevention>

<related>
- [Related Error 1](./related-1.md)
- [Related Error 2](./related-2.md)
</related>
```

## Benefits

1. **Always Up-to-Date** - Docs generated with code
2. **Consistent Format** - XML structure enforced
3. **Fast Navigation** - README caching
4. **Self-Healing** - Auto-fix broken links
5. **Learning System** - Documents new errors
6. **Zero Manual Work** - Fully automated