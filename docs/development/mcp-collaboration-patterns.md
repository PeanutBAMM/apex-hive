# MCP Collaboration Patterns with Claude Code

## Overview

This document outlines effective collaboration patterns between Apex Hive and Claude Code using Model Context Protocol (MCP) file operations. These patterns emerged from real development sessions and demonstrate best practices for AI-human collaboration in code optimization.

## MCP File Operations Integration

### Core Philosophy
**Principle:** Claude Code should use Apex Hive's cached file operations instead of native tools for maximum performance and consistency.

### Tool Hierarchy (Fastest to Slowest)
1. **MCP Cached File Operations** (`mcp__filesystem-cached__*`)
   - Uses Apex Hive's unified cache system
   - 70-80% faster for repeated operations
   - Persistent cache across sessions
   - Token-optimized with smart formatting

2. **Native Claude Tools** (Read, Write, Edit, Glob, Grep)
   - Direct filesystem access
   - No caching benefits
   - Higher token usage
   - Should be avoided when MCP alternative exists

3. **Agent Tool** (for complex searches only)
   - Parallel processing for complex analysis
   - High overhead (3-5 seconds)
   - Use sparingly and only when truly needed

### MCP Tool Mapping

| Native Tool | MCP Equivalent | Performance Gain |
|-------------|----------------|------------------|
| `Read` | `mcp__filesystem-cached__read_file` | 80%+ (cached reads) |
| `Write` | `mcp__filesystem-cached__write_file` | Consistent |
| `Edit` | `mcp__filesystem-cached__edit_file` | Advanced features |
| `Glob` | `mcp__filesystem-cached__search_files` | Cache-aware |
| `Grep` | `mcp__filesystem-cached__grep_files` | **65% token reduction** |
| `LS` | `mcp__filesystem-cached__list_directory` | Formatted output |

## Collaboration Patterns

### 1. Performance Optimization Pattern

**Scenario:** Optimizing search functionality for better performance

**Process:**
1. **Identify bottleneck** using performance analysis
2. **Debug systematically** with specialized tools
3. **Implement incrementally** with validation at each step
4. **Measure results** quantitatively

**Example:** Cache-first search optimization
```javascript
// Before: Separate cache and disk searches with overlaps
// After: Unified search with proper exclusion patterns
// Result: 65% token reduction, 84% disk I/O reduction
```

**Key Success Factors:**
- ✅ **Comprehensive debugging** - Multiple specialized debug scripts
- ✅ **Systematic testing** - Validate assumptions with direct tests
- ✅ **Quantitative measurement** - Before/after performance metrics
- ✅ **Iterative improvement** - Small changes, validated at each step

### 2. Problem Discovery Pattern

**Scenario:** Discovering that "fixes" were actually making things worse

**Process:**
1. **Question results** when they seem too good to be true
2. **Verify assumptions** with independent testing
3. **Honest analysis** even when it reveals mistakes
4. **Course correction** based on real data

**Example:** Post-processing "fix" that eliminated legitimate results
```javascript
// Claimed: 99% cache hit rate achieved
// Reality: Filtering out legitimate disk results
// Fix: Proper exclusion patterns instead of post-processing
```

**Key Insights:**
- 🎯 **Intellectual honesty** is crucial - don't claim success falsely
- 🔍 **Independent validation** reveals hidden issues
- 📊 **Data-driven decisions** prevent false optimizations

### 3. Tool Behavior Understanding Pattern

**Scenario:** External tool (ripgrep) behaving unexpectedly

**Process:**
1. **Create isolated tests** for the external tool
2. **Test multiple syntax variations** systematically
3. **Document working patterns** for future reference
4. **Integrate learnings** into production code

**Example:** Ripgrep exclusion pattern discovery
```bash
# ❌ Assumed this would work
rg pattern . --glob '!./file.md'

# ✅ Discovered this actually works  
rg pattern . --glob '!file.md'
```

**Key Techniques:**
- 🧪 **Systematic testing** of tool behavior
- 📝 **Document quirks** and edge cases
- 🔄 **Iterate on assumptions** until proven

### 4. Debug-First Development Pattern

**Scenario:** Complex issues requiring deep analysis

**Process:**
1. **Build debug tools first** before attempting fixes
2. **Gather comprehensive data** about the problem
3. **Implement targeted solutions** based on debug insights
4. **Validate with same debug tools** that fix works

**Tools Created:**
- `debug-cache-coverage.js` - Cache vs disk file analysis
- `debug-cache-exclusion.js` - Overlap detection
- `test-ripgrep-exclusion.js` - Tool behavior testing
- `debug-cache-search-efficiency.js` - Search performance analysis

**Benefits:**
- 🎯 **Targeted solutions** based on real data
- 🔍 **Root cause identification** vs symptom treatment
- ✅ **Validation framework** for testing fixes

## MCP-Specific Best Practices

### 1. Cache Persistence Strategy
**Pattern:** Leverage MCP server restarts for cache validation

```javascript
// Cache survives MCP server restarts
// Use this for testing cache persistence
await mcp_restart();
const cacheHits = await testCacheEffectiveness();
```

### 2. Formatted Output Handling
**Pattern:** Operation-aware formatting for different use cases

```javascript
// Read operations: Return full content for Claude
// List/search operations: Return formatted summaries for user
const formatResponse = (operation, data) => {
  if (operation === 'read') return data.content;
  return formatForDisplay(data);
};
```

### 3. Path Normalization Strategy
**Pattern:** Consistent absolute paths in cache, relative for external tools

```javascript
// Cache storage: Always absolute paths
const cacheKey = path.resolve(filePath);

// External tool integration: Convert to relative  
const relativePath = filePath.split('/apex-hive/')[1];
```

## Session Continuity Patterns

### 1. Post-Compact Tool Preference
**Issue:** After conversation compacts, Claude Code reverts to native tools

**Solution:** Explicit reminders and conscious tool selection
```markdown
<!-- Add to session context -->
## Tool Preferences
- Use mcp__filesystem-cached__* tools instead of native Read/Write/Edit
- Check tool selection after conversation compacts
- MCP tools provide 80%+ performance improvement
```

### 2. Context Preservation
**Pattern:** Document findings for session continuity

```javascript
// Save important discoveries in markdown
const findings = {
  ripgrepSyntax: "Use 'file.md' not './file.md' for exclusions",
  cacheHitUnits: "Cache hits = files, disk hits = lines", 
  pathNormalization: "Absolute in cache, relative for ripgrep"
};
```

## Error Recovery Patterns

### 1. Systematic Debugging Approach
When optimizations fail:

1. **Isolate variables** - Test one change at a time
2. **Create minimal reproductions** - Simple test cases
3. **Compare before/after** - Quantitative measurements
4. **Document failed approaches** - Learn from mistakes

### 2. Validation Framework
Before claiming success:

1. **Independent verification** - Multiple test methods
2. **Edge case testing** - Boundary conditions
3. **Performance measurement** - Real metrics, not assumptions
4. **User impact assessment** - Actual improvement vs claims

## Documentation Patterns

### 1. Living Documentation
**Pattern:** Update docs as discoveries are made

```markdown
<!-- Include in docs -->
## Recent Discoveries
- 2025-07-06: Ripgrep exclusion syntax doesn't support ./ prefix
- 2025-07-06: Cache hits measured in files, disk hits in lines
- 2025-07-06: Post-processing filters can eliminate valid results
```

### 2. Debug Tool Documentation
**Pattern:** Document debug tools with examples

```markdown
## Debug Tools Usage
```bash
# Cache coverage analysis
node scripts/debug-cache-coverage.js

# Expected output: 94% cache coverage, 8 missing files
```

### 3. Performance Benchmarks
**Pattern:** Include quantitative results in documentation

```markdown
## Performance Results
- Token reduction: 65% (650 → 230 matches)
- Disk I/O reduction: 84% (500 → 80 hits)
- Cache hit rate: 65% (vs 23% before optimization)
```

## Future Collaboration Improvements

### 1. Automatic Tool Preference
Develop MCP middleware to automatically route to cached tools:

```javascript
// Intercept native tool calls and route to MCP equivalents
const toolRouter = (toolName, params) => {
  const mcpEquivalent = toolMapping[toolName];
  if (mcpEquivalent && cacheAvailable()) {
    return callMCPTool(mcpEquivalent, params);
  }
  return callNativeTool(toolName, params);
};
```

### 2. Performance Monitoring
Implement automatic performance tracking:

```javascript
// Track tool usage and performance across sessions
const metrics = {
  toolUsage: { mcp: 0, native: 0 },
  cacheHitRate: [],
  tokenReduction: [],
  sessionPerformance: []
};
```

### 3. Context Preservation
Improve context preservation across compacts:

```javascript
// Auto-save important discoveries to persistent storage
const sessionContext = {
  toolPreferences: ['mcp__filesystem-cached'],
  recentFindings: [...discoveries],
  performanceBaselines: {...metrics}
};
```

## Conclusion

Effective MCP collaboration requires:

1. **Systematic approach** to problem-solving
2. **Debug-first mentality** for complex issues  
3. **Honest validation** of claimed improvements
4. **Comprehensive documentation** of findings
5. **Preference for cached operations** over native tools

The cache-first search optimization demonstrates how these patterns can achieve significant performance improvements (65% token reduction) through careful analysis and systematic implementation.

These patterns provide a foundation for future AI-human collaboration sessions and ensure consistent, high-quality results.

---

*Generated: 2025-07-06*  
*Based on: Cache-first search optimization session*  
*Performance: Demonstrates 65% token reduction through proper MCP collaboration*