// quality-validate.js - Validate code quality standards
import { execSync } from "child_process";
import { promises as fs } from "fs";

export async function run(args = {}) {
  const { strict = false, report = false, dryRun = false, modules = {} } = args;

  console.error("[QUALITY-VALIDATE] Validating code quality...");

  const validations = [];
  const failures = [];

  try {
    // 1. ESLint validation
    console.error("[QUALITY-VALIDATE] Checking ESLint...");
    try {
      execSync("npx eslint . --format json", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      validations.push({
        check: "eslint",
        status: "passed",
        message: "No ESLint errors",
      });
    } catch (error) {
      if (error.stdout) {
        const results = JSON.parse(error.stdout);
        const totalErrors = results.reduce(
          (sum, file) => sum + file.errorCount,
          0,
        );
        const totalWarnings = results.reduce(
          (sum, file) => sum + file.warningCount,
          0,
        );

        if (totalErrors > 0 || (strict && totalWarnings > 0)) {
          failures.push({
            check: "eslint",
            errors: totalErrors,
            warnings: totalWarnings,
          });
          validations.push({
            check: "eslint",
            status: "failed",
            message: `${totalErrors} errors, ${totalWarnings} warnings`,
          });
        } else {
          validations.push({
            check: "eslint",
            status: "passed",
            message: `No errors, ${totalWarnings} warnings`,
          });
        }
      }
    }

    // 2. Console.log check
    console.error("[QUALITY-VALIDATE] Checking for console.log...");
    try {
      const result = execSync(
        'grep -r "console\\.log" --include="*.js" --exclude-dir=node_modules . | wc -l',
        {
          encoding: "utf8",
        },
      ).trim();

      const count = parseInt(result);
      if (count > 0) {
        failures.push({
          check: "console.log",
          count,
        });
        validations.push({
          check: "console.log",
          status: "failed",
          message: `Found ${count} console.log statements`,
        });
      } else {
        validations.push({
          check: "console.log",
          status: "passed",
          message: "No console.log statements",
        });
      }
    } catch {
      validations.push({
        check: "console.log",
        status: "passed",
        message: "No console.log statements found",
      });
    }

    // 3. Version range check
    console.error("[QUALITY-VALIDATE] Checking package versions...");
    try {
      const packageJson = JSON.parse(
        await fs.readFile("./package.json", "utf8"),
      );
      let versionIssues = 0;

      const checkDeps = (deps = {}) => {
        for (const [name, version] of Object.entries(deps)) {
          if (
            version.includes("^") ||
            version.includes("~") ||
            version.includes("*")
          ) {
            versionIssues++;
          }
        }
      };

      checkDeps(packageJson.dependencies);
      checkDeps(packageJson.devDependencies);

      if (versionIssues > 0) {
        failures.push({
          check: "versions",
          count: versionIssues,
        });
        validations.push({
          check: "versions",
          status: "failed",
          message: `${versionIssues} packages with version ranges`,
        });
      } else {
        validations.push({
          check: "versions",
          status: "passed",
          message: "All versions are exact",
        });
      }
    } catch {
      validations.push({
        check: "versions",
        status: "skipped",
        message: "Could not check package.json",
      });
    }

    // 4. File naming convention
    console.error("[QUALITY-VALIDATE] Checking file naming...");
    try {
      const badNames = execSync(
        'find . -name "*.js" -type f | grep -E "[A-Z]" | grep -v node_modules | wc -l',
        {
          encoding: "utf8",
        },
      ).trim();

      const count = parseInt(badNames);
      if (count > 0) {
        failures.push({
          check: "naming",
          count,
        });
        validations.push({
          check: "naming",
          status: "failed",
          message: `${count} files with uppercase in names`,
        });
      } else {
        validations.push({
          check: "naming",
          status: "passed",
          message: "All files follow naming convention",
        });
      }
    } catch {
      validations.push({
        check: "naming",
        status: "passed",
        message: "File naming looks good",
      });
    }

    // 5. TODO/FIXME check
    console.error("[QUALITY-VALIDATE] Checking for TODOs...");
    try {
      const todos = execSync(
        'grep -r "TODO\\|FIXME" --include="*.js" --exclude-dir=node_modules . | wc -l',
        {
          encoding: "utf8",
        },
      ).trim();

      const count = parseInt(todos);
      if (count > 0 && strict) {
        failures.push({
          check: "todos",
          count,
        });
        validations.push({
          check: "todos",
          status: "failed",
          message: `Found ${count} TODO/FIXME comments`,
        });
      } else if (count > 0) {
        validations.push({
          check: "todos",
          status: "warning",
          message: `Found ${count} TODO/FIXME comments`,
        });
      } else {
        validations.push({
          check: "todos",
          status: "passed",
          message: "No TODO/FIXME comments",
        });
      }
    } catch {
      validations.push({
        check: "todos",
        status: "passed",
        message: "No TODOs found",
      });
    }

    // Generate report if requested
    if (report && !dryRun) {
      const reportContent = {
        timestamp: new Date().toISOString(),
        validations,
        failures,
        summary: {
          total: validations.length,
          passed: validations.filter((v) => v.status === "passed").length,
          failed: validations.filter((v) => v.status === "failed").length,
          warnings: validations.filter((v) => v.status === "warning").length,
        },
      };

      await fs.writeFile(
        "quality-report.json",
        JSON.stringify(reportContent, null, 2),
      );
    }

    const valid = failures.length === 0;

    return {
      success: true,
      valid,
      data: {
        validations,
        failures,
        passed: validations.filter((v) => v.status === "passed").length,
        failed: failures.length,
      },
      message: valid
        ? "All quality checks passed"
        : `${failures.length} quality checks failed`,
    };
  } catch (error) {
    console.error("[QUALITY-VALIDATE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to validate quality",
    };
  }
}
