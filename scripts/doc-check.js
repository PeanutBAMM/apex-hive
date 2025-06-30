// doc-check.js - Quick documentation health check
import { promises as fs } from "fs";
import path from "path";

export async function run(args) {
  const { modules } = args;

  console.error("[DOC-CHECK] Running documentation health check...");

  try {
    const checks = [];

    // Check 1: README.md exists
    checks.push(await checkFile("README.md", "Project README"));

    // Check 2: CHANGELOG.md exists
    checks.push(await checkFile("CHANGELOG.md", "Changelog"));

    // Check 3: docs directory
    checks.push(await checkDirectory("docs", "Documentation directory"));

    // Check 4: Key documentation files
    const keyDocs = [
      { path: "docs/getting-started.md", name: "Getting Started guide" },
      { path: "docs/api.md", name: "API documentation" },
      { path: "docs/contributing.md", name: "Contributing guide" },
    ];

    for (const doc of keyDocs) {
      checks.push(await checkFile(doc.path, doc.name, false));
    }

    // Check 5: Run quick validation
    const validateModule = await import("./doc-validate.js");
    const validation = await validateModule.run({
      target: "all",
      strict: false,
      modules,
    });

    checks.push({
      name: "Documentation validation",
      status: validation.count === 0 ? "pass" : "warning",
      message:
        validation.count === 0
          ? "No validation issues"
          : `${validation.count} validation issue(s)`,
    });

    // Summary
    const passed = checks.filter((c) => c.status === "pass").length;
    const failed = checks.filter((c) => c.status === "fail").length;
    const warnings = checks.filter((c) => c.status === "warning").length;

    return {
      status:
        failed > 0 ? "unhealthy" : warnings > 0 ? "needs-attention" : "healthy",
      checks,
      summary: {
        total: checks.length,
        passed,
        failed,
        warnings,
      },
      message:
        failed > 0
          ? `❌ Documentation needs work: ${failed} check(s) failed`
          : warnings > 0
            ? `⚠️ Documentation mostly healthy: ${warnings} warning(s)`
            : "✅ Documentation is healthy!",
    };
  } catch (error) {
    console.error("[DOC-CHECK] Error:", error.message);
    return {
      status: "error",
      message: "Failed to check documentation",
      error: error.message,
    };
  }
}

async function checkFile(filePath, name, required = true) {
  try {
    const stat = await fs.stat(filePath);
    const sizeKB = Math.round(stat.size / 1024);

    return {
      name,
      status: "pass",
      message: `Exists (${sizeKB}KB)`,
    };
  } catch {
    return {
      name,
      status: required ? "fail" : "warning",
      message: required ? "Missing (required)" : "Missing (recommended)",
    };
  }
}

async function checkDirectory(dirPath, name) {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return {
        name,
        status: "fail",
        message: "Exists but is not a directory",
      };
    }

    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter((f) => f.endsWith(".md")).length;

    return {
      name,
      status: mdFiles > 0 ? "pass" : "warning",
      message:
        mdFiles > 0
          ? `Contains ${mdFiles} markdown file(s)`
          : "Empty directory",
    };
  } catch {
    return {
      name,
      status: "warning",
      message: "Missing",
    };
  }
}
