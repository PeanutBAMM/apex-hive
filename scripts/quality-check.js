// quality-check.js - Run all quality checks and report status
import { execSync } from "child_process";

export async function run(args = {}) {
  const { fix = false, verbose = false, dryRun = false, modules = {} } = args;

  console.error("[QUALITY-CHECK] Running comprehensive quality checks...");

  const checks = [];
  let hasIssues = false;

  try {
    // 1. Run validation first
    console.error("[QUALITY-CHECK] Validating code quality...");
    const validateModule = await import("./quality-validate.js");
    const validateResult = await validateModule.run({ modules });

    checks.push({
      name: "Validation",
      success: validateResult.valid,
      details: validateResult.data,
    });

    if (!validateResult.valid) {
      hasIssues = true;
    }

    // 2. Check ESLint
    console.error("[QUALITY-CHECK] Checking ESLint...");
    const lintModule = await import("./quality-lint.js");
    const lintResult = await lintModule.run({ dryRun: true, modules });

    checks.push({
      name: "ESLint",
      success: lintResult.success && lintResult.data?.errors === 0,
      errors: lintResult.data?.errors || 0,
      warnings: lintResult.data?.warnings || 0,
    });

    if (lintResult.data?.errors > 0) {
      hasIssues = true;
    }

    // 3. Check formatting
    console.error("[QUALITY-CHECK] Checking code formatting...");
    const formatModule = await import("./quality-format.js");
    const formatResult = await formatModule.run({ check: true, modules });

    checks.push({
      name: "Formatting",
      success: !formatResult.data?.needsFormatting,
      needsFormatting: formatResult.data?.needsFormatting || false,
      files: formatResult.data?.files?.length || 0,
    });

    if (formatResult.data?.needsFormatting) {
      hasIssues = true;
    }

    // 4. Check console.log
    console.error("[QUALITY-CHECK] Checking for console.log...");
    const consoleModule = await import("./quality-console-clean.js");
    const consoleResult = await consoleModule.run({ dryRun: true, modules });

    checks.push({
      name: "Console.log",
      success: consoleResult.data?.removed === 0,
      found: consoleResult.data?.removed || 0,
    });

    if (consoleResult.data?.removed > 0) {
      hasIssues = true;
    }

    // 5. Check versions
    console.error("[QUALITY-CHECK] Checking package versions...");
    const versionModule = await import("./quality-fix-versions.js");
    const versionResult = await versionModule.run({ dryRun: true, modules });

    checks.push({
      name: "Versions",
      success: versionResult.data?.issues === 0,
      issues: versionResult.data?.issues || 0,
    });

    if (versionResult.data?.issues > 0) {
      hasIssues = true;
    }

    // 6. Test suite status
    console.error("[QUALITY-CHECK] Checking test suite...");
    try {
      execSync("npm test", { stdio: "ignore" });
      checks.push({
        name: "Tests",
        success: true,
        message: "All tests passing",
      });
    } catch {
      checks.push({
        name: "Tests",
        success: false,
        message: "Some tests failing",
      });
      hasIssues = true;
    }

    // Generate summary
    const summary = {
      totalChecks: checks.length,
      passed: checks.filter((c) => c.success).length,
      failed: checks.filter((c) => !c.success).length,
      hasIssues,
    };

    // If fix mode and has issues
    if (fix && hasIssues && !dryRun) {
      console.error("[QUALITY-CHECK] Running auto-fix...");
      const fixAllModule = await import("./quality-fix-all.js");
      const fixResult = await fixAllModule.run({ modules });

      return {
        success: true,
        data: {
          checks,
          summary,
          fixes: fixResult.data,
        },
        message: `Fixed ${fixResult.data?.totalFixed || 0} issues automatically`,
      };
    }

    // Verbose output
    if (verbose) {
      console.error("\n[QUALITY-CHECK] Detailed Results:");
      for (const check of checks) {
        const status = check.success ? "✅" : "❌";
        console.error(`${status} ${check.name}`);
        if (!check.success) {
          console.error(`   ${JSON.stringify(check, null, 2)}`);
        }
      }
    }

    return {
      success: true,
      data: {
        checks,
        summary,
      },
      message: hasIssues
        ? `Quality issues found: ${summary.failed} checks failed`
        : "All quality checks passed!",
    };
  } catch (error) {
    console.error("[QUALITY-CHECK] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to run quality checks",
    };
  }
}
