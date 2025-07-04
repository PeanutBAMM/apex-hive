# Token Optimization - Apex Hive

<overview>
Intelligent output formatting for MCP responses without hard limits, focusing on clarity and usefulness rather than arbitrary truncation.
</overview>

## Design Principles

1. **Context-Aware** - Format based on content type
2. **No Hard Limits** - Intelligent decisions, not arbitrary cuts
3. **Useful Summaries** - When truncating, provide actionable info
4. **Error Priority** - Never truncate error messages

## Output Formatting Strategy

<formatting>
```javascript
// In MCP Gateway - Intelligent output formatting
async function formatOutput(result, context) {
  // Never truncate errors
  if (result.error || result.status === 'error') {
    return formatError(result);
  }
  
  // Format based on result type
  const formatter = getFormatter(result);
  return formatter(result, context);
}

// Type-specific formatters
const formatters = {
  searchResults: formatSearchResults,
  fileList: formatFileList,
  logs: formatLogs,
  diffResult: formatDiff,
  testResults: formatTests,
  default: formatDefault
};

function getFormatter(result) {
  if (result.searchResults || result.type === 'search') {
    return formatters.searchResults;
  }
  if (result.files || result.type === 'list') {
    return formatters.fileList;
  }
  if (result.logs || result.type === 'logs') {
    return formatters.logs;
  }
  if (result.diff || result.type === 'diff') {
    return formatters.diffResult;
  }
  if (result.tests || result.type === 'test') {
    return formatters.testResults;
  }
  return formatters.default;
}
```javascript
</formatting>

## Specific Formatters

<formatters>
### Search Results Formatter

Groups results by file for better overview:

```javascript
function formatSearchResults(result) {
  const { results, query } = result;
  
  // Group by file
  const byFile = new Map();
  for (const match of results) {
    if (!byFile.has(match.file)) {
      byFile.set(match.file, []);
    }
    byFile.get(match.file).push(match);
  }
  
  // Format with useful context
  let output = `🔍 Search: "${query}"\n`;
  output += `📊 Found ${results.length} matches in ${byFile.size} files\n\n`;
  
  // Show files with most matches first
  const sorted = Array.from(byFile.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  for (const [file, matches] of sorted) {
    output += `📄 ${file} (${matches.length} matches)\n`;
    
    // Show first 3 matches with context
    matches.slice(0, 3).forEach(match => {
      output += `  ${match.line}: ${match.text.trim()}\n`;
      if (match.context) {
        output += `     ${match.context}\n`;
      }
    });
    
    if (matches.length > 3) {
      output += `  ... ${matches.length - 3} more matches\n`;
    }
    output += '\n';
  }
  
  return output;
}
```javascript

### File List Formatter

Hierarchical view for file lists:

```javascript
function formatFileList(result) {
  const { files, pattern } = result;
  
  if (files.length === 0) {
    return `No files found matching: ${pattern}`;
  }
  
  if (files.length < 50) {
    // Full list for small results
    return formatFileTree(files);
  }
  
  // Summary for large results
  const byDir = groupByDirectory(files);
  let output = `📁 Found ${files.length} files matching: ${pattern}\n\n`;
  
  for (const [dir, dirFiles] of byDir) {
    output += `📂 ${dir}/ (${dirFiles.length} files)\n`;
    // Show first few files
    dirFiles.slice(0, 3).forEach(f => {
      output += `  - ${path.basename(f)}\n`;
    });
    if (dirFiles.length > 3) {
      output += `  ... ${dirFiles.length - 3} more\n`;
    }
  }
  
  return output;
}
```javascript

### Log Formatter

Smart log formatting with error highlighting:

```javascript
function formatLogs(result) {
  const { logs, service } = result;
  
  // Find errors and warnings
  const errors = logs.filter(l => l.level === 'error' || l.text?.includes('ERROR'));
  const warnings = logs.filter(l => l.level === 'warn' || l.text?.includes('WARN'));
  
  let output = `📋 Logs from ${service}\n`;
  output += `❌ Errors: ${errors.length} | ⚠️ Warnings: ${warnings.length}\n\n`;
  
  // Always show all errors
  if (errors.length > 0) {
    output += '=== ERRORS ===\n';
    errors.forEach(err => {
      output += `${err.timestamp} ${err.text}\n`;
    });
    output += '\n';
  }
  
  // Show recent logs
  output += '=== RECENT LOGS ===\n';
  const recent = logs.slice(-20);
  recent.forEach(log => {
    const marker = log.level === 'error' ? '❌' : 
                   log.level === 'warn' ? '⚠️' : '•';
    output += `${marker} ${log.timestamp} ${log.text}\n`;
  });
  
  if (logs.length > 20) {
    output += `\n... ${logs.length - 20} earlier logs\n`;
  }
  
  return output;
}
```javascript

### Test Results Formatter

Clear test outcome summary:

```javascript
function formatTestResults(result) {
  const { passed, failed, skipped, duration } = result;
  const total = passed + failed + skipped;
  
  let output = '🧪 Test Results\n';
  output += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  // Summary line with emoji
  const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
  output += `${status} - ${passed}/${total} tests passed in ${duration}ms\n\n`;
  
  // Show failures in detail
  if (failed > 0) {
    output += '❌ Failed Tests:\n';
    result.failures.forEach(test => {
      output += `\n  ${test.name}\n`;
      output += `  ${test.error}\n`;
      output += `  at ${test.location}\n`;
    });
  }
  
  // Summary stats
  output += '\n📊 Summary:\n';
  output += `  ✅ Passed: ${passed}\n`;
  output += `  ❌ Failed: ${failed}\n`;
  output += `  ⏭️ Skipped: ${skipped}\n`;
  output += `  ⏱️ Duration: ${duration}ms\n`;
  
  return output;
}
```javascript
</formatters>

## Smart Truncation

<truncation>
When content is genuinely too large, truncate intelligently:

```javascript
function smartTruncate(text, context) {
  // Never truncate if under 10K chars
  if (text.length < 10000) return text;
  
  // For code: show start and end
  if (context.type === 'code') {
    const lines = text.split('\n');
    if (lines.length > 100) {
      return [
        ...lines.slice(0, 40),
        '',
        `... ${lines.length - 80} lines omitted ...`,
        '',
        ...lines.slice(-40)
      ].join('\n');
    }
  }
  
  // For repetitive content: deduplicate
  if (context.type === 'logs') {
    return deduplicateLines(text);
  }
  
  // Default: show what matters
  return text.substring(0, 8000) + '\n\n[Content continues - use specific commands to see more]';
}

function deduplicateLines(text) {
  const lines = text.split('\n');
  const seen = new Map();
  const output = [];
  
  for (const line of lines) {
    const count = seen.get(line) || 0;
    seen.set(line, count + 1);
    
    if (count === 0) {
      output.push(line);
    } else if (count === 1) {
      output.push(`... [line repeated ${count} time]`);
    } else {
      // Update the count in place
      output[output.length - 1] = `... [line repeated ${count + 1} times]`;
    }
  }
  
  return output.join('\n');
}
```javascript
</truncation>

## Benefits

<benefits>
1. **No Information Loss** - Critical data never truncated
2. **Better Overview** - Grouped and summarized results
3. **Actionable Output** - Shows what matters most
4. **Context Preservation** - Maintains useful context
5. **Error Visibility** - Errors always fully visible
</benefits>

## Usage Examples

<examples>
### Search with Many Results
```javascript
🔍 Search: "authenticate"
📊 Found 127 matches in 23 files

📄 src/auth/authenticator.js (45 matches)
  23: function authenticate(user, password) {
  45:   const authenticated = await checkPassword(user, password);
  67:   return { authenticated, token };
  ... 42 more matches

📄 test/auth.test.js (31 matches)
  12: describe('authenticate', () => {
  34:   expect(authenticate).toBeDefined();
  56:   const result = await authenticate('user', 'pass');
  ... 28 more matches

[Additional files listed with match counts]
```javascript

### Error Logs
```javascript
📋 Logs from CI/CD
❌ Errors: 3 | ⚠️ Warnings: 7

=== ERRORS ===
2024-01-15 10:23:45 ERROR: TypeScript compilation failed
2024-01-15 10:23:46 ERROR: src/index.ts(34,5): Property 'foo' does not exist
2024-01-15 10:23:47 ERROR: Build failed with exit code 1

=== RECENT LOGS ===
• 2024-01-15 10:23:40 Starting build process...
• 2024-01-15 10:23:41 Installing dependencies...
⚠️ 2024-01-15 10:23:43 WARN: Deprecated package detected
❌ 2024-01-15 10:23:45 ERROR: TypeScript compilation failed
[...]
```javascript
</examples>
</content>