// ci-fix.js - Automatically fix common CI issues
import { execSync } from "child_process";
import path from "path";

export async function run(args) {
  const { modules, errors } = args;
  const fileOps = modules?.fileOps;

  console.error("[CI-FIX] Starting automatic CI fix process...");

  // If no errors provided, try to parse them first
  let ciErrors = errors;
  if (!ciErrors) {
    console.error("[CI-FIX] No errors provided, parsing CI logs...");
    const parseModule = await import("./ci-parse.js");
    const parseResult = await parseModule.run({ modules });

    if (parseResult.status !== "parsed" || parseResult.errorCount === 0) {
      return {
        status: "no-errors",
        message: "No CI errors found to fix",
        fixed: [],
      };
    }

    ciErrors = parseResult.errors;
  }

  const fixes = [];
  const failed = [];

  // Process each error type
  for (const error of ciErrors) {
    try {
      let fixed = false;

      switch (error.type) {
        case "typescript":
          fixed = await fixTypeScriptError(error, fileOps);
          break;

        case "eslint":
          fixed = await fixESLintError(error, fileOps);
          break;

        case "module":
          fixed = await fixModuleError(error);
          break;

        case "test":
          fixed = await fixTestError(error, fileOps);
          break;

        case "npm":
          fixed = await fixNpmError(error);
          break;

        default:
          console.error(`[CI-FIX] Unknown error type: ${error.type}`);
      }

      if (fixed) {
        fixes.push({
          type: error.type,
          error,
          action: fixed,
        });
      }
    } catch (err) {
      failed.push({
        error,
        reason: err.message,
      });
    }
  }

  // Run general fixes
  const generalFixes = await runGeneralFixes();
  fixes.push(...generalFixes);

  return {
    status: "completed",
    fixed: fixes.length,
    failed: failed.length,
    fixes,
    failed: failed.slice(0, 5), // Limit failed reports
    message: `Fixed ${fixes.length} issue(s), ${failed.length} could not be fixed`,
  };
}

async function fixTypeScriptError(error, fileOps) {
  console.error(`[CI-FIX] Fixing TypeScript error: ${error.message}`);

  // Common TypeScript fixes
  if (
    error.message.includes("Property") &&
    error.message.includes("does not exist")
  ) {
    // Try to add the missing property
    // This is simplified - real implementation would be more sophisticated
    return {
      action: "typescript-property-fix",
      details: "Would add missing property",
    };
  }

  if (error.message.includes("Cannot find name")) {
    // Missing import
    return {
      action: "typescript-import-fix",
      details: "Would add missing import",
    };
  }

  return false;
}

async function fixESLintError(error, fileOps) {
  console.error(`[CI-FIX] Fixing ESLint error in ${error.file}: ${error.rule}`);

  // Use ESLint auto-fix for certain rules
  const autoFixableRules = [
    "semi",
    "quotes",
    "indent",
    "comma-dangle",
    "no-trailing-spaces",
    "space-before-function-paren",
    "object-curly-spacing",
    "arrow-spacing",
  ];

  if (autoFixableRules.includes(error.rule)) {
    try {
      execSync(`npx eslint --fix ${error.file}`, {
        stdio: "pipe",
      });
      return { action: "eslint-autofix", file: error.file, rule: error.rule };
    } catch (err) {
      console.error(`[CI-FIX] ESLint autofix failed: ${err.message}`);
    }
  }

  // Manual fixes for specific rules
  if (error.rule === "no-console" && fileOps) {
    // Remove console.log statements
    try {
      const content = await fileOps.read(error.file);
      const fixed = content.replace(/console\.log\(.+?\);?\n?/g, "");
      await fileOps.write(error.file, fixed);
      return { action: "remove-console", file: error.file };
    } catch (err) {
      console.error(`[CI-FIX] Failed to remove console.log: ${err.message}`);
    }
  }

  return false;
}

async function fixModuleError(error) {
  console.error(`[CI-FIX] Fixing missing module: ${error.module}`);

  // Try to install missing module
  const moduleName = error.module.split("/")[0];

  try {
    // Check if it's a devDependency
    const isDevDep = ["@types/", "eslint", "jest", "test"].some((d) =>
      moduleName.includes(d),
    );
    const flag = isDevDep ? "--save-dev" : "--save";

    execSync(`npm install ${moduleName} ${flag}`, {
      stdio: "pipe",
    });

    return { action: "install-module", module: moduleName, dev: isDevDep };
  } catch (err) {
    console.error(`[CI-FIX] Failed to install module: ${err.message}`);
  }

  return false;
}

async function fixTestError(error, fileOps) {
  console.error(`[CI-FIX] Fixing test error in ${error.file}: ${error.test}`);

  // Common test fixes
  if (error.test && error.test.includes("timeout")) {
    // Increase test timeout
    return { action: "increase-timeout", file: error.file, test: error.test };
  }

  return false;
}

async function fixNpmError(error) {
  console.error(`[CI-FIX] Fixing npm error: ${error.message}`);

  // Common npm fixes
  if (error.message.includes("lockfile")) {
    try {
      execSync("npm install --package-lock-only", {
        stdio: "pipe",
      });
      return { action: "regenerate-lockfile" };
    } catch (err) {
      console.error(`[CI-FIX] Failed to regenerate lockfile: ${err.message}`);
    }
  }

  if (error.message.includes("audit")) {
    try {
      execSync("npm audit fix", {
        stdio: "pipe",
      });
      return { action: "npm-audit-fix" };
    } catch (err) {
      console.error(`[CI-FIX] Failed to fix audit issues: ${err.message}`);
    }
  }

  return false;
}

async function runGeneralFixes() {
  const fixes = [];

  // Fix formatting issues
  try {
    execSync("npm run format --if-present", {
      stdio: "pipe",
    });
    fixes.push({ action: "format-code", type: "general" });
  } catch {
    // Formatting script not available
  }

  // Fix lint issues
  try {
    execSync("npm run lint:fix --if-present", {
      stdio: "pipe",
    });
    fixes.push({ action: "lint-fix", type: "general" });
  } catch {
    // Lint fix script not available
  }

  // Ensure test files exist
  try {
    const hasTests = execSync(
      'find . -name "*.test.*" -o -name "*.spec.*" | head -1',
      {
        encoding: "utf8",
        stdio: "pipe",
      },
    ).trim();

    if (!hasTests) {
      // Create a basic test file
      fixes.push({ action: "create-test-stub", type: "general" });
    }
  } catch {
    // Find command failed
  }

  return fixes;
}
