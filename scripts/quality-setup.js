// quality-setup.js - Setup quality tools and configurations
import { promises as fs } from "fs";
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    eslint = true,
    prettier = true,
    husky = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[QUALITY-SETUP] Setting up quality tools...");

  const setup = [];
  const configs = [];

  try {
    // 1. Setup ESLint
    if (eslint) {
      console.error("[QUALITY-SETUP] Setting up ESLint...");

      // Check if .eslintrc exists
      const eslintrcExists = await fs
        .access(".eslintrc.js")
        .then(() => true)
        .catch(() => false);

      if (!eslintrcExists && !dryRun) {
        const eslintConfig = `module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'never']
  }
};`;

        await fs.writeFile(".eslintrc.js", eslintConfig);
        configs.push(".eslintrc.js");
      }

      // Check if ESLint is installed
      try {
        execSync("npx eslint --version", { stdio: "ignore" });
        setup.push({
          tool: "eslint",
          status: "already installed",
        });
      } catch {
        if (!dryRun) {
          console.error("[QUALITY-SETUP] Installing ESLint...");
          execSync("npm install --save-dev eslint", { stdio: "inherit" });
          setup.push({
            tool: "eslint",
            status: "installed",
          });
        } else {
          setup.push({
            tool: "eslint",
            status: "would install",
          });
        }
      }
    }

    // 2. Setup Prettier
    if (prettier) {
      console.error("[QUALITY-SETUP] Setting up Prettier...");

      // Check if .prettierrc exists
      const prettierrcExists = await fs
        .access(".prettierrc")
        .then(() => true)
        .catch(() => false);

      if (!prettierrcExists && !dryRun) {
        const prettierConfig = {
          semi: true,
          trailingComma: "none",
          singleQuote: true,
          printWidth: 100,
          tabWidth: 2,
        };

        await fs.writeFile(
          ".prettierrc",
          JSON.stringify(prettierConfig, null, 2),
        );
        configs.push(".prettierrc");
      }

      // Check if Prettier is installed
      try {
        execSync("npx prettier --version", { stdio: "ignore" });
        setup.push({
          tool: "prettier",
          status: "already installed",
        });
      } catch {
        if (!dryRun) {
          console.error("[QUALITY-SETUP] Installing Prettier...");
          execSync("npm install --save-dev prettier", { stdio: "inherit" });
          setup.push({
            tool: "prettier",
            status: "installed",
          });
        } else {
          setup.push({
            tool: "prettier",
            status: "would install",
          });
        }
      }
    }

    // 3. Setup Husky (Git hooks)
    if (husky) {
      console.error("[QUALITY-SETUP] Setting up Husky...");

      try {
        execSync("npx husky --version", { stdio: "ignore" });
        setup.push({
          tool: "husky",
          status: "already installed",
        });
      } catch {
        if (!dryRun) {
          console.error("[QUALITY-SETUP] Installing Husky...");
          execSync("npm install --save-dev husky", { stdio: "inherit" });
          execSync("npx husky install", { stdio: "inherit" });

          // Add pre-commit hook
          await fs.mkdir(".husky", { recursive: true });
          const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged`;

          await fs.writeFile(".husky/pre-commit", preCommitHook);
          await fs.chmod(".husky/pre-commit", "755");

          setup.push({
            tool: "husky",
            status: "installed",
            hooks: ["pre-commit"],
          });
        } else {
          setup.push({
            tool: "husky",
            status: "would install",
          });
        }
      }
    }

    // 4. Add quality scripts to package.json
    if (!dryRun) {
      console.error("[QUALITY-SETUP] Adding quality scripts...");

      const packageJson = JSON.parse(
        await fs.readFile("./package.json", "utf8"),
      );

      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      const qualityScripts = {
        lint: "eslint .",
        "lint:fix": "eslint . --fix",
        format: 'prettier --write "**/*.js"',
        "format:check": 'prettier --check "**/*.js"',
        quality: "npm run lint && npm run format:check",
        "quality:fix": "npm run lint:fix && npm run format",
      };

      let scriptsAdded = 0;
      for (const [name, command] of Object.entries(qualityScripts)) {
        if (!packageJson.scripts[name]) {
          packageJson.scripts[name] = command;
          scriptsAdded++;
        }
      }

      if (scriptsAdded > 0) {
        await fs.writeFile(
          "./package.json",
          JSON.stringify(packageJson, null, 2) + "\n",
        );
        setup.push({
          type: "scripts",
          added: scriptsAdded,
        });
      }
    }

    // 5. Create .gitignore entries
    if (!dryRun) {
      const gitignorePath = ".gitignore";
      let gitignore = "";

      try {
        gitignore = await fs.readFile(gitignorePath, "utf8");
      } catch {
        // No .gitignore yet
      }

      const entriesToAdd = [
        "node_modules/",
        "*.log",
        ".eslintcache",
        "eslint-report.html",
        "quality-report.json",
      ];

      const newEntries = entriesToAdd.filter(
        (entry) => !gitignore.includes(entry),
      );

      if (newEntries.length > 0) {
        gitignore += "\n# Quality tools\n" + newEntries.join("\n") + "\n";
        await fs.writeFile(gitignorePath, gitignore);
        configs.push(".gitignore (updated)");
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        setup,
        configs,
        tools: setup.map((s) => s.tool || s.type),
      },
      message: dryRun
        ? "Would setup quality tools"
        : `Setup complete: ${setup.length} tools, ${configs.length} configs`,
    };
  } catch (error) {
    console.error("[QUALITY-SETUP] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to setup quality tools",
    };
  }
}
