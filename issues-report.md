# Issues Report

Generated: 2025-06-30T21:27:11.939Z

## Summary

- Total Issues: 12
- Critical: 0
- High: 12
- Medium: 0
- Low: 0
- Info: 0

## 🟠 HIGH (12)

### todo-comment
- **Category**: code
- **File**: scripts/detect-issues.js:155
- **Message**: // Check for TODO/FIXME comments

### todo-comment
- **Category**: code
- **File**: scripts/detect-issues.js:158
- **Message**: 'grep -rn "\\(TODO\\|FIXME\\)" --include="*.js" --exclude-dir=node_modules . || true',

### todo-comment
- **Category**: code
- **File**: scripts/detect-issues.js:167
- **Message**: const severity = content.includes("FIXME") ? "high" : "low";

### todo-comment
- **Category**: code
- **File**: scripts/quality-validate.js:179
- **Message**: // 5. TODO/FIXME check

### todo-comment
- **Category**: code
- **File**: scripts/quality-validate.js:183
- **Message**: 'grep -r "TODO\\|FIXME" --include="*.js" --exclude-dir=node_modules . | wc -l',

### todo-comment
- **Category**: code
- **File**: scripts/quality-validate.js:198
- **Message**: message: `Found ${count} TODO/FIXME comments`,

### todo-comment
- **Category**: code
- **File**: scripts/quality-validate.js:204
- **Message**: message: `Found ${count} TODO/FIXME comments`,

### todo-comment
- **Category**: code
- **File**: scripts/quality-validate.js:210
- **Message**: message: "No TODO/FIXME comments",

### todo-comment
- **Category**: code
- **File**: scripts/report-status.js:328
- **Message**: fixmes: "FIXME",

### todo-comment
- **Category**: code
- **File**: scripts/report-status.js:371
- **Message**: // Count TODOs and FIXMEs

### todo-comment
- **Category**: code
- **File**: scripts/report-status.js:379
- **Message**: 'grep -r "FIXME" --include="*.js" --exclude-dir=node_modules . | wc -l',

### todo-comment
- **Category**: code
- **File**: scripts/report-status.js:617
- **Message**: report += `- **FIXMEs**: ${data.code.patterns.fixmes}\n`;

