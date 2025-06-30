// test-setup.js - Setup test environment and configuration
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";

export async function run(args = {}) {
  const {
    framework = "jest",
    coverage = true,
    watch = false,
    e2e = false,
    ci = false,
    force = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[TEST-SETUP] Setting up test environment...");

  try {
    const steps = [];
    const configs = [];

    // Step 1: Detect existing test setup
    const existing = await detectExistingSetup();

    if (existing.hasTests && !force) {
      return {
        success: true,
        data: {
          framework: existing.framework,
          configured: true,
          configs: existing.configs,
        },
        message: `Test environment already configured with ${existing.framework}`,
      };
    }

    // Step 2: Install test framework
    if (!dryRun) {
      console.error(`[TEST-SETUP] Installing ${framework}...`);
      const installResult = await installTestFramework(framework, { e2e });

      if (!installResult.success) {
        return {
          success: false,
          error: "Installation failed",
          data: { steps },
          message: `Failed to install ${framework}`,
        };
      }

      steps.push({
        step: "install",
        status: "completed",
        packages: installResult.packages,
      });
    }

    // Step 3: Generate configuration files
    console.error("[TEST-SETUP] Generating configuration files...");
    const configResult = await generateConfigs(framework, {
      coverage,
      watch,
      e2e,
      ci,
    });

    if (!dryRun) {
      for (const config of configResult.configs) {
        await fs.writeFile(config.path, config.content);
        configs.push(config.path);
      }
    }

    steps.push({
      step: "configure",
      status: "completed",
      configs: configResult.configs.map((c) => c.path),
    });

    // Step 4: Create test directories
    if (!dryRun) {
      console.error("[TEST-SETUP] Creating test directories...");
      const dirs = await createTestDirectories(framework, { e2e });

      steps.push({
        step: "directories",
        status: "completed",
        created: dirs,
      });
    }

    // Step 5: Add test scripts to package.json
    if (!dryRun) {
      console.error("[TEST-SETUP] Updating package.json scripts...");
      const scriptsResult = await updatePackageScripts(framework, {
        coverage,
        watch,
        e2e,
        ci,
      });

      steps.push({
        step: "scripts",
        status: "completed",
        added: Object.keys(scriptsResult.scripts),
      });
    }

    // Step 6: Create sample tests
    if (!dryRun) {
      console.error("[TEST-SETUP] Creating sample tests...");
      const samples = await createSampleTests(framework, { e2e });

      steps.push({
        step: "samples",
        status: "completed",
        files: samples,
      });
    }

    // Step 7: Setup CI configuration if requested
    if (ci && !dryRun) {
      console.error("[TEST-SETUP] Setting up CI configuration...");
      const ciResult = await setupCIConfig(framework);

      steps.push({
        step: "ci",
        status: "completed",
        files: ciResult.files,
      });
    }

    return {
      success: true,
      dryRun,
      data: {
        framework,
        steps,
        configs,
        commands: {
          test: "npm test",
          coverage: coverage ? "npm run test:coverage" : null,
          watch: watch ? "npm run test:watch" : null,
          e2e: e2e ? "npm run test:e2e" : null,
        },
      },
      message: dryRun
        ? `Would setup ${framework} test environment`
        : `Successfully setup ${framework} test environment`,
    };
  } catch (error) {
    console.error("[TEST-SETUP] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to setup test environment",
    };
  }
}

async function detectExistingSetup() {
  const setup = {
    hasTests: false,
    framework: null,
    configs: [],
  };

  // Check for test directories
  const testDirs = ["test", "tests", "__tests__", "spec"];
  for (const dir of testDirs) {
    try {
      await fs.access(dir);
      setup.hasTests = true;
      break;
    } catch {
      // Directory doesn't exist
    }
  }

  // Check for test configurations
  const configFiles = {
    jest: ["jest.config.js", "jest.config.json", "jest.config.ts"],
    mocha: [".mocharc.js", ".mocharc.json", "mocha.opts"],
    vitest: ["vitest.config.js", "vitest.config.ts"],
    ava: ["ava.config.js", "ava.config.cjs"],
    jasmine: ["jasmine.json", "spec/support/jasmine.json"],
  };

  for (const [framework, files] of Object.entries(configFiles)) {
    for (const file of files) {
      try {
        await fs.access(file);
        setup.framework = framework;
        setup.configs.push(file);
        setup.hasTests = true;
        break;
      } catch {
        // File doesn't exist
      }
    }
    if (setup.framework) break;
  }

  // Check package.json for test script
  try {
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    if (pkg.scripts?.test && !pkg.scripts.test.includes("no test")) {
      setup.hasTests = true;

      // Try to detect framework from test script
      if (!setup.framework) {
        if (pkg.scripts.test.includes("jest")) setup.framework = "jest";
        else if (pkg.scripts.test.includes("mocha")) setup.framework = "mocha";
        else if (pkg.scripts.test.includes("vitest"))
          setup.framework = "vitest";
        else if (pkg.scripts.test.includes("ava")) setup.framework = "ava";
      }
    }
  } catch {
    // No package.json
  }

  return setup;
}

async function installTestFramework(framework, options) {
  try {
    const packages = [];

    switch (framework) {
      case "jest":
        packages.push("jest", "@types/jest", "jest-environment-node");

        // Add React testing if React is detected
        try {
          const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
          if (pkg.dependencies?.react) {
            packages.push(
              "@testing-library/react",
              "@testing-library/jest-dom",
              "jest-environment-jsdom",
            );
          }
        } catch {
          // Ignore
        }
        break;

      case "mocha":
        packages.push("mocha", "@types/mocha", "chai", "@types/chai");
        break;

      case "vitest":
        packages.push(
          "vitest",
          "@vitest/ui",
          "c8", // for coverage
        );
        break;

      case "ava":
        packages.push(
          "ava",
          "c8", // for coverage
        );
        break;

      default:
        packages.push(framework);
    }

    // Add E2E packages if requested
    if (options.e2e) {
      packages.push("playwright", "@playwright/test");
    }

    // Install packages
    const installCmd = `npm install --save-dev ${packages.join(" ")}`;
    console.error(`[TEST-SETUP] Running: ${installCmd}`);
    execSync(installCmd, { stdio: "pipe" });

    return {
      success: true,
      packages,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function generateConfigs(framework, options) {
  const configs = [];

  switch (framework) {
    case "jest":
      configs.push({
        path: "jest.config.js",
        content: generateJestConfig(options),
      });

      if (options.ci) {
        configs.push({
          path: "jest.ci.config.js",
          content: generateJestCIConfig(options),
        });
      }
      break;

    case "mocha":
      configs.push({
        path: ".mocharc.js",
        content: generateMochaConfig(options),
      });
      break;

    case "vitest":
      configs.push({
        path: "vitest.config.js",
        content: generateVitestConfig(options),
      });
      break;

    case "ava":
      configs.push({
        path: "ava.config.js",
        content: generateAvaConfig(options),
      });
      break;
  }

  // Add coverage config
  if (options.coverage && ["mocha", "ava"].includes(framework)) {
    configs.push({
      path: ".c8rc.json",
      content: generateC8Config(),
    });
  }

  // Add E2E config
  if (options.e2e) {
    configs.push({
      path: "playwright.config.js",
      content: generatePlaywrightConfig(),
    });
  }

  return { configs };
}

function generateJestConfig(options) {
  const config = {
    testEnvironment: "node",
    roots: ["<rootDir>/src", "<rootDir>/tests"],
    testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
    transform: {
      "^.+\\.js$": "babel-jest",
    },
    collectCoverageFrom: [
      "src/**/*.js",
      "!src/**/*.test.js",
      "!src/**/*.spec.js",
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    testPathIgnorePatterns: [
      "/node_modules/",
      options.e2e ? "/e2e/" : null,
    ].filter(Boolean),
  };

  return `module.exports = ${JSON.stringify(config, null, 2)};`;
}

function generateJestCIConfig(options) {
  return `const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  ci: true,
  coverage: true,
  coverageReporters: ['text', 'lcov', 'json-summary'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  maxWorkers: 2
};`;
}

function generateMochaConfig(options) {
  return `module.exports = {
  require: ['@babel/register'],
  spec: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
  recursive: true,
  timeout: 5000,
  ui: 'bdd',
  reporter: ${options.ci ? '"xunit"' : '"spec"'},
  ${options.watch ? "watch: true," : ""}
  exit: true
};`;
}

function generateVitestConfig(options) {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      enabled: ${options.coverage},
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.js'],
      exclude: ['**/*.test.js', '**/*.spec.js']
    },
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    ${options.watch ? "watch: true," : ""}
    reporters: ${options.ci ? "['default', 'junit']" : "['default']"}
  }
});`;
}

function generateAvaConfig(options) {
  return `export default {
  files: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
  ${options.watch ? "watch: true," : ""}
  verbose: true,
  timeout: '60s',
  failFast: ${options.ci},
  concurrency: ${options.ci ? "2" : "5"},
  nodeArguments: ['--loader=babel-register-esm']
};`;
}

function generateC8Config() {
  return JSON.stringify(
    {
      all: true,
      include: ["src/**/*.js"],
      exclude: ["**/*.test.js", "**/*.spec.js", "node_modules/**"],
      reporter: ["text", "lcov", "html"],
      "check-coverage": true,
      branches: 80,
      lines: 80,
      functions: 80,
      statements: 80,
    },
    null,
    2,
  );
}

function generatePlaywrightConfig() {
  return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});`;
}

async function createTestDirectories(framework, options) {
  const dirs = [];

  // Main test directory
  const mainDir = framework === "jest" ? "__tests__" : "tests";
  await fs.mkdir(mainDir, { recursive: true });
  dirs.push(mainDir);

  // Sub-directories
  const subDirs = ["unit", "integration", "fixtures", "helpers"];
  for (const sub of subDirs) {
    const dir = path.join(mainDir, sub);
    await fs.mkdir(dir, { recursive: true });
    dirs.push(dir);
  }

  // E2E directory
  if (options.e2e) {
    await fs.mkdir("e2e", { recursive: true });
    dirs.push("e2e");
  }

  // Coverage directory
  await fs.mkdir("coverage", { recursive: true });

  return dirs;
}

async function updatePackageScripts(framework, options) {
  const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));

  if (!pkg.scripts) pkg.scripts = {};

  const scripts = {
    test: getTestCommand(framework),
    "test:unit": `${getTestCommand(framework)} ${getUnitPattern(framework)}`,
    "test:integration": `${getTestCommand(framework)} ${getIntegrationPattern(framework)}`,
  };

  if (options.coverage) {
    scripts["test:coverage"] = getCoverageCommand(framework);
  }

  if (options.watch) {
    scripts["test:watch"] = getWatchCommand(framework);
  }

  if (options.e2e) {
    scripts["test:e2e"] = "playwright test";
    scripts["test:e2e:ui"] = "playwright test --ui";
  }

  if (options.ci) {
    scripts["test:ci"] = getCICommand(framework);
  }

  // Update package.json
  Object.assign(pkg.scripts, scripts);

  await fs.writeFile("package.json", JSON.stringify(pkg, null, 2) + "\n");

  return { scripts };
}

function getTestCommand(framework) {
  switch (framework) {
    case "jest":
      return "jest";
    case "mocha":
      return "mocha";
    case "vitest":
      return "vitest run";
    case "ava":
      return "ava";
    default:
      return framework;
  }
}

function getUnitPattern(framework) {
  switch (framework) {
    case "jest":
      return "--testPathPattern=unit";
    case "mocha":
      return '"tests/unit/**/*.test.js"';
    case "vitest":
      return "tests/unit";
    case "ava":
      return "tests/unit/**/*.test.js";
    default:
      return "";
  }
}

function getIntegrationPattern(framework) {
  switch (framework) {
    case "jest":
      return "--testPathPattern=integration";
    case "mocha":
      return '"tests/integration/**/*.test.js"';
    case "vitest":
      return "tests/integration";
    case "ava":
      return "tests/integration/**/*.test.js";
    default:
      return "";
  }
}

function getCoverageCommand(framework) {
  switch (framework) {
    case "jest":
      return "jest --coverage";
    case "mocha":
      return "c8 mocha";
    case "vitest":
      return "vitest run --coverage";
    case "ava":
      return "c8 ava";
    default:
      return `${framework} --coverage`;
  }
}

function getWatchCommand(framework) {
  switch (framework) {
    case "jest":
      return "jest --watch";
    case "mocha":
      return "mocha --watch";
    case "vitest":
      return "vitest";
    case "ava":
      return "ava --watch";
    default:
      return `${framework} --watch`;
  }
}

function getCICommand(framework) {
  switch (framework) {
    case "jest":
      return "jest --ci --coverage --maxWorkers=2";
    case "mocha":
      return "c8 mocha --reporter xunit --reporter-option output=test-results/junit.xml";
    case "vitest":
      return "vitest run --coverage --reporter=junit";
    case "ava":
      return "c8 ava --tap | tap-xunit > test-results/junit.xml";
    default:
      return `${framework} --ci`;
  }
}

async function createSampleTests(framework, options) {
  const files = [];
  const testDir = framework === "jest" ? "__tests__" : "tests";

  // Create setup file
  const setupContent = generateSetupFile(framework);
  const setupPath = path.join(testDir, "setup.js");
  await fs.writeFile(setupPath, setupContent);
  files.push(setupPath);

  // Create sample unit test
  const unitTestContent = generateSampleUnitTest(framework);
  const unitTestPath = path.join(testDir, "unit", "example.test.js");
  await fs.writeFile(unitTestPath, unitTestContent);
  files.push(unitTestPath);

  // Create sample integration test
  const integrationTestContent = generateSampleIntegrationTest(framework);
  const integrationTestPath = path.join(testDir, "integration", "api.test.js");
  await fs.writeFile(integrationTestPath, integrationTestContent);
  files.push(integrationTestPath);

  // Create E2E test if requested
  if (options.e2e) {
    const e2eContent = generateSampleE2ETest();
    const e2ePath = "e2e/example.spec.js";
    await fs.writeFile(e2ePath, e2eContent);
    files.push(e2ePath);
  }

  return files;
}

function generateSetupFile(framework) {
  switch (framework) {
    case "jest":
      return `// Jest setup file
global.testTimeout = 30000;

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => \`expected \${received} not to be within range \${floor} - \${ceiling}\`,
        pass: true,
      };
    } else {
      return {
        message: () => \`expected \${received} to be within range \${floor} - \${ceiling}\`,
        pass: false,
      };
    }
  },
});`;

    case "mocha":
      return `// Mocha setup file
const chai = require('chai');
global.expect = chai.expect;
global.assert = chai.assert;
global.should = chai.should();`;

    default:
      return "// Test setup file\n";
  }
}

function generateSampleUnitTest(framework) {
  switch (framework) {
    case "jest":
      return `describe('Example Unit Test', () => {
  test('should add two numbers correctly', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});`;

    case "mocha":
      return `const { expect } = require('chai');

describe('Example Unit Test', () => {
  it('should add two numbers correctly', () => {
    const result = 2 + 2;
    expect(result).to.equal(4);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).to.have.lengthOf(3);
    expect(arr).to.include(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).to.equal('success');
  });
});`;

    case "vitest":
      return `import { describe, test, expect } from 'vitest';

describe('Example Unit Test', () => {
  test('should add two numbers correctly', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});`;

    case "ava":
      return `import test from 'ava';

test('should add two numbers correctly', t => {
  const result = 2 + 2;
  t.is(result, 4);
});

test('should handle arrays', t => {
  const arr = [1, 2, 3];
  t.is(arr.length, 3);
  t.true(arr.includes(2));
});

test('should handle async operations', async t => {
  const promise = Promise.resolve('success');
  const result = await promise;
  t.is(result, 'success');
});`;

    default:
      return "// Sample unit test\n";
  }
}

function generateSampleIntegrationTest(framework) {
  const isJestLike = ["jest", "vitest"].includes(framework);

  return `${isJestLike ? "import { describe, test, expect, beforeAll, afterAll } from '" + framework + "';" : ""}
${framework === "mocha" ? "const { expect } = require('chai');" : ""}
${framework === "ava" ? "import test from 'ava';" : ""}

${isJestLike || framework === "mocha" ? "describe" : "// Integration tests"}('API Integration Tests', ${isJestLike || framework === "mocha" ? "() => {" : ""}
  ${
    isJestLike || framework === "mocha"
      ? `
  let server;

  beforeAll(async () => {
    // Setup test server
    // server = await startServer({ port: 3001 });
  });

  afterAll(async () => {
    // Cleanup
    // await server.close();
  });

  test('should handle GET requests', async () => {
    // const response = await fetch('http://localhost:3001/api/users');
    // const data = await response.json();
    // expect(response.status).toBe(200);
    // expect(data).toHaveProperty('users');
    
    // Placeholder assertion
    expect(true).toBe(true);
  });

  test('should handle POST requests', async () => {
    // const response = await fetch('http://localhost:3001/api/users', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name: 'Test User' })
    // });
    // expect(response.status).toBe(201);
    
    // Placeholder assertion
    expect(true).toBe(true);
  });`
      : ""
  }
${isJestLike || framework === "mocha" ? "});" : ""}

${
  framework === "ava"
    ? `
test.before(async t => {
  // Setup test server
  // t.context.server = await startServer({ port: 3001 });
});

test.after(async t => {
  // Cleanup
  // await t.context.server.close();
});

test('should handle GET requests', async t => {
  // const response = await fetch('http://localhost:3001/api/users');
  // const data = await response.json();
  // t.is(response.status, 200);
  // t.truthy(data.users);
  
  // Placeholder assertion
  t.pass();
});

test('should handle POST requests', async t => {
  // const response = await fetch('http://localhost:3001/api/users', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name: 'Test User' })
  // });
  // t.is(response.status, 201);
  
  // Placeholder assertion
  t.pass();
});`
    : ""
}`;
}

function generateSampleE2ETest() {
  return `import { test, expect } from '@playwright/test';

test.describe('E2E Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Home/);
    
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    
    // Click on about link
    await page.click('a[href="/about"]');
    
    // Wait for navigation
    await page.waitForURL('/about');
    
    // Check page content
    await expect(page).toHaveTitle(/About/);
    const aboutHeading = page.locator('h1');
    await expect(aboutHeading).toContainText('About');
  });

  test('should submit contact form', async ({ page }) => {
    await page.goto('/contact');
    
    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for success message
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Thank you');
  });
});`;
}

async function setupCIConfig(framework) {
  const files = [];

  // Create GitHub Actions workflow
  const workflowDir = ".github/workflows";
  await fs.mkdir(workflowDir, { recursive: true });

  const workflowContent = `name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint --if-present
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        fail_ci_if_error: true
`;

  const workflowPath = path.join(workflowDir, "tests.yml");
  await fs.writeFile(workflowPath, workflowContent);
  files.push(workflowPath);

  // Create codecov.yml
  const codecovContent = `coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 5%
    patch:
      default:
        target: 80%

comment:
  layout: "reach,diff,flags,tree"
  behavior: default
`;

  await fs.writeFile("codecov.yml", codecovContent);
  files.push("codecov.yml");

  return { files };
}
