// quality-lint.js - Run ESLint on the codebase
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    fix = false,
    strict = false,
    report = false,
    pattern = "**/*.js",
    dryRun = false,
    modules = {},
  } = args;

  console.error("[QUALITY-LINT] Running ESLint checks...");

  // Handle dry run
  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      wouldRun: `eslint ${pattern} ${fix ? "--fix" : ""} ${strict ? "--max-warnings 0" : ""}`,
      message: "Would run ESLint checks",
    };
  }

  try {
    // Build ESLint command
    const eslintArgs = [pattern];

    if (fix) {
      eslintArgs.push("--fix");
    }

    if (strict) {
      eslintArgs.push("--max-warnings", "0");
    }

    if (report) {
      eslintArgs.push(
        "--format",
        "html",
        "--output-file",
        "eslint-report.html",
      );
    } else {
      eslintArgs.push("--format", "compact");
    }

    // Run ESLint
    let output = "";
    let exitCode = 0;

    try {
      output = execSync(`npx eslint ${eslintArgs.join(" ")}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error) {
      output = error.stdout || "";
      exitCode = error.status || 1;

      // ESLint returns non-zero for warnings/errors
      if (exitCode === 1 || (exitCode === 2 && strict)) {
        // This is expected when there are issues
      } else {
        throw error;
      }
    }

    // Parse output
    const lines = output.split("\n").filter((line) => line.trim());
    const errors = [];
    const warnings = [];
    let fixedCount = 0;

    for (const line of lines) {
      if (line.includes("error")) {
        const match = line.match(/(.+):\s*(\d+):(\d+)\s+error\s+(.+?)\s+(.+)/);
        if (match) {
          errors.push({
            file: match[1].trim(),
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[4],
            rule: match[5],
          });
        }
      } else if (line.includes("warning")) {
        const match = line.match(
          /(.+):\s*(\d+):(\d+)\s+warning\s+(.+?)\s+(.+)/,
        );
        if (match) {
          warnings.push({
            file: match[1].trim(),
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            message: match[4],
            rule: match[5],
          });
        }
      }
    }

    // Check if any files were fixed
    if (fix) {
      try {
        const gitStatus = execSync("git status --porcelain", {
          encoding: "utf8",
        });
        const modifiedFiles = gitStatus
          .split("\n")
          .filter((line) => line.startsWith(" M "))
          .map((line) => line.substring(3));

        fixedCount = modifiedFiles.filter((file) =>
          file.endsWith(".js"),
        ).length;
      } catch {
        // Git not available
      }
    }

    // Generate summary
    const success = errors.length === 0 && (!strict || warnings.length === 0);

    const result = {
      success,
      data: {
        errors: errors.length,
        warnings: warnings.length,
        fixed: fixedCount,
        errorDetails: errors.slice(0, 10), // Limit to first 10
        warningDetails: warnings.slice(0, 10),
      },
      message: success
        ? "No linting issues found"
        : `Found ${errors.length} errors and ${warnings.length} warnings`,
    };

    if (report) {
      result.data.reportPath = "eslint-report.html";
      result.message += " - Report saved to eslint-report.html";
    }

    return result;
  } catch (error) {
    console.error("[QUALITY-LINT] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to run ESLint",
    };
  }
}
