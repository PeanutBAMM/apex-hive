// test-runner.js - Smart test runner with multiple framework support
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args) {
  const {
    pattern = "**/*.test.*",
    watch = false,
    coverage = false,
    modules,
  } = args;

  console.error("[TEST-RUNNER] Starting test execution...");

  try {
    // Detect test framework
    const framework = await detectTestFramework();

    if (!framework) {
      return {
        status: "no-framework",
        message: "No test framework detected. Install jest, mocha, or vitest.",
        passed: 0,
        failed: 0,
        total: 0,
      };
    }

    console.error(`[TEST-RUNNER] Using ${framework} test framework`);

    // Build test command
    const testCommand = buildTestCommand(framework, {
      pattern,
      watch,
      coverage,
    });

    // Run tests
    const startTime = Date.now();
    let output = "";
    let exitCode = 0;

    try {
      output = execSync(testCommand, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          CI: "true", // Force non-interactive mode
          NODE_ENV: "test",
        },
      });
    } catch (error) {
      exitCode = error.status || 1;
      output = error.stdout || error.message;
    }

    const duration = Date.now() - startTime;

    // Parse test results
    const results = parseTestOutput(output, framework);

    // If coverage was requested, parse coverage data
    let coverageData = null;
    if (coverage) {
      coverageData = await parseCoverageOutput(output, framework);
    }

    return {
      status: exitCode === 0 ? "passed" : "failed",
      framework,
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        skipped: results.skipped,
        duration: `${duration}ms`,
      },
      failures: results.failures?.slice(0, 10), // Limit to 10 failures
      coverage: coverageData,
      command: testCommand,
      message:
        exitCode === 0
          ? `✅ All tests passed (${results.passed}/${results.total})`
          : `❌ ${results.failed} test(s) failed`,
    };
  } catch (error) {
    console.error("[TEST-RUNNER] Error:", error.message);
    return {
      status: "error",
      message: "Failed to run tests",
      error: error.message,
    };
  }
}

async function detectTestFramework() {
  try {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));

    const deps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    // Check for test frameworks in order of preference
    if (deps.vitest) return "vitest";
    if (deps.jest) return "jest";
    if (deps.mocha) return "mocha";
    if (deps["@testing-library/react"]) return "jest"; // React usually uses Jest
    if (deps.jasmine) return "jasmine";

    // Check test script in package.json
    const testScript = packageJson.scripts?.test || "";
    if (testScript.includes("vitest")) return "vitest";
    if (testScript.includes("jest")) return "jest";
    if (testScript.includes("mocha")) return "mocha";

    return null;
  } catch {
    return null;
  }
}

function buildTestCommand(framework, options) {
  const { pattern, watch, coverage } = options;

  let command = "npm test --";

  switch (framework) {
    case "jest":
      if (pattern !== "**/*.test.*") command += ` ${pattern}`;
      if (watch) command += " --watch";
      if (coverage) command += " --coverage";
      command += " --passWithNoTests";
      break;

    case "vitest":
      if (pattern !== "**/*.test.*") command += ` ${pattern}`;
      if (watch) command += " --watch";
      if (coverage) command += " --coverage";
      command += " --run"; // Run once and exit
      break;

    case "mocha":
      command += ` "${pattern}"`;
      if (watch) command += " --watch";
      if (coverage) command = `nyc ${command}`;
      break;

    default:
      // Fallback to basic npm test
      break;
  }

  return command;
}

function parseTestOutput(output, framework) {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    failures: [],
  };

  switch (framework) {
    case "jest":
    case "vitest":
      // Parse Jest/Vitest output
      const summaryMatch = output.match(
        /Tests:\s+(\d+)\s+failed.*?(\d+)\s+passed.*?(\d+)\s+total/,
      );
      if (summaryMatch) {
        results.failed = parseInt(summaryMatch[1]);
        results.passed = parseInt(summaryMatch[2]);
        results.total = parseInt(summaryMatch[3]);
      }

      // Parse failures
      const failureMatches = output.matchAll(
        /FAIL\s+(.+?)\n([\s\S]+?)(?=FAIL|PASS|$)/g,
      );
      for (const match of failureMatches) {
        results.failures.push({
          file: match[1].trim(),
          details: match[2].trim().slice(0, 200), // Limit details
        });
      }
      break;

    case "mocha":
      // Parse Mocha output
      const mochaMatch = output.match(/(\d+)\s+passing.*?(\d+)\s+failing/);
      if (mochaMatch) {
        results.passed = parseInt(mochaMatch[1]);
        results.failed = parseInt(mochaMatch[2]);
        results.total = results.passed + results.failed;
      }
      break;
  }

  // Fallback: count test indicators
  if (results.total === 0) {
    results.passed = (output.match(/✓|✔|PASS/g) || []).length;
    results.failed = (output.match(/✗|✖|FAIL/g) || []).length;
    results.total = results.passed + results.failed;
  }

  return results;
}

async function parseCoverageOutput(output, framework) {
  const coverage = {
    lines: 0,
    branches: 0,
    functions: 0,
    statements: 0,
  };

  // Parse coverage table (common format)
  const coverageMatch = output.match(
    /All files.*?\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|/,
  );
  if (coverageMatch) {
    coverage.statements = parseFloat(coverageMatch[1]) || 0;
    coverage.branches = parseFloat(coverageMatch[2]) || 0;
    coverage.functions = parseFloat(coverageMatch[3]) || 0;
    coverage.lines = parseFloat(coverageMatch[4]) || 0;
  }

  return coverage;
}
