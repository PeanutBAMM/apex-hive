// quality-fix-all.js - Fix all quality issues (lint, console.log, versions, etc.)
import { execSync } from "child_process";

export async function run(args = {}) {
  const { commit = false, dryRun = false, modules = {} } = args;

  console.error("[QUALITY-FIX-ALL] Starting comprehensive quality fixes...");

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      wouldFix: [
        "ESLint issues",
        "Console.log statements",
        "Version mismatches",
        "Code formatting",
      ],
      message: "Would fix all quality issues",
    };
  }

  const fixes = [];
  const errors = [];

  try {
    // 1. Fix ESLint issues
    console.error("[QUALITY-FIX-ALL] Fixing ESLint issues...");
    try {
      const lintModule = await import("./quality-lint.js");
      const lintResult = await lintModule.run({ fix: true, modules });

      if (lintResult.data?.fixed > 0) {
        fixes.push({
          type: "lint",
          fixed: lintResult.data.fixed,
          message: `Fixed ${lintResult.data.fixed} ESLint issues`,
        });
      }
    } catch (error) {
      errors.push({ type: "lint", error: error.message });
    }

    // 2. Remove console.log statements
    console.error("[QUALITY-FIX-ALL] Removing console.log statements...");
    try {
      const consoleModule = await import("./quality-console-clean.js");
      const consoleResult = await consoleModule.run({ modules });

      if (consoleResult.data?.removed > 0) {
        fixes.push({
          type: "console",
          fixed: consoleResult.data.removed,
          message: `Removed ${consoleResult.data.removed} console.log statements`,
        });
      }
    } catch (error) {
      errors.push({ type: "console", error: error.message });
    }

    // 3. Fix version issues
    console.error("[QUALITY-FIX-ALL] Fixing version issues...");
    try {
      const versionModule = await import("./quality-fix-versions.js");
      const versionResult = await versionModule.run({ modules });

      if (versionResult.data?.fixed > 0) {
        fixes.push({
          type: "versions",
          fixed: versionResult.data.fixed,
          message: `Fixed ${versionResult.data.fixed} version issues`,
        });
      }
    } catch (error) {
      errors.push({ type: "versions", error: error.message });
    }

    // 4. Format code
    console.error("[QUALITY-FIX-ALL] Formatting code...");
    try {
      const formatModule = await import("./quality-format.js");
      const formatResult = await formatModule.run({ modules });

      if (formatResult.data?.formatted > 0) {
        fixes.push({
          type: "format",
          fixed: formatResult.data.formatted,
          message: `Formatted ${formatResult.data.formatted} files`,
        });
      }
    } catch (error) {
      errors.push({ type: "format", error: error.message });
    }

    // 5. Validate after fixes
    console.error("[QUALITY-FIX-ALL] Validating fixes...");
    try {
      const validateModule = await import("./quality-validate.js");
      const validateResult = await validateModule.run({ modules });

      if (!validateResult.success) {
        errors.push({
          type: "validation",
          error: "Some quality issues remain after fixes",
        });
      }
    } catch (error) {
      errors.push({ type: "validation", error: error.message });
    }

    // Commit if requested and there are fixes
    if (commit && fixes.length > 0) {
      try {
        execSync("git add -A", { stdio: "pipe" });
        const commitMessage = `fix: Quality improvements\n\n${fixes.map((f) => `- ${f.message}`).join("\n")}`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: "pipe" });

        fixes.push({
          type: "commit",
          message: "Changes committed",
        });
      } catch (error) {
        errors.push({ type: "commit", error: error.message });
      }
    }

    const totalFixed = fixes.reduce((sum, f) => sum + (f.fixed || 0), 0);

    return {
      success: errors.length === 0,
      data: {
        fixes,
        errors,
        totalFixed,
      },
      message:
        totalFixed > 0
          ? `Fixed ${totalFixed} quality issues`
          : "No quality issues found to fix",
    };
  } catch (error) {
    console.error("[QUALITY-FIX-ALL] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to fix quality issues",
    };
  }
}
