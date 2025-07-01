# Backlog System

## Overview

The Apex Hive backlog system provides intelligent parsing and management of project backlog items from your `BACKLOG.md` file. It automatically extracts tasks, estimates effort and value, and provides scoring algorithms to help prioritize work.

## Architecture

### Components

1. **Backlog Parser** (`modules/backlog-parser.js`)
   - Parses markdown structure from BACKLOG.md
   - Detects priority levels from headers
   - Extracts todo items with metadata
   - Estimates effort, value, and risk
   - Auto-generates tags from content

2. **Backlog Scripts**
   - `backlog:analyze` - Analyze items by category, priority, and status
   - `backlog:score` - Score items using value/effort ratios
   - `backlog:display` - Display items in various formats
   - `backlog:table` - Show items in table format
   - `backlog:sync` - Sync with external systems

## BACKLOG.md Format

The parser expects a markdown file with the following structure:

```markdown
# Project Backlog

## 🔥 High Priority

### Category Name
- [ ] **Task Title** - Description
  - Additional details
  - More context

## 📝 Medium Priority

### Another Category
- [ ] Task without bold title
- [x] Completed task (will be marked as completed)

## 💡 Low Priority

### Nice to Have
- [ ] Optional improvements
```

### Priority Detection

Priority is determined by header content:
- Headers containing "high" or "critical" → High priority
- Headers containing "medium" → Medium priority  
- Headers containing "low" → Low priority
- Default → Medium priority

### Category Detection

Categories are extracted from `###` level headers and converted to kebab-case.

## Parser Features

### Automatic Metadata Extraction

For each backlog item, the parser extracts:
- **Title**: From bold text or first part of line
- **Description**: From dash-separated text and indented lines
- **Status**: Based on checkbox state (`[ ]` = pending, `[x]` = completed)
- **Priority**: From section headers
- **Category**: From subsection headers

### Intelligent Estimation

The parser estimates:

1. **Effort** (1-10 scale)
   - Keywords like "system", "infrastructure", "refactor" → High effort (8)
   - Keywords like "implement", "create", "build" → Medium effort (5)
   - Keywords like "fix", "update", "add" → Low effort (3)

2. **Value** (1-10 scale)
   - Base value from priority level
   - Increased for keywords like "performance", "security", "critical"
   - Decreased for "nice to have", "cosmetic"

3. **Risk** (1-5 scale)
   - High for "breaking", "migration", "security" changes
   - Medium for "refactor", "update" tasks
   - Low for new additions

### Tag Generation

Tags are automatically generated based on content:
- `testing` - For test-related items
- `documentation` - For docs tasks
- `performance` - For optimization work
- `security` - For auth/security items
- `ui` - For frontend tasks
- `backend` - For server-side work
- `cache` - For caching features
- `ci-cd` - For pipeline tasks
- `bug` - For fixes
- `feature` - For new implementations

## Usage Examples

### Basic Display
```bash
apex backlog:display
```

Shows items in a formatted list with scores.

### Filtered Analysis
```bash
apex backlog:analyze --source todos
```

Analyzes backlog items with breakdowns by:
- Category
- Priority  
- Status
- Complexity
- Age (if dates available)

### Scoring and Prioritization
```bash
apex backlog:score --criteria value-effort
```

Scores items based on value/effort ratio to identify quick wins.

## Integration with Other Systems

The backlog system integrates with:

1. **Cache System**
   - Parsed items can be cached for performance
   - Warm cache with frequently accessed backlogs

2. **Natural Language**
   - "show backlog" → `apex backlog:display`
   - "analyze tasks" → `apex backlog:analyze`
   - "prioritize work" → `apex backlog:score`

3. **Recipes**
   - `start-day` recipe includes backlog display
   - Custom recipes can incorporate backlog commands

## Migration from Sample Data

Prior to the backlog parser implementation, the system used hardcoded sample data. The new system:

1. **Reads Real Data**: Parses actual BACKLOG.md file
2. **No Fallbacks**: Shows clear message if BACKLOG.md missing
3. **Backwards Compatible**: Same command interface
4. **Better Intelligence**: Smarter estimation algorithms

## Best Practices

1. **Consistent Format**
   - Use checkbox syntax for all tasks
   - Bold important task titles
   - Group by priority sections
   - Use descriptive categories

2. **Regular Updates**
   - Mark completed items with `[x]`
   - Add new items to appropriate sections
   - Update priorities as needed

3. **Effective Descriptions**
   - Include keywords for better estimation
   - Add context in sub-bullets
   - Mention dependencies or blockers

## Troubleshooting

### No Items Showing

1. Check BACKLOG.md exists in project root
2. Verify markdown format matches expected structure
3. Ensure checkbox syntax is correct (`- [ ]` not `- []`)

### Wrong Priorities

1. Check section headers include priority keywords
2. Verify `##` headers contain priority indicators
3. Default is medium if no priority detected

### Missing Categories

1. Use `###` headers for categories
2. Categories extracted from headers above items
3. Items without category headers get "general" category

---

*Last updated: 2025-07-01*