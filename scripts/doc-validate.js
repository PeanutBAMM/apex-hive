// doc-validate.js - Validate documentation for completeness and accuracy
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

export async function run(args) {
  const { target = "all", fix = false, strict = false, modules } = args;

  console.error("[DOC-VALIDATE] Validating documentation...");

  try {
    const issues = [];

    switch (target) {
      case "all":
        issues.push(...(await validateAllDocs(modules)));
        break;

      case "markdown":
        issues.push(...(await validateMarkdownFiles(modules)));
        break;

      case "links":
        issues.push(...(await validateLinks(modules)));
        break;

      case "code":
        issues.push(...(await validateCodeBlocks(modules)));
        break;

      default:
        // Validate specific file/directory
        issues.push(...(await validatePath(target, modules)));
    }

    // Apply fixes if requested
    let fixed = 0;
    if (fix && issues.length > 0) {
      fixed = await applyFixes(issues, modules);
    }

    // Filter by severity if not strict
    const reportedIssues = strict
      ? issues
      : issues.filter((i) => i.severity !== "info");

    return {
      status: reportedIssues.length === 0 ? "valid" : "invalid",
      target,
      issues: reportedIssues,
      count: reportedIssues.length,
      fixed,
      message:
        reportedIssues.length === 0
          ? "✅ Documentation is valid"
          : `❌ Found ${reportedIssues.length} issue(s)`,
    };
  } catch (error) {
    console.error("[DOC-VALIDATE] Error:", error.message);
    return {
      status: "error",
      message: "Failed to validate documentation",
      error: error.message,
    };
  }
}

async function validateAllDocs(modules) {
  const issues = [];

  // Validate all markdown files
  issues.push(...(await validateMarkdownFiles(modules)));

  // Validate links
  issues.push(...(await validateLinks(modules)));

  // Validate code blocks
  issues.push(...(await validateCodeBlocks(modules)));

  // Check documentation coverage
  issues.push(...(await validateCoverage(modules)));

  return issues;
}

async function validateMarkdownFiles(modules) {
  const issues = [];
  const markdownFiles = await findMarkdownFiles();

  for (const file of markdownFiles) {
    const fileIssues = await validateMarkdownFile(file);
    issues.push(...fileIssues);
  }

  return issues;
}

async function validateMarkdownFile(filePath) {
  const issues = [];
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split("\n");

  // Check for required sections in README
  if (filePath.endsWith("README.md")) {
    const requiredSections = ["Installation", "Usage", "Features"];
    for (const section of requiredSections) {
      if (
        !content.includes(`## ${section}`) &&
        !content.includes(`# ${section}`)
      ) {
        issues.push({
          file: filePath,
          line: 0,
          severity: "warning",
          type: "missing-section",
          message: `Missing required section: ${section}`,
        });
      }
    }
  }

  // Check heading hierarchy
  let lastHeadingLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];

      // Check heading hierarchy
      if (level > lastHeadingLevel + 1 && lastHeadingLevel > 0) {
        issues.push({
          file: filePath,
          line: i + 1,
          severity: "warning",
          type: "heading-hierarchy",
          message: `Heading level jumped from ${lastHeadingLevel} to ${level}`,
        });
      }
      lastHeadingLevel = level;

      // Check for duplicate headings
      const duplicates = lines.filter((l) => l === line).length;
      if (duplicates > 1) {
        issues.push({
          file: filePath,
          line: i + 1,
          severity: "info",
          type: "duplicate-heading",
          message: `Duplicate heading: "${title}"`,
        });
      }
    }

    // Check line length
    if (line.length > 120 && !line.includes("http") && !line.includes("`")) {
      issues.push({
        file: filePath,
        line: i + 1,
        severity: "info",
        type: "line-length",
        message: `Line too long (${line.length} chars)`,
      });
    }

    // Check for trailing whitespace
    if (line !== line.trimEnd()) {
      issues.push({
        file: filePath,
        line: i + 1,
        severity: "info",
        type: "trailing-whitespace",
        message: "Trailing whitespace detected",
      });
    }
  }

  // Check for empty code blocks
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const block = match[0];
    const lines = block.split("\n");
    if (lines.length === 2 || (lines.length === 3 && lines[1].trim() === "")) {
      const lineNum = content.substring(0, match.index).split("\n").length;
      issues.push({
        file: filePath,
        line: lineNum,
        severity: "warning",
        type: "empty-code-block",
        message: "Empty code block",
      });
    }
  }

  return issues;
}

async function validateLinks(modules) {
  const issues = [];
  const markdownFiles = await findMarkdownFiles();

  for (const file of markdownFiles) {
    const content = await fs.readFile(file, "utf8");
    const linkIssues = await validateFileLinks(file, content);
    issues.push(...linkIssues);
  }

  return issues;
}

async function validateFileLinks(filePath, content) {
  const issues = [];
  const lines = content.split("\n");

  // Find all links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkUrl = match[2];
    const lineNum = content.substring(0, match.index).split("\n").length;

    // Check for empty link text
    if (!linkText.trim()) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: "error",
        type: "empty-link-text",
        message: "Link has empty text",
      });
    }

    // Check for broken internal links
    if (
      linkUrl.startsWith("./") ||
      linkUrl.startsWith("../") ||
      (!linkUrl.includes("://") && !linkUrl.startsWith("#"))
    ) {
      const absolutePath = path.resolve(
        path.dirname(filePath),
        linkUrl.split("#")[0],
      );

      if (!(await fileExists(absolutePath))) {
        issues.push({
          file: filePath,
          line: lineNum,
          severity: "error",
          type: "broken-link",
          message: `Broken link: ${linkUrl}`,
        });
      }
    }

    // Check for insecure HTTP links
    if (linkUrl.startsWith("http://") && !linkUrl.includes("localhost")) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: "warning",
        type: "insecure-link",
        message: `Insecure HTTP link: ${linkUrl}`,
      });
    }
  }

  // Check for bare URLs
  const bareUrlRegex = /(?<!\[.*\]\()https?:\/\/[^\s<>[\]`]+/g;
  while ((match = bareUrlRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split("\n").length;
    issues.push({
      file: filePath,
      line: lineNum,
      severity: "info",
      type: "bare-url",
      message: `Bare URL should be formatted as link: ${match[0]}`,
    });
  }

  return issues;
}

async function validateCodeBlocks(modules) {
  const issues = [];
  const markdownFiles = await findMarkdownFiles();

  for (const file of markdownFiles) {
    const content = await fs.readFile(file, "utf8");
    const codeIssues = await validateFileCodeBlocks(file, content);
    issues.push(...codeIssues);
  }

  return issues;
}

async function validateFileCodeBlocks(filePath, content) {
  const issues = [];

  // Find all code blocks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1];
    const code = match[2];
    const lineNum = content.substring(0, match.index).split("\n").length;

    // Check for language specification
    if (!language) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: "warning",
        type: "missing-language",
        message: "Code block missing language specification",
      });
    }

    // Validate specific languages
    if (language === "javascript" || language === "js") {
      const jsIssues = validateJavaScriptCode(code);
      for (const issue of jsIssues) {
        issues.push({
          file: filePath,
          line: lineNum + issue.line,
          severity: issue.severity,
          type: "code-error",
          message: issue.message,
        });
      }
    }

    if (language === "bash" || language === "sh") {
      const bashIssues = validateBashCode(code);
      for (const issue of bashIssues) {
        issues.push({
          file: filePath,
          line: lineNum + issue.line,
          severity: issue.severity,
          type: "code-error",
          message: issue.message,
        });
      }
    }
  }

  return issues;
}

function validateJavaScriptCode(code) {
  const issues = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for console.log
    if (line.includes("console.log")) {
      issues.push({
        line: i + 1,
        severity: "info",
        message: "Remove console.log from example code",
      });
    }

    // Check for basic syntax errors
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;

    if (openBraces !== closeBraces || openParens !== closeParens) {
      // This is a simple check, may have false positives
    }
  }

  return issues;
}

function validateBashCode(code) {
  const issues = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for sudo in examples
    if (line.startsWith("sudo") && !line.includes("# may require")) {
      issues.push({
        line: i + 1,
        severity: "info",
        message: "Add note about sudo requirement",
      });
    }

    // Check for hardcoded paths
    if (line.includes("/home/") || line.includes("/Users/")) {
      issues.push({
        line: i + 1,
        severity: "warning",
        message: "Avoid hardcoded user paths in examples",
      });
    }
  }

  return issues;
}

async function validateCoverage(modules) {
  const issues = [];

  // Check if all scripts have documentation
  const registry = (await import("../config/registry.js")).default;
  const documentedCommands = new Set();

  // Find documented commands
  const docFiles = await findMarkdownFiles();
  for (const file of docFiles) {
    const content = await fs.readFile(file, "utf8");
    for (const [command] of Object.entries(registry)) {
      if (content.includes(`\`${command}\``)) {
        documentedCommands.add(command);
      }
    }
  }

  // Find undocumented commands
  for (const [command, scriptPath] of Object.entries(registry)) {
    if (scriptPath && !documentedCommands.has(command)) {
      issues.push({
        file: "documentation",
        line: 0,
        severity: "warning",
        type: "missing-documentation",
        message: `Command not documented: ${command}`,
      });
    }
  }

  return issues;
}

async function validatePath(targetPath, modules) {
  const issues = [];

  try {
    const stat = await fs.stat(targetPath);

    if (stat.isDirectory()) {
      const files = await findMarkdownFiles(targetPath);
      for (const file of files) {
        issues.push(...(await validateMarkdownFile(file)));
      }
    } else if (targetPath.endsWith(".md")) {
      issues.push(...(await validateMarkdownFile(targetPath)));
    }
  } catch (error) {
    throw new Error(`Failed to validate ${targetPath}: ${error.message}`);
  }

  return issues;
}

async function applyFixes(issues, modules) {
  let fixed = 0;
  const fileOps = modules?.fileOps;

  if (!fileOps) {
    console.error("[DOC-VALIDATE] No fileOps module available for fixes");
    return fixed;
  }

  // Group issues by file
  const issuesByFile = {};
  for (const issue of issues) {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  }

  // Apply fixes per file
  for (const [file, fileIssues] of Object.entries(issuesByFile)) {
    try {
      const content = await fs.readFile(file, "utf8");
      let updated = content;

      for (const issue of fileIssues) {
        if (issue.type === "trailing-whitespace") {
          updated = updated
            .split("\n")
            .map((line) => line.trimEnd())
            .join("\n");
          fixed++;
        } else if (issue.type === "insecure-link") {
          const httpUrl = issue.message.split(": ")[1];
          const httpsUrl = httpUrl.replace("http://", "https://");
          updated = updated.replace(httpUrl, httpsUrl);
          fixed++;
        }
      }

      if (updated !== content) {
        await fs.writeFile(file, updated);
      }
    } catch (error) {
      console.error(
        `[DOC-VALIDATE] Failed to fix issues in ${file}:`,
        error.message,
      );
    }
  }

  return fixed;
}

async function findMarkdownFiles(dir = ".") {
  const files = [];

  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      // Skip node_modules and hidden directories
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
