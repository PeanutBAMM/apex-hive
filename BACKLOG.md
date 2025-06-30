# Apex Hive Backlog

## 🔥 High Priority

### Documentation System Improvements
- [ ] **doc:fix-all command** - One command to fix ALL documentation issues
  - Fix heading hierarchy automatically
  - Add missing language specs to code blocks
  - Generate missing sections with templates
  - Fix all broken links after organize
  - Smart validation with auto-fix

- [ ] **Enhanced doc:organize** - Update links when moving files
  - Track all file moves
  - Update relative links in moved files
  - Update links pointing TO moved files
  - Generate redirect map for external links

- [ ] **Smart link fixer** - Detect and fix all link types
  - Template variables (${d.path})
  - Broken relative paths after organize
  - Missing file extensions
  - Anchor links validation

- [ ] **Missing sections generator** - Auto-generate required sections
  - Installation template
  - Usage examples from code
  - Features list from package.json
  - Smart content suggestions

## 📝 Medium Priority

### Quality of Life Improvements
- [ ] **Batch operations** - Run multiple fixes in correct order
- [ ] **Undo system** - Rollback doc changes if needed
- [ ] **Preview mode** - Show all changes before applying
- [ ] **Doc templates** - Customizable section templates

## 💡 Low Priority

### Nice to Have
- [ ] **Doc metrics** - Track documentation quality over time
- [ ] **Auto-commit** - Commit doc fixes with semantic messages
- [ ] **CI integration** - Fail builds on doc issues

## 🔧 System Improvements

### Backlog System Enhancement
- [ ] **Smart markdown parser** - Parse any markdown format for backlog items
  - Detect TODO items in various formats (- [ ], TODO:, etc.)
  - Extract priority from headers (High/Medium/Low)
  - Auto-assign default scores if missing
  - Support nested lists and categories

- [ ] **Metadata enrichment** - Add scoring metadata to items
  - Interactive mode to assign value/effort
  - AI-powered estimation based on description
  - Template for proper backlog format
  - Migration tool for existing backlogs

- [ ] **Unified backlog format** - Standardize backlog structure
  - YAML frontmatter for metadata
  - Consistent item structure
  - Support for multiple backlog files
  - Auto-sync between formats

---

*Last updated: 2024-06-30*