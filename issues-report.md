# Issues Report

Generated: 2025-07-01T08:28:37.353Z

## Summary

- Total Issues: 367
- Critical: 0
- High: 12
- Medium: 141
- Low: 214
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

## 🟡 MEDIUM (141)

### console-log
- **Category**: code
- **File**: generate-claude-md.js:43
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: generate-claude-md.js:107
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: generate-claude-md.js:305
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: generate-claude-md.js:306
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: install-mcp.js:11
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: install-mcp.js:24
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: install-mcp.js:41
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: install-mcp.js:60
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: install-mcp.js:72
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: install-mcp.js:80
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: mcp-server-debug.js:25
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: mcp-server.js:4
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:12
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:23
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:26
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:32
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:51
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:54
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:56
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:61
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:65
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:68
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:74
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:75
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:77
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:80
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:83
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: prepare-release.js:87
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/ci-fix.js:146
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/ci-fix.js:153
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/ci-status.js:76
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/code-stub.js:217
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/code-stub.js:1067
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/code-stub.js:1345
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/code-stub.js:1351
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/code-stub.js:1355
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/code-stub.js:1361
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/code-stub.js:1363
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/deploy.js:226
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/deploy.js:235
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/detect-issues.js:129
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/detect-issues.js:147
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/detect-issues.js:523
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/doc-validate.js:362
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/doc-validate.js:363
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/doc-validate.js:367
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/fix-detected.js:221
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/fix-detected.js:223
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/init-project.js:310
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/init-project.js:312
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-check.js:60
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-check.js:61
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:1
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:14
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:52
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:57
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:58
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:107
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:108
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-console-clean.js:115
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-fix-all.js:1
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-fix-all.js:44
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-fix-all.js:45
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-fix-all.js:54
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:60
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:72
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:76
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:78
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:82
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:84
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:89
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/quality-validate.js:91
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/release.js:277
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/release.js:285
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: scripts/report-status.js:511
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:165
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:176
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:179
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:183
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:188
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:189
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:190
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:191
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-integration.js:192
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-minimal.js:4
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-minimal.js:5
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:44
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:57
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:71
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:74
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:81
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:84
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:96
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-mcp-protocol.js:100
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:23
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:48
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:51
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:55
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:70
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:129
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:173
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:264
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:271
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:277
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:281
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:282
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:283
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:284
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:285
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:286
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: test-scripts.js:306
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: verify-installation.js:12
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: verify-installation.js:25
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: verify-installation.js:28
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: verify-installation.js:32
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### console-log
- **Category**: code
- **File**: verify-installation.js:108
- **Message**: Console.log statement found
- **Fixable**: Yes - Remove console.log statement

### unsafe-regex
- **Category**: security
- **File**: modules/file-ops.js:82
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/detect-issues.js:282
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-generate-missing.js:605
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-search.js:131
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-search.js:184
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-update-readme.js:350
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-links.js:497
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-links.js:498
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-links.js:499
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-links.js:500
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-links.js:511
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-links.js:512
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-links.js:677
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-xml.js:240
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/doc-validate-xml.js:242
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/search.js:250
- **Message**: Dynamic RegExp construction (potential ReDoS)

### unsafe-regex
- **Category**: security
- **File**: scripts/version-bump.js:278
- **Message**: Dynamic RegExp construction (potential ReDoS)

### outdated-dependency
- **Category**: dependencies
- **Message**: eslint: 8.57.1 → 9.30.0
- **Fixable**: Yes

### outdated-dependency
- **Category**: dependencies
- **Message**: lru-cache: 10.4.3 → 11.1.0
- **Fixable**: Yes

### sync-operation
- **Category**: performance
- **File**: scripts/detect-issues.js:441
- **Message**: Synchronous operation 'readFileSync' found

### sync-operation
- **Category**: performance
- **File**: mcp-server-debug.js:18
- **Message**: Synchronous operation 'writeFileSync' found

### sync-operation
- **Category**: performance
- **File**: scripts/detect-issues.js:442
- **Message**: Synchronous operation 'writeFileSync' found

### sync-operation
- **Category**: performance
- **File**: mcp-server-debug.js:21
- **Message**: Synchronous operation 'appendFileSync' found

### sync-operation
- **Category**: performance
- **File**: scripts/detect-issues.js:443
- **Message**: Synchronous operation 'appendFileSync' found

### sync-operation
- **Category**: performance
- **File**: scripts/detect-issues.js:444
- **Message**: Synchronous operation 'mkdirSync' found

## 🔵 LOW (214)

### todo-comment
- **Category**: code
- **File**: scripts/backlog-analyze.js:144
- **Message**: // Load from TODO files

### todo-comment
- **Category**: code
- **File**: scripts/backlog-analyze.js:146
- **Message**: const todoFiles = ["TODO.md", "BACKLOG.md", "ROADMAP.md"];

### todo-comment
- **Category**: code
- **File**: scripts/backlog-sync.js:216
- **Message**: const mdFiles = ["TODO.md", "BACKLOG.md", "ROADMAP.md"];

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:205
- **Message**: content += `  // TODO: Implement ${name}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:253
- **Message**: content += `  // TODO: Define options\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:257
- **Message**: content += `  // TODO: Define result\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:271
- **Message**: content += `  // TODO: Implement ${name}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:339
- **Message**: content += `        # TODO: Implement ${name}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:351
- **Message**: content += `    # TODO: Implement ${name}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:395
- **Message**: content += `  // TODO: Define interface\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:417
- **Message**: content += `    // TODO: Initialize ${className}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:433
- **Message**: content += `    // TODO: Implement process method\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:494
- **Message**: content += `    # TODO: Define dataclass fields\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:500
- **Message**: content += `        # TODO: Initialize ${className}\n\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:523
- **Message**: content += `        # TODO: Implement process method\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:584
- **Message**: content += `  // TODO: Define props\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:601
- **Message**: content += `    // TODO: Define state\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:609
- **Message**: content += `        {/* TODO: Implement ${name} */}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:640
- **Message**: content += `    // TODO: Add effect logic\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:646
- **Message**: content += `      {/* TODO: Implement ${name} */}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:663
- **Message**: /* TODO: Add styles */

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:680
- **Message**: <!-- TODO: Implement ${name} -->

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:701
- **Message**: // TODO: Add mounted logic

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:722
- **Message**: // TODO: Add mounted logic

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:729
- **Message**: /* TODO: Add styles */

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:756
- **Message**: // TODO: Add initialization logic

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:762
- **Message**: <!-- TODO: Implement ${name} -->

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:769
- **Message**: /* TODO: Add styles */

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:837
- **Message**: content += `  // TODO: Initialize module\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:848
- **Message**: content += `  // TODO: Process data\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:855
- **Message**: content += `    // TODO: Add more status info\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:906
- **Message**: content += '    # TODO: Initialize module\n';

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:914
- **Message**: content += '    # TODO: Process data\n';

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:925
- **Message**: content += '        # TODO: Add more status info\n';

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:989
- **Message**: content += `    // TODO: Implement GET /${name}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1006
- **Message**: content += `    // TODO: Validate request body\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1008
- **Message**: content += `    // TODO: Implement POST /${name}\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1029
- **Message**: content += `    // TODO: Implement PUT /${name}/:id\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1047
- **Message**: content += `    // TODO: Implement DELETE /${name}/:id\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1128
- **Message**: content += `    // TODO: Setup before each test\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1132
- **Message**: content += `    // TODO: Cleanup after each test\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1346
- **Message**: content += `    // TODO: Implement script logic\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1362
- **Message**: content += `  // TODO: Implement script logic\n\n`;

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1457
- **Message**: content += '    # TODO: Implement script logic\n\n';

### todo-comment
- **Category**: code
- **File**: scripts/code-stub.js:1549
- **Message**: content += '    # TODO: Implement script logic\n\n';

### todo-comment
- **Category**: code
- **File**: scripts/doc-generate-missing.js:375
- **Message**: // TODO comments

### todo-comment
- **Category**: code
- **File**: scripts/doc-generate-missing.js:377
- **Message**: doc += `## TODO\n\n`;

### todo-comment
- **Category**: code
- **File**: scripts/doc-generate-missing.js:393
- **Message**: doc += `// TODO: Add usage example\n`;

### todo-comment
- **Category**: code
- **File**: scripts/doc-generate-missing.js:395
- **Message**: doc += `// TODO: Add usage example\n`;

### todo-comment
- **Category**: code
- **File**: scripts/doc-generate-missing.js:398
- **Message**: doc += `// TODO: Add usage example\n`;

### todo-comment
- **Category**: code
- **File**: scripts/doc-generate-missing.js:627
- **Message**: // Extract TODOs (language agnostic)

### todo-comment
- **Category**: code
- **File**: scripts/doc-generate-missing.js:628
- **Message**: const todoRegex = /(?:\/\/|#|\/\*)\s*TODO\s*:?\s*(.+?)(?:\*\/|$)/gi;

### todo-comment
- **Category**: code
- **File**: scripts/quality-validate.js:180
- **Message**: console.error("[QUALITY-VALIDATE] Checking for TODOs...");

### todo-comment
- **Category**: code
- **File**: scripts/quality-validate.js:217
- **Message**: message: "No TODOs found",

### todo-comment
- **Category**: code
- **File**: scripts/report-status.js:327
- **Message**: todos: "TODO",

### todo-comment
- **Category**: code
- **File**: scripts/report-status.js:374
- **Message**: 'grep -r "TODO" --include="*.js" --exclude-dir=node_modules . | wc -l',

### todo-comment
- **Category**: code
- **File**: scripts/report-status.js:616
- **Message**: report += `- **TODOs**: ${data.code.patterns.todos}\n`;

### long-function
- **Category**: code
- **File**: generate-claude-md.js:106
- **Message**: Function 'generateClaudeMd' is 51 lines long (max: 50)

### long-function
- **Category**: code
- **File**: scripts/doc-generate.js:272
- **Message**: Function 'anonymous' is 52 lines long (max: 50)

### missing-jsdoc
- **Category**: documentation
- **File**: modules/unified-cache.js:232
- **Message**: Function 'formatBytes' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/backlog-analyze.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/backlog-display.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/backlog-score.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/backlog-sync.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/backlog-table.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/build.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/cache-clear.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/cache-status.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/cache-warm-all.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/cache-warm-docs.js:18
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/cache-warm-readmes.js:8
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/changelog-generate.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/ci-fix.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/ci-heal.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/ci-monitor.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/ci-parse.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/ci-smart-push.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/ci-status.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/ci-watch.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/code-stub.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/deploy.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/detect-issues.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-add-xml.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-check.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-fix-links.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-generate-changed.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-generate-missing.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-generate.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-organize.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-post-merge.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-search.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-sync.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-update-readme.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-update.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-validate-links.js:7
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-validate-xml.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/doc-validate.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/fix-detected.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-branch.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-commit.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-init.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-pull.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-push-tags.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-push.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-status.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/git-tag.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/init-project.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-check.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-console-clean.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-fix-all.js:4
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-fix-versions.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-format.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-lint.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-setup.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/quality-validate.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/release.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/report-status.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/save-conversation.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/search.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/test-runner.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/test-setup.js:6
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/version-bump.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/xml-add.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/xml-clean.js:5
- **Message**: Function 'run' missing JSDoc

### missing-jsdoc
- **Category**: documentation
- **File**: scripts/xml-validate.js:5
- **Message**: Function 'run' missing JSDoc

### missing-tests
- **Category**: testing
- **File**: apex-router.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: config/patterns-nl.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: config/patterns.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: config/registry.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: generate-claude-md.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: index.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: install-mcp.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: mcp-server-debug.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: mcp-server-fixed.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: mcp-server.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: modules/file-ops.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: modules/git-ops.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: modules/logger.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: modules/rag-system.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: modules/search.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: modules/unified-cache.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: modules/utils.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: output-formatter.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: prepare-release.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/backlog-analyze.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/backlog-display.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/backlog-score.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/backlog-sync.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/backlog-table.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/build.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/cache-clear.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/cache-status.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/cache-warm-all.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/cache-warm-docs.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/cache-warm-readmes.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/changelog-generate.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/ci-fix.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/ci-heal.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/ci-monitor.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/ci-parse.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/ci-smart-push.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/ci-status.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/ci-watch.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/code-stub.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/deploy.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/detect-issues.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-add-xml.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-check.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-fix-links.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-generate-changed.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-generate-missing.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-generate.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-organize.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-post-merge.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-search.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-sync.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-update-readme.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-update.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-validate-links.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-validate-xml.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/doc-validate.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/fix-detected.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-branch.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-commit.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-init.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-pull.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-push-tags.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-push.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-status.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/git-tag.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/init-project.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-check.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-console-clean.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-fix-all.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-fix-versions.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-format.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-lint.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-setup.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/quality-validate.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/release.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/report-status.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/save-conversation.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/search.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/test-runner.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/test-setup.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/version-bump.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/xml-add.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/xml-clean.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: scripts/xml-validate.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: test-integration.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: test-mcp-minimal.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: test-mcp-protocol.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: test-scripts.js
- **Message**: No test file found

### missing-tests
- **Category**: testing
- **File**: verify-installation.js
- **Message**: No test file found

