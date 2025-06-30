// init-project.js - Initialize Apex Hive in a new project
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

export async function run(args) {
  const {
    projectPath = ".",
    projectName,
    template = "default",
    modules,
  } = args;

  console.error("[INIT-PROJECT] Initializing Apex Hive...");

  try {
    // Determine project name
    const name = projectName || path.basename(path.resolve(projectPath));

    // Check if already initialized
    const apexConfigPath = path.join(projectPath, ".apex-hive", "config.json");
    try {
      await fs.access(apexConfigPath);
      return {
        status: "already-initialized",
        message: "Apex Hive is already initialized in this project",
        configPath: apexConfigPath,
      };
    } catch {
      // Not initialized, continue
    }

    // Create .apex-hive directory structure
    const apexDir = path.join(projectPath, ".apex-hive");
    const dirs = [
      apexDir,
      path.join(apexDir, "cache"),
      path.join(apexDir, "data"),
      path.join(apexDir, "logs"),
      path.join(apexDir, "recipes"),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create default configuration
    const config = createDefaultConfig(name, template);
    await fs.writeFile(apexConfigPath, JSON.stringify(config, null, 2));

    // Create .gitignore for apex-hive
    const gitignoreContent = [
      "cache/",
      "logs/",
      "data/conversations/",
      "*.tmp",
      "*.log",
    ].join("\n");

    await fs.writeFile(path.join(apexDir, ".gitignore"), gitignoreContent);

    // Create initial CLAUDE.md if it doesn't exist
    const claudeMdPath = path.join(apexDir, "data", "CLAUDE.md");
    if (!(await fileExists(claudeMdPath))) {
      const claudeMdContent = createClaudeMd(name);
      await fs.writeFile(claudeMdPath, claudeMdContent);
    }

    // Create sample recipes
    await createSampleRecipes(path.join(apexDir, "recipes"));

    // Update package.json if it exists
    const packageJsonPath = path.join(projectPath, "package.json");
    if (await fileExists(packageJsonPath)) {
      await updatePackageJson(packageJsonPath);
    }

    // Initialize git hooks if in a git repo
    if (await isGitRepo(projectPath)) {
      await setupGitHooks(projectPath);
    }

    return {
      status: "initialized",
      projectName: name,
      configPath: apexConfigPath,
      features: {
        cache: true,
        recipes: true,
        claudeMd: true,
        gitHooks: await isGitRepo(projectPath),
      },
      message: `✅ Apex Hive initialized successfully for "${name}"!`,
      nextSteps: [
        'Run "apex help" to see available commands',
        "Edit .apex-hive/config.json to customize settings",
        "Add recipes to .apex-hive/recipes/ for custom workflows",
      ],
    };
  } catch (error) {
    console.error("[INIT-PROJECT] Error:", error);
    return {
      status: "error",
      message: "Failed to initialize Apex Hive",
      error: error.message,
    };
  }
}

function createDefaultConfig(projectName, template) {
  const config = {
    version: "1.0.0",
    projectName,
    created: new Date().toISOString(),
    template,

    // RAG configuration
    rag: {
      repositories: ["."],
      useRipgrep: true,
      cacheDir: ".apex-hive/cache",
      dataDir: ".apex-hive/data",
      maxConversations: 5,
    },

    // Cache configuration
    cache: {
      enabled: true,
      ttl: 3600000, // 1 hour
      maxSize: 100 * 1024 * 1024, // 100MB
      persistentPatterns: [
        "README.md",
        "CLAUDE.md",
        "package.json",
        ".apex-hive/config.json",
      ],
    },

    // Script settings
    scripts: {
      timeout: 300000, // 5 minutes
      parallelLimit: 3,
    },

    // Natural language settings
    naturalLanguage: {
      enabled: true,
      languages: ["en", "nl"],
    },
  };

  // Add template-specific settings
  switch (template) {
    case "react":
      config.rag.include = ["src/**/*.{js,jsx,ts,tsx}", "docs/**/*.md"];
      config.rag.exclude = ["node_modules", "build", "dist"];
      break;

    case "node":
      config.rag.include = ["lib/**/*.js", "src/**/*.js", "docs/**/*.md"];
      config.rag.exclude = ["node_modules", "coverage"];
      break;

    case "python":
      config.rag.include = ["**/*.py", "docs/**/*.md"];
      config.rag.exclude = ["__pycache__", "venv", ".pytest_cache"];
      break;
  }

  return config;
}

function createClaudeMd(projectName) {
  return `# ${projectName} - Claude Knowledge Base

This file contains project-specific information for Claude to understand your codebase better.

## Project Overview
<!-- Describe your project here -->

## Key Concepts
<!-- List important concepts, patterns, or conventions -->

## Architecture
<!-- Describe the high-level architecture -->

## Common Tasks
<!-- List common development tasks and how to perform them -->

## Important Files
<!-- List key files and their purposes -->

## Development Workflow
<!-- Describe the typical development workflow -->

## Troubleshooting
<!-- Common issues and their solutions -->

---
*Generated by Apex Hive on ${new Date().toISOString()}*
`;
}

async function createSampleRecipes(recipesDir) {
  // Quick fix recipe
  const quickFix = {
    name: "quick-fix",
    description: "Quick fix for CI issues",
    steps: [
      "ci:monitor",
      "ci:parse",
      "ci:fix",
      'git:commit -m "fix: Auto-fix CI issues"',
      "ci:smart-push",
    ],
  };

  // Daily workflow recipe
  const dailyWorkflow = {
    name: "daily",
    description: "Daily development workflow",
    steps: ["git:pull", "test", "lint", "git:status"],
  };

  // Release recipe
  const release = {
    name: "release",
    description: "Prepare a release",
    steps: [
      "test",
      "lint",
      "version:bump",
      "changelog:generate",
      'git:commit -m "chore: Prepare release"',
      "git:tag",
      "git:push --tags",
    ],
  };

  await fs.writeFile(
    path.join(recipesDir, "quick-fix.json"),
    JSON.stringify(quickFix, null, 2),
  );

  await fs.writeFile(
    path.join(recipesDir, "daily.json"),
    JSON.stringify(dailyWorkflow, null, 2),
  );

  await fs.writeFile(
    path.join(recipesDir, "release.json"),
    JSON.stringify(release, null, 2),
  );
}

async function updatePackageJson(packageJsonPath) {
  try {
    const content = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(content);

    // Add apex scripts if not present
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    const apexScripts = {
      apex: "apex",
      "apex:help": "apex help",
      "apex:ci": "apex ci:monitor",
      "apex:test": "apex test",
      "apex:search": "apex search",
    };

    let updated = false;
    for (const [key, value] of Object.entries(apexScripts)) {
      if (!packageJson.scripts[key]) {
        packageJson.scripts[key] = value;
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
      );
    }
  } catch (error) {
    console.error(
      "[INIT-PROJECT] Failed to update package.json:",
      error.message,
    );
  }
}

async function setupGitHooks(projectPath) {
  try {
    const hooksDir = path.join(projectPath, ".git", "hooks");

    // Pre-commit hook
    const preCommitHook = `#!/bin/sh
# Apex Hive pre-commit hook

# Run tests if available
if [ -f "package.json" ] && grep -q '"test"' package.json; then
  echo "Running tests..."
  npm test || exit 1
fi

# Check for console.log statements
if git diff --cached --name-only | grep -E '\\.(js|jsx|ts|tsx)$' | xargs grep -n 'console\\.log' 2>/dev/null; then
  echo "Warning: console.log statements found in staged files"
fi

exit 0
`;

    await fs.writeFile(path.join(hooksDir, "pre-commit"), preCommitHook, {
      mode: 0o755,
    });
  } catch (error) {
    console.error("[INIT-PROJECT] Failed to setup git hooks:", error.message);
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isGitRepo(projectPath) {
  try {
    execSync("git rev-parse --git-dir", {
      cwd: projectPath,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}
