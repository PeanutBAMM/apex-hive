// detect-issues.js - Detect various issues in the codebase
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    categories = ["all"],
    severity = "all",
    fix = false,
    report = true,
    dryRun = false,
    page = 1,
    limit = 20,
    modules = {},
  } = args;

  console.error("[DETECT-ISSUES] Scanning for issues...");

  try {
    const issues = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: [],
    };

    const detectors = {
      code: detectCodeIssues,
      security: detectSecurityIssues,
      dependencies: detectDependencyIssues,
      documentation: detectDocumentationIssues,
      performance: detectPerformanceIssues,
      testing: detectTestingIssues,
    };

    // Run selected detectors
    const selectedCategories = categories.includes("all")
      ? Object.keys(detectors)
      : categories.filter((cat) => detectors[cat]);

    for (const category of selectedCategories) {
      console.error(`[DETECT-ISSUES] Checking ${category}...`);
      const categoryIssues = await detectors[category]();

      // Categorize by severity
      for (const issue of categoryIssues) {
        if (issues[issue.severity]) {
          issues[issue.severity].push({
            ...issue,
            category,
          });
        }
      }
    }

    // Filter by severity if specified
    const severityLevels = ["critical", "high", "medium", "low", "info"];
    let filteredIssues = {};

    if (severity === "all") {
      filteredIssues = issues;
    } else {
      const minIndex = severityLevels.indexOf(severity);
      for (let i = 0; i <= minIndex; i++) {
        filteredIssues[severityLevels[i]] = issues[severityLevels[i]];
      }
    }

    // Count total issues
    const totalIssues = Object.values(filteredIssues).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    // Generate report
    let reportContent = "";
    if (report && totalIssues > 0) {
      reportContent = generateReport(filteredIssues);

      if (!dryRun) {
        await fs.writeFile("issues-report.md", reportContent);
      }
    }

    // Apply pagination
    const allIssues = Object.values(filteredIssues).flat();
    const totalCount = allIssues.length;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Paginate issues
    const paginatedIssues = allIssues.slice(startIndex, endIndex);
    
    // Rebuild issues object with paginated results
    const paginatedFilteredIssues = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
    
    for (const issue of paginatedIssues) {
      if (paginatedFilteredIssues[issue.severity]) {
        paginatedFilteredIssues[issue.severity].push(issue);
      }
    }

    // Auto-fix if requested (only for current page)
    let fixedCount = 0;
    if (fix && !dryRun) {
      const fixableIssues = paginatedIssues.filter((issue) => issue.fixable);

      for (const issue of fixableIssues) {
        if (await attemptFix(issue)) {
          fixedCount++;
        }
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        issues: paginatedFilteredIssues,
        pagination: {
          page: currentPage,
          limit: limit,
          totalPages: totalPages,
          totalItems: totalCount,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
          showing: `${startIndex + 1}-${Math.min(endIndex, totalCount)} of ${totalCount}`
        },
        summary: {
          total: totalIssues,
          critical: filteredIssues.critical?.length || 0,
          high: filteredIssues.high?.length || 0,
          medium: filteredIssues.medium?.length || 0,
          low: filteredIssues.low?.length || 0,
          info: filteredIssues.info?.length || 0,
        },
        fixed: fixedCount,
        report: report && !dryRun ? "issues-report.md" : null,
      },
      message: dryRun
        ? `Would detect ${totalIssues} issues (page ${currentPage}/${totalPages})`
        : `Found ${totalIssues} issues (showing ${paginatedIssues.length} on page ${currentPage}/${totalPages})${fixedCount > 0 ? `, fixed ${fixedCount}` : ""}`,
    };
  } catch (error) {
    console.error("[DETECT-ISSUES] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to detect issues",
    };
  }
}

async function detectCodeIssues() {
  const issues = [];

  // Check for console.log statements
  try {
    const output = execSync(
      'grep -rn "console\\.log" --include="*.js" --exclude-dir=node_modules . || true',
      { encoding: "utf8" },
    );

    if (output.trim()) {
      const lines = output.trim().split("\n");
      for (const line of lines) {
        const [file, lineNum] = line.split(":");
        issues.push({
          type: "console-log",
          severity: "medium",
          file: file.replace("./", ""),
          line: parseInt(lineNum),
          message: "Console.log statement found",
          fixable: true,
          fix: "Remove console.log statement",
        });
      }
    }
  } catch {
    // Ignore errors
  }

  // Check for TODO/FIXME comments
  try {
    const output = execSync(
      'grep -rn "\\(TODO\\|FIXME\\)" --include="*.js" --exclude-dir=node_modules . || true',
      { encoding: "utf8" },
    );

    if (output.trim()) {
      const lines = output.trim().split("\n");
      for (const line of lines) {
        const [file, lineNum, ...rest] = line.split(":");
        const content = rest.join(":").trim();
        const severity = content.includes("FIXME") ? "high" : "low";

        issues.push({
          type: "todo-comment",
          severity,
          file: file.replace("./", ""),
          line: parseInt(lineNum),
          message: content,
          fixable: false,
        });
      }
    }
  } catch {
    // Ignore errors
  }

  // Check for long functions
  try {
    const jsFiles = execSync(
      'find . -name "*.js" -not -path "./node_modules/*"',
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(file, "utf8");
        const lines = content.split("\n");

        let inFunction = false;
        let functionStart = 0;
        let functionName = "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Simple function detection
          if (
            line.match(
              /function\s+(\w+)|(\w+)\s*:\s*function|(\w+)\s*=\s*function|(\w+)\s*=\s*\(/,
            )
          ) {
            inFunction = true;
            functionStart = i + 1;
            functionName = line.match(/(\w+)\s*[=:(]/)?.[1] || "anonymous";
          } else if (inFunction && line.includes("}")) {
            const functionLength = i - functionStart + 1;
            if (functionLength > 50) {
              issues.push({
                type: "long-function",
                severity: "low",
                file: file.replace("./", ""),
                line: functionStart,
                message: `Function '${functionName}' is ${functionLength} lines long (max: 50)`,
                fixable: false,
              });
            }
            inFunction = false;
          }
        }
      } catch {
        // Skip file
      }
    }
  } catch {
    // Ignore errors
  }

  return issues;
}

async function detectSecurityIssues() {
  const issues = [];

  // Check for hardcoded secrets
  const secretPatterns = [
    { pattern: "api[_-]?key\\s*[:=]\\s*[\"']\\w+[\"']", type: "api-key" },
    { pattern: "password\\s*[:=]\\s*[\"'][^\"']+[\"']", type: "password" },
    { pattern: "token\\s*[:=]\\s*[\"']\\w+[\"']", type: "token" },
    { pattern: "secret\\s*[:=]\\s*[\"'][^\"']+[\"']", type: "secret" },
  ];

  for (const { pattern, type } of secretPatterns) {
    try {
      const output = execSync(
        `grep -rni "${pattern}" --include="*.js" --exclude-dir=node_modules . || true`,
        { encoding: "utf8" },
      );

      if (output.trim()) {
        const lines = output.trim().split("\n");
        for (const line of lines) {
          const [file, lineNum] = line.split(":");
          issues.push({
            type: "hardcoded-secret",
            severity: "critical",
            file: file.replace("./", ""),
            line: parseInt(lineNum),
            message: `Potential hardcoded ${type} found`,
            fixable: false,
          });
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Check for unsafe regex
  try {
    const output = execSync(
      'grep -rn "new RegExp(" --include="*.js" --exclude-dir=node_modules . || true',
      { encoding: "utf8" },
    );

    if (output.trim()) {
      const lines = output.trim().split("\n");
      for (const line of lines) {
        const [file, lineNum] = line.split(":");
        issues.push({
          type: "unsafe-regex",
          severity: "medium",
          file: file.replace("./", ""),
          line: parseInt(lineNum),
          message: "Dynamic RegExp construction (potential ReDoS)",
          fixable: false,
        });
      }
    }
  } catch {
    // Ignore errors
  }

  return issues;
}

async function detectDependencyIssues() {
  const issues = [];

  // Check for outdated dependencies
  try {
    const output = execSync("npm outdated --json || true", {
      encoding: "utf8",
    });
    if (output.trim()) {
      const outdated = JSON.parse(output);

      for (const [name, info] of Object.entries(outdated)) {
        const severity = info.wanted !== info.latest ? "medium" : "low";
        issues.push({
          type: "outdated-dependency",
          severity,
          package: name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          message: `${name}: ${info.current} → ${info.latest}`,
          fixable: true,
        });
      }
    }
  } catch {
    // Ignore errors
  }

  // Check for security vulnerabilities
  try {
    const output = execSync("npm audit --json || true", { encoding: "utf8" });
    if (output.trim()) {
      const audit = JSON.parse(output);

      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;

        if (vulns.critical > 0) {
          issues.push({
            type: "security-vulnerability",
            severity: "critical",
            message: `${vulns.critical} critical vulnerabilities found`,
            fixable: true,
            fix: "Run npm audit fix",
          });
        }

        if (vulns.high > 0) {
          issues.push({
            type: "security-vulnerability",
            severity: "high",
            message: `${vulns.high} high vulnerabilities found`,
            fixable: true,
            fix: "Run npm audit fix",
          });
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return issues;
}

async function detectDocumentationIssues() {
  const issues = [];

  // Check for missing README
  try {
    await fs.access("README.md");
  } catch {
    issues.push({
      type: "missing-documentation",
      severity: "medium",
      file: "README.md",
      message: "Missing README.md file",
      fixable: true,
    });
  }

  // Check for missing JSDoc in exported functions
  try {
    const jsFiles = execSync(
      'find . -name "*.js" -not -path "./node_modules/*"',
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(file, "utf8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Check for exported functions without JSDoc
          if (line.match(/export\s+(async\s+)?function\s+\w+/)) {
            const prevLine = i > 0 ? lines[i - 1] : "";
            if (!prevLine.includes("*/")) {
              const funcName = line.match(/function\s+(\w+)/)?.[1];
              issues.push({
                type: "missing-jsdoc",
                severity: "low",
                file: file.replace("./", ""),
                line: i + 1,
                message: `Function '${funcName}' missing JSDoc`,
                fixable: false,
              });
            }
          }
        }
      } catch {
        // Skip file
      }
    }
  } catch {
    // Ignore errors
  }

  return issues;
}

async function detectPerformanceIssues() {
  const issues = [];

  // Check for synchronous file operations
  const syncOps = [
    "readFileSync",
    "writeFileSync",
    "appendFileSync",
    "mkdirSync",
  ];

  for (const op of syncOps) {
    try {
      const output = execSync(
        `grep -rn "${op}" --include="*.js" --exclude-dir=node_modules . || true`,
        { encoding: "utf8" },
      );

      if (output.trim()) {
        const lines = output.trim().split("\n");
        for (const line of lines) {
          const [file, lineNum] = line.split(":");
          issues.push({
            type: "sync-operation",
            severity: "medium",
            file: file.replace("./", ""),
            line: parseInt(lineNum),
            message: `Synchronous operation '${op}' found`,
            fixable: false,
            fix: `Use async version instead`,
          });
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return issues;
}

async function detectTestingIssues() {
  const issues = [];

  // Check for missing test files
  try {
    const srcFiles = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./test*/*"',
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    for (const srcFile of srcFiles) {
      const testFile = srcFile.replace(/\.js$/, ".test.js");
      const specFile = srcFile.replace(/\.js$/, ".spec.js");

      try {
        await fs.access(testFile);
      } catch {
        try {
          await fs.access(specFile);
        } catch {
          issues.push({
            type: "missing-tests",
            severity: "low",
            file: srcFile.replace("./", ""),
            message: "No test file found",
            fixable: false,
          });
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return issues;
}

async function attemptFix(issue) {
  try {
    switch (issue.type) {
      case "console-log":
        // Remove console.log line
        const content = await fs.readFile(issue.file, "utf8");
        const lines = content.split("\n");
        lines.splice(issue.line - 1, 1);
        await fs.writeFile(issue.file, lines.join("\n"));
        return true;

      case "outdated-dependency":
        // Update package
        execSync(`npm install ${issue.package}@latest`, { stdio: "pipe" });
        return true;

      case "security-vulnerability":
        // Run audit fix
        execSync("npm audit fix", { stdio: "pipe" });
        return true;

      case "missing-documentation":
        // Create basic README
        if (issue.file === "README.md") {
          const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
          const readme = `# ${pkg.name}

${pkg.description || "Project description"}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## License

${pkg.license || "MIT"}
`;
          await fs.writeFile("README.md", readme);
          return true;
        }
        break;
    }
  } catch {
    // Fix failed
  }

  return false;
}

function generateReport(issues) {
  let report = "# Issues Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary
  const total = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
  report += "## Summary\n\n";
  report += `- Total Issues: ${total}\n`;
  report += `- Critical: ${issues.critical?.length || 0}\n`;
  report += `- High: ${issues.high?.length || 0}\n`;
  report += `- Medium: ${issues.medium?.length || 0}\n`;
  report += `- Low: ${issues.low?.length || 0}\n`;
  report += `- Info: ${issues.info?.length || 0}\n\n`;

  // Details by severity
  const severityEmojis = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🔵",
    info: "⚪",
  };

  for (const [severity, severityIssues] of Object.entries(issues)) {
    if (severityIssues.length === 0) continue;

    report += `## ${severityEmojis[severity]} ${severity.toUpperCase()} (${severityIssues.length})\n\n`;

    for (const issue of severityIssues) {
      report += `### ${issue.type}\n`;
      report += `- **Category**: ${issue.category}\n`;
      if (issue.file) report += `- **File**: ${issue.file}`;
      if (issue.line) report += `:${issue.line}`;
      if (issue.file) report += "\n";
      report += `- **Message**: ${issue.message}\n`;
      if (issue.fixable)
        report += `- **Fixable**: Yes${issue.fix ? ` - ${issue.fix}` : ""}\n`;
      report += "\n";
    }
  }

  return report;
}
