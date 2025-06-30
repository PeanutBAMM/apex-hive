// report-status.js - Generate comprehensive status reports
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    format = "markdown",
    sections = ["all"],
    output = "status-report",
    open = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[REPORT-STATUS] Generating status report...");

  try {
    const reportData = {};

    // Define available sections
    const availableSections = {
      overview: generateOverview,
      git: generateGitStatus,
      ci: generateCIStatus,
      dependencies: generateDependencyStatus,
      code: generateCodeMetrics,
      issues: generateIssuesStatus,
      tests: generateTestStatus,
      documentation: generateDocStatus,
      performance: generatePerformanceStatus,
    };

    // Collect data for requested sections
    const selectedSections = sections.includes("all")
      ? Object.keys(availableSections)
      : sections.filter((s) => availableSections[s]);

    for (const section of selectedSections) {
      console.error(`[REPORT-STATUS] Generating ${section} section...`);
      reportData[section] = await availableSections[section](modules);
    }

    // Generate report in requested format
    let reportContent;
    let fileExtension;

    switch (format) {
      case "markdown":
        reportContent = generateMarkdownReport(reportData);
        fileExtension = "md";
        break;

      case "json":
        reportContent = JSON.stringify(reportData, null, 2);
        fileExtension = "json";
        break;

      case "html":
        reportContent = generateHTMLReport(reportData);
        fileExtension = "html";
        break;

      case "text":
      default:
        reportContent = generateTextReport(reportData);
        fileExtension = "txt";
        break;
    }

    // Write report
    const filename = `${output}.${fileExtension}`;

    if (!dryRun) {
      await fs.writeFile(filename, reportContent);

      // Open report if requested
      if (open) {
        try {
          const openCmd =
            process.platform === "win32"
              ? "start"
              : process.platform === "darwin"
                ? "open"
                : "xdg-open";
          execSync(`${openCmd} ${filename}`, { stdio: "ignore" });
        } catch {
          // Ignore open errors
        }
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        sections: Object.keys(reportData),
        format,
        output: dryRun ? null : filename,
        metrics: {
          totalIssues: reportData.issues?.total || 0,
          testsPassing: reportData.tests?.passing || 0,
          coverage: reportData.tests?.coverage || 0,
        },
      },
      message: dryRun
        ? `Would generate ${format} report with ${Object.keys(reportData).length} sections`
        : `Generated ${format} report: ${filename}`,
    };
  } catch (error) {
    console.error("[REPORT-STATUS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to generate status report",
    };
  }
}

async function generateOverview() {
  const data = {
    timestamp: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
  };

  // Get project info
  try {
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    data.project = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      license: pkg.license,
    };
  } catch {
    data.project = null;
  }

  return data;
}

async function generateGitStatus() {
  const data = {};

  try {
    // Current branch
    data.branch = execSync("git branch --show-current", {
      encoding: "utf8",
    }).trim();

    // Last commit
    const lastCommit = execSync('git log -1 --format="%H|%ai|%an|%s"', {
      encoding: "utf8",
    }).trim();
    const [hash, date, author, subject] = lastCommit.split("|");
    data.lastCommit = {
      hash: hash.substring(0, 7),
      date,
      author,
      subject,
    };

    // Working tree status
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    const statusLines = status
      .trim()
      .split("\n")
      .filter((l) => l);
    data.changes = {
      total: statusLines.length,
      modified: statusLines.filter((l) => l.startsWith(" M")).length,
      added: statusLines.filter((l) => l.startsWith("??")).length,
      deleted: statusLines.filter((l) => l.startsWith(" D")).length,
    };

    // Remote status
    try {
      execSync("git fetch", { stdio: "ignore" });
      const ahead = execSync("git rev-list @{u}..HEAD --count", {
        encoding: "utf8",
      }).trim();
      const behind = execSync("git rev-list HEAD..@{u} --count", {
        encoding: "utf8",
      }).trim();
      data.remote = {
        ahead: parseInt(ahead),
        behind: parseInt(behind),
      };
    } catch {
      data.remote = null;
    }
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

async function generateCIStatus(modules) {
  const data = {};

  try {
    // Try to get CI status from module
    if (modules["ci:status"]) {
      const ciResult = await modules["ci:status"].run();
      if (ciResult.success) {
        return ciResult.data;
      }
    }

    // Fallback: check for common CI config files
    const ciFiles = {
      github: ".github/workflows",
      travis: ".travis.yml",
      circle: ".circleci/config.yml",
      jenkins: "Jenkinsfile",
      gitlab: ".gitlab-ci.yml",
    };

    data.configured = [];
    for (const [ci, file] of Object.entries(ciFiles)) {
      try {
        await fs.access(file);
        data.configured.push(ci);
      } catch {
        // Not configured
      }
    }
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

async function generateDependencyStatus() {
  const data = {};

  try {
    // Count dependencies
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    data.counts = {
      dependencies: Object.keys(pkg.dependencies || {}).length,
      devDependencies: Object.keys(pkg.devDependencies || {}).length,
      total:
        Object.keys(pkg.dependencies || {}).length +
        Object.keys(pkg.devDependencies || {}).length,
    };

    // Check for outdated
    try {
      const outdated = execSync("npm outdated --json || true", {
        encoding: "utf8",
      });
      if (outdated.trim()) {
        const outdatedData = JSON.parse(outdated);
        data.outdated = Object.keys(outdatedData).length;
      } else {
        data.outdated = 0;
      }
    } catch {
      data.outdated = null;
    }

    // Check for vulnerabilities
    try {
      const audit = execSync("npm audit --json || true", { encoding: "utf8" });
      if (audit.trim()) {
        const auditData = JSON.parse(audit);
        if (auditData.metadata) {
          data.vulnerabilities = auditData.metadata.vulnerabilities || {
            total: 0,
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
          };
        }
      }
    } catch {
      data.vulnerabilities = null;
    }
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

async function generateCodeMetrics() {
  const data = {};

  try {
    // Count files
    const jsFiles = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" | wc -l',
      {
        encoding: "utf8",
      },
    ).trim();

    data.files = {
      javascript: parseInt(jsFiles),
      total: parseInt(jsFiles),
    };

    // Count lines of code
    try {
      const locOutput = execSync(
        'find . -name "*.js" -not -path "./node_modules/*" -exec wc -l {} + | tail -1',
        { encoding: "utf8" },
      ).trim();

      const match = locOutput.match(/(\d+)/);
      if (match) {
        data.linesOfCode = parseInt(match[1]);
      }
    } catch {
      data.linesOfCode = null;
    }

    // Check for common patterns
    const patterns = {
      todos: "TODO",
      fixmes: "FIXME",
      consoleLogs: "console\\.log",
    };

    data.patterns = {};
    for (const [name, pattern] of Object.entries(patterns)) {
      try {
        const count = execSync(
          `grep -r "${pattern}" --include="*.js" --exclude-dir=node_modules . | wc -l`,
          { encoding: "utf8" },
        ).trim();
        data.patterns[name] = parseInt(count);
      } catch {
        data.patterns[name] = 0;
      }
    }
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

async function generateIssuesStatus(modules) {
  const data = {};

  try {
    // Try to use detect-issues module
    if (modules["detect-issues"]) {
      const issuesResult = await modules["detect-issues"].run({
        report: false,
        dryRun: true,
      });

      if (issuesResult.success) {
        return issuesResult.data;
      }
    }

    // Fallback: basic issue detection
    data.total = 0;
    data.byType = {};

    // Count TODOs and FIXMEs
    try {
      const todos = execSync(
        'grep -r "TODO" --include="*.js" --exclude-dir=node_modules . | wc -l',
        { encoding: "utf8" },
      ).trim();

      const fixmes = execSync(
        'grep -r "FIXME" --include="*.js" --exclude-dir=node_modules . | wc -l',
        { encoding: "utf8" },
      ).trim();

      data.byType.todos = parseInt(todos);
      data.byType.fixmes = parseInt(fixmes);
      data.total = data.byType.todos + data.byType.fixmes;
    } catch {
      // Ignore errors
    }
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

async function generateTestStatus() {
  const data = {};

  try {
    // Check for test files
    const testFiles = execSync(
      'find . -name "*.test.js" -o -name "*.spec.js" -not -path "./node_modules/*" | wc -l',
      { encoding: "utf8" },
    ).trim();

    data.files = parseInt(testFiles);

    // Try to run tests
    try {
      const testOutput = execSync("npm test -- --json 2>/dev/null || true", {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });

      if (testOutput.trim()) {
        const results = JSON.parse(testOutput);
        data.passing = results.numPassedTests || 0;
        data.failing = results.numFailedTests || 0;
        data.total = results.numTotalTests || 0;
        data.suites = results.numTotalTestSuites || 0;
      }
    } catch {
      // Tests not available or failed
      data.available = false;
    }

    // Check for coverage
    try {
      const coverageFile = "coverage/coverage-summary.json";
      const coverage = JSON.parse(await fs.readFile(coverageFile, "utf8"));

      data.coverage = {
        lines: coverage.total.lines.pct,
        functions: coverage.total.functions.pct,
        branches: coverage.total.branches.pct,
        statements: coverage.total.statements.pct,
      };
    } catch {
      data.coverage = null;
    }
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

async function generateDocStatus() {
  const data = {};

  try {
    // Check for documentation files
    const docs = {
      readme: false,
      contributing: false,
      license: false,
      changelog: false,
      codeOfConduct: false,
    };

    const docFiles = {
      readme: ["README.md", "readme.md", "README"],
      contributing: ["CONTRIBUTING.md", "contributing.md"],
      license: ["LICENSE", "LICENSE.md", "LICENSE.txt"],
      changelog: ["CHANGELOG.md", "changelog.md", "HISTORY.md"],
      codeOfConduct: ["CODE_OF_CONDUCT.md", "code_of_conduct.md"],
    };

    for (const [type, files] of Object.entries(docFiles)) {
      for (const file of files) {
        try {
          await fs.access(file);
          docs[type] = true;
          break;
        } catch {
          // File doesn't exist
        }
      }
    }

    data.files = docs;
    data.complete = Object.values(docs).filter((v) => v).length;
    data.total = Object.keys(docs).length;
    data.percentage = Math.round((data.complete / data.total) * 100);

    // Count markdown files
    try {
      const mdFiles = execSync(
        'find . -name "*.md" -not -path "./node_modules/*" | wc -l',
        {
          encoding: "utf8",
        },
      ).trim();
      data.markdownFiles = parseInt(mdFiles);
    } catch {
      data.markdownFiles = 0;
    }
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

async function generatePerformanceStatus() {
  const data = {};

  try {
    // Measure startup time
    const startTime = Date.now();
    execSync('node -e "console.log(1)"', { stdio: "ignore" });
    data.nodeStartup = Date.now() - startTime;

    // Check bundle size if build exists
    const buildDirs = ["dist", "build", ".next", "out"];
    for (const dir of buildDirs) {
      try {
        const size = execSync(`du -sk ${dir} | cut -f1`, {
          encoding: "utf8",
        }).trim();
        data.buildSize = {
          directory: dir,
          sizeKB: parseInt(size),
        };
        break;
      } catch {
        // Directory doesn't exist
      }
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    data.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    };
  } catch (error) {
    data.error = error.message;
  }

  return data;
}

function generateMarkdownReport(data) {
  let report = "# Project Status Report\n\n";

  // Overview
  if (data.overview) {
    report += "## 📊 Overview\n\n";
    report += `- **Generated**: ${data.overview.timestamp}\n`;
    if (data.overview.project) {
      report += `- **Project**: ${data.overview.project.name} v${data.overview.project.version}\n`;
      report += `- **Description**: ${data.overview.project.description}\n`;
    }
    report += `- **Environment**: Node ${data.overview.node} on ${data.overview.platform}\n\n`;
  }

  // Git Status
  if (data.git) {
    report += "## 🌿 Git Status\n\n";
    report += `- **Branch**: ${data.git.branch}\n`;
    if (data.git.lastCommit) {
      report += `- **Last Commit**: ${data.git.lastCommit.subject} (${data.git.lastCommit.hash})\n`;
    }
    if (data.git.changes) {
      report += `- **Changes**: ${data.git.changes.total} files (${data.git.changes.modified} modified, ${data.git.changes.added} added)\n`;
    }
    if (data.git.remote) {
      report += `- **Remote**: ${data.git.remote.ahead} ahead, ${data.git.remote.behind} behind\n`;
    }
    report += "\n";
  }

  // CI Status
  if (data.ci) {
    report += "## 🚀 CI/CD Status\n\n";
    if (data.ci.configured) {
      report += `- **Configured**: ${data.ci.configured.join(", ") || "None"}\n`;
    }
    report += "\n";
  }

  // Dependencies
  if (data.dependencies) {
    report += "## 📦 Dependencies\n\n";
    if (data.dependencies.counts) {
      report += `- **Total**: ${data.dependencies.counts.total} packages\n`;
      report += `- **Production**: ${data.dependencies.counts.dependencies}\n`;
      report += `- **Development**: ${data.dependencies.counts.devDependencies}\n`;
    }
    if (data.dependencies.outdated !== null) {
      report += `- **Outdated**: ${data.dependencies.outdated}\n`;
    }
    if (data.dependencies.vulnerabilities) {
      const vulns = data.dependencies.vulnerabilities;
      report += `- **Vulnerabilities**: ${vulns.total} total`;
      if (vulns.critical > 0) report += ` (${vulns.critical} critical)`;
      if (vulns.high > 0) report += ` (${vulns.high} high)`;
      report += "\n";
    }
    report += "\n";
  }

  // Code Metrics
  if (data.code) {
    report += "## 📈 Code Metrics\n\n";
    if (data.code.files) {
      report += `- **Files**: ${data.code.files.javascript} JavaScript files\n`;
    }
    if (data.code.linesOfCode) {
      report += `- **Lines of Code**: ${data.code.linesOfCode.toLocaleString()}\n`;
    }
    if (data.code.patterns) {
      report += `- **TODOs**: ${data.code.patterns.todos}\n`;
      report += `- **FIXMEs**: ${data.code.patterns.fixmes}\n`;
      report += `- **Console Logs**: ${data.code.patterns.consoleLogs}\n`;
    }
    report += "\n";
  }

  // Issues
  if (data.issues) {
    report += "## 🐛 Issues\n\n";
    report += `- **Total Issues**: ${data.issues.total || 0}\n`;
    if (data.issues.critical !== undefined) {
      report += `- **Critical**: ${data.issues.critical}\n`;
      report += `- **High**: ${data.issues.high}\n`;
      report += `- **Medium**: ${data.issues.medium}\n`;
      report += `- **Low**: ${data.issues.low}\n`;
    }
    report += "\n";
  }

  // Tests
  if (data.tests) {
    report += "## 🧪 Test Status\n\n";
    report += `- **Test Files**: ${data.tests.files}\n`;
    if (data.tests.total !== undefined) {
      report += `- **Tests**: ${data.tests.passing}/${data.tests.total} passing\n`;
      report += `- **Test Suites**: ${data.tests.suites}\n`;
    }
    if (data.tests.coverage) {
      report += `- **Coverage**: ${data.tests.coverage.statements}% statements\n`;
    }
    report += "\n";
  }

  // Documentation
  if (data.documentation) {
    report += "## 📚 Documentation\n\n";
    report += `- **Completeness**: ${data.documentation.percentage}% (${data.documentation.complete}/${data.documentation.total})\n`;
    if (data.documentation.files) {
      const files = data.documentation.files;
      report += `- **README**: ${files.readme ? "✅" : "❌"}\n`;
      report += `- **LICENSE**: ${files.license ? "✅" : "❌"}\n`;
      report += `- **CONTRIBUTING**: ${files.contributing ? "✅" : "❌"}\n`;
      report += `- **CHANGELOG**: ${files.changelog ? "✅" : "❌"}\n`;
    }
    report += `- **Markdown Files**: ${data.documentation.markdownFiles}\n\n`;
  }

  // Performance
  if (data.performance) {
    report += "## ⚡ Performance\n\n";
    if (data.performance.nodeStartup) {
      report += `- **Node Startup**: ${data.performance.nodeStartup}ms\n`;
    }
    if (data.performance.buildSize) {
      report += `- **Build Size**: ${data.performance.buildSize.sizeKB.toLocaleString()} KB (${data.performance.buildSize.directory})\n`;
    }
    if (data.performance.memory) {
      report += `- **Memory Usage**: ${data.performance.memory.heapUsed}MB / ${data.performance.memory.heapTotal}MB heap\n`;
    }
    report += "\n";
  }

  return report;
}

function generateHTMLReport(data) {
  const markdown = generateMarkdownReport(data);

  // Simple markdown to HTML conversion
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Project Status Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px; }
    h2 { color: #0366d6; margin-top: 30px; }
    ul { line-height: 1.6; }
    code { background: #f6f8fa; padding: 2px 5px; border-radius: 3px; }
  </style>
</head>
<body>
`;

  // Convert markdown to HTML (basic)
  html += markdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</ul>\n<ul>")
    .replace(/<ul>(?=<h)/g, "");

  html += "</ul></body></html>";

  return html;
}

function generateTextReport(data) {
  const markdown = generateMarkdownReport(data);

  // Convert markdown to plain text
  return markdown
    .replace(/^#+ /gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/✅/g, "[YES]")
    .replace(/❌/g, "[NO]")
    .replace(/^- /gm, "  * ");
}
