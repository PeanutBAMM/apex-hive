// fix-detected.js - Auto-fix issues detected by detect-issues
import { execSync } from "child_process";
import { promises as fs } from "fs";

export async function run(args = {}) {
  const {
    report = "issues-report.md",
    categories = ["all"],
    types = ["all"],
    interactive = false,
    force = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[FIX-DETECTED] Starting auto-fix process...");

  try {
    // First run detection if no report exists
    let issues;

    try {
      const reportContent = await fs.readFile(report, "utf8");
      issues = parseIssuesReport(reportContent);
    } catch {
      console.error("[FIX-DETECTED] No report found, running detection...");

      const detectResult =
        (await modules["detect-issues"]?.run({
          categories,
          report: true,
          dryRun: false,
        })) || (await runDetection(categories));

      if (!detectResult.success || detectResult.data.total === 0) {
        return {
          success: true,
          data: {
            fixed: 0,
            total: 0,
          },
          message: "No issues found to fix",
        };
      }

      issues = detectResult.data.issues;
    }

    // Filter fixable issues
    const fixableIssues = [];
    for (const [severity, severityIssues] of Object.entries(issues)) {
      for (const issue of severityIssues) {
        if (issue.fixable) {
          if (
            categories.includes("all") ||
            categories.includes(issue.category)
          ) {
            if (types.includes("all") || types.includes(issue.type)) {
              fixableIssues.push({ ...issue, severity });
            }
          }
        }
      }
    }

    if (fixableIssues.length === 0) {
      return {
        success: true,
        data: {
          fixed: 0,
          total: 0,
        },
        message: "No fixable issues found",
      };
    }

    // Group fixes by type for efficiency
    const fixGroups = {};
    for (const issue of fixableIssues) {
      if (!fixGroups[issue.type]) {
        fixGroups[issue.type] = [];
      }
      fixGroups[issue.type].push(issue);
    }

    const results = {
      fixed: [],
      failed: [],
      skipped: [],
    };

    // Apply fixes
    if (!dryRun) {
      for (const [type, typeIssues] of Object.entries(fixGroups)) {
        console.error(
          `[FIX-DETECTED] Fixing ${typeIssues.length} ${type} issues...`,
        );

        const fixResult = await applyFixes(type, typeIssues, {
          force,
          interactive,
        });
        results.fixed.push(...fixResult.fixed);
        results.failed.push(...fixResult.failed);
        results.skipped.push(...fixResult.skipped);
      }
    }

    // Generate fix report
    const fixReport = generateFixReport(results, fixableIssues.length);

    if (!dryRun) {
      await fs.writeFile("fix-report.md", fixReport);
    }

    return {
      success: true,
      dryRun,
      data: {
        total: fixableIssues.length,
        fixed: results.fixed.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        report: !dryRun ? "fix-report.md" : null,
      },
      message: dryRun
        ? `Would fix ${fixableIssues.length} issues`
        : `Fixed ${results.fixed.length}/${fixableIssues.length} issues`,
    };
  } catch (error) {
    console.error("[FIX-DETECTED] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to fix detected issues",
    };
  }
}

function parseIssuesReport(content) {
  const issues = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: [],
  };

  // Simple parser - in real implementation would be more robust
  const lines = content.split("\n");
  let currentSeverity = null;
  let currentIssue = null;

  for (const line of lines) {
    // Detect severity sections
    const severityMatch = line.match(/^## [🔴🟠🟡🔵⚪] (\w+)/);
    if (severityMatch) {
      currentSeverity = severityMatch[1].toLowerCase();
      continue;
    }

    // Parse issue details
    if (currentSeverity && line.startsWith("### ")) {
      if (currentIssue) {
        issues[currentSeverity].push(currentIssue);
      }
      currentIssue = {
        type: line.substring(4).trim(),
      };
    } else if (currentIssue && line.startsWith("- **")) {
      const match = line.match(/- \*\*(\w+)\*\*: (.+)/);
      if (match) {
        const [, key, value] = match;
        if (key === "Category") currentIssue.category = value;
        else if (key === "File") {
          const fileParts = value.split(":");
          currentIssue.file = fileParts[0];
          if (fileParts[1]) currentIssue.line = parseInt(fileParts[1]);
        } else if (key === "Message") currentIssue.message = value;
        else if (key === "Fixable")
          currentIssue.fixable = value.startsWith("Yes");
      }
    }
  }

  // Add last issue
  if (currentIssue && currentSeverity) {
    issues[currentSeverity].push(currentIssue);
  }

  return issues;
}

async function runDetection(categories) {
  try {
    const detectScript = "./scripts/detect-issues.js";
    const { run } = await import(detectScript);
    return await run({ categories, report: true });
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function applyFixes(type, issues, options) {
  const results = {
    fixed: [],
    failed: [],
    skipped: [],
  };

  switch (type) {
    case "console-log":
      for (const issue of issues) {
        try {
          const content = await fs.readFile(issue.file, "utf8");
          const lines = content.split("\n");

          // Remove console.log lines
          const lineIndex = issue.line - 1;
          if (lines[lineIndex] && lines[lineIndex].includes("console.log")) {
            lines.splice(lineIndex, 1);
            await fs.writeFile(issue.file, lines.join("\n"));
            results.fixed.push(issue);
          } else {
            results.failed.push({ ...issue, reason: "Line not found" });
          }
        } catch (error) {
          results.failed.push({ ...issue, reason: error.message });
        }
      }
      break;

    case "outdated-dependency":
      // Group by package for efficiency
      const packages = new Set(issues.map((i) => i.package));
      for (const pkg of packages) {
        try {
          console.error(`[FIX-DETECTED] Updating ${pkg}...`);
          execSync(`npm install ${pkg}@latest`, { stdio: "pipe" });
          results.fixed.push(...issues.filter((i) => i.package === pkg));
        } catch (error) {
          results.failed.push(
            ...issues
              .filter((i) => i.package === pkg)
              .map((i) => ({ ...i, reason: error.message })),
          );
        }
      }
      break;

    case "security-vulnerability":
      try {
        console.error("[FIX-DETECTED] Running npm audit fix...");
        const output = execSync("npm audit fix", { encoding: "utf8" });

        // Check if all were fixed
        const remaining = execSync("npm audit --json || true", {
          encoding: "utf8",
        });
        const audit = JSON.parse(remaining);

        if (audit.metadata?.vulnerabilities?.total === 0) {
          results.fixed.push(...issues);
        } else {
          // Some fixed, some not
          const stillVulnerable =
            (audit.metadata?.vulnerabilities?.critical || 0) +
            (audit.metadata?.vulnerabilities?.high || 0);
          const fixedCount = issues.length - stillVulnerable;

          results.fixed.push(...issues.slice(0, fixedCount));
          results.failed.push(
            ...issues
              .slice(fixedCount)
              .map((i) => ({ ...i, reason: "Could not auto-fix" })),
          );
        }
      } catch (error) {
        results.failed.push(
          ...issues.map((i) => ({ ...i, reason: error.message })),
        );
      }
      break;

    case "missing-documentation":
      for (const issue of issues) {
        if (issue.file === "README.md") {
          try {
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

## Testing

\`\`\`bash
npm test
\`\`\`

## License

${pkg.license || "MIT"}
`;
            await fs.writeFile("README.md", readme);
            results.fixed.push(issue);
          } catch (error) {
            results.failed.push({ ...issue, reason: error.message });
          }
        }
      }
      break;

    case "missing-tests":
      // Can't auto-generate meaningful tests
      results.skipped.push(
        ...issues.map((i) => ({
          ...i,
          reason: "Cannot auto-generate tests",
        })),
      );
      break;

    case "long-function":
    case "missing-jsdoc":
    case "sync-operation":
      // These require manual refactoring
      results.skipped.push(
        ...issues.map((i) => ({
          ...i,
          reason: "Requires manual refactoring",
        })),
      );
      break;

    case "hardcoded-secret":
    case "unsafe-regex":
      // Security issues need manual review
      results.skipped.push(
        ...issues.map((i) => ({
          ...i,
          reason: "Security issue - requires manual review",
        })),
      );
      break;

    default:
      results.skipped.push(
        ...issues.map((i) => ({
          ...i,
          reason: "Unknown fix type",
        })),
      );
  }

  return results;
}

function generateFixReport(results, total) {
  let report = "# Fix Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary
  report += "## Summary\n\n";
  report += `- Total fixable issues: ${total}\n`;
  report += `- ✅ Fixed: ${results.fixed.length}\n`;
  report += `- ❌ Failed: ${results.failed.length}\n`;
  report += `- ⏭️  Skipped: ${results.skipped.length}\n\n`;

  // Success rate
  const successRate =
    total > 0 ? Math.round((results.fixed.length / total) * 100) : 0;
  report += `**Success Rate: ${successRate}%**\n\n`;

  // Fixed issues
  if (results.fixed.length > 0) {
    report += "## ✅ Fixed Issues\n\n";
    for (const issue of results.fixed) {
      report += `- ${issue.type}`;
      if (issue.file) report += ` in ${issue.file}`;
      if (issue.line) report += `:${issue.line}`;
      report += "\n";
    }
    report += "\n";
  }

  // Failed fixes
  if (results.failed.length > 0) {
    report += "## ❌ Failed Fixes\n\n";
    for (const issue of results.failed) {
      report += `- ${issue.type}`;
      if (issue.file) report += ` in ${issue.file}`;
      if (issue.line) report += `:${issue.line}`;
      report += `\n  - Reason: ${issue.reason}\n`;
    }
    report += "\n";
  }

  // Skipped fixes
  if (results.skipped.length > 0) {
    report += "## ⏭️  Skipped Fixes\n\n";
    const skipGroups = {};
    for (const issue of results.skipped) {
      if (!skipGroups[issue.reason]) {
        skipGroups[issue.reason] = [];
      }
      skipGroups[issue.reason].push(issue);
    }

    for (const [reason, issues] of Object.entries(skipGroups)) {
      report += `### ${reason}\n\n`;
      for (const issue of issues) {
        report += `- ${issue.type}`;
        if (issue.file) report += ` in ${issue.file}`;
        if (issue.line) report += `:${issue.line}`;
        report += "\n";
      }
      report += "\n";
    }
  }

  // Next steps
  report += "## Next Steps\n\n";
  if (results.failed.length > 0) {
    report += "1. Review failed fixes and apply manually if needed\n";
  }
  if (results.skipped.length > 0) {
    report += "2. Address skipped issues that require manual intervention\n";
  }
  report += "3. Run detection again to verify all issues are resolved\n";

  return report;
}
