// git-init.js - Initialize a new git repository
import { execSync } from "child_process";
import { writeFile } from "../modules/file-ops.js";
import { promises as fs } from "fs"; // Still needed for fs.access and fs.mkdir
import path from "path";

export async function run(args = {}) {
  const {
    directory = ".",
    bare = false,
    template,
    branch = "main",
    gitignore = true,
    readme = true,
    license,
    initialCommit = true,
    remote,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[GIT-INIT] Initializing git repository...");

  try {
    const absPath = path.resolve(directory);
    const tasks = [];

    // Check if directory exists
    try {
      await fs.access(absPath);
    } catch {
      // Create directory if it doesn't exist
      if (!dryRun) {
        await fs.mkdir(absPath, { recursive: true });
      }
      tasks.push("Created directory");
    }

    // Check if already a git repo
    try {
      execSync("git rev-parse --git-dir", {
        cwd: absPath,
        stdio: "ignore",
      });

      return {
        success: false,
        error: "Directory is already a git repository",
        message: "Git repository already exists",
      };
    } catch {
      // Not a git repo, continue
    }

    // Initialize git repository
    let initCmd = "git init";
    if (bare) {
      initCmd += " --bare";
    }
    if (template) {
      initCmd += ` --template="${template}"`;
    }
    if (branch && branch !== "master") {
      initCmd += ` --initial-branch="${branch}"`;
    }

    if (!dryRun) {
      execSync(initCmd, { cwd: absPath });
    }
    tasks.push(`Initialized ${bare ? "bare " : ""}repository`);

    // Create .gitignore
    if (gitignore && !bare) {
      const gitignorePath = path.join(absPath, ".gitignore");
      const gitignoreContent = generateGitignore();

      if (!dryRun) {
        await writeFile(gitignorePath, gitignoreContent);
      }
      tasks.push("Created .gitignore");
    }

    // Create README.md
    if (readme && !bare) {
      const readmePath = path.join(absPath, "README.md");
      const projectName = path.basename(absPath);
      const readmeContent = generateReadme(projectName);

      if (!dryRun) {
        await writeFile(readmePath, readmeContent);
      }
      tasks.push("Created README.md");
    }

    // Create LICENSE
    if (license && !bare) {
      const licensePath = path.join(absPath, "LICENSE");
      const licenseContent = generateLicense(license);

      if (licenseContent) {
        if (!dryRun) {
          await writeFile(licensePath, licenseContent);
        }
        tasks.push(`Created ${license} LICENSE`);
      }
    }

    // Add remote
    if (remote && !bare) {
      if (!dryRun) {
        execSync(`git remote add origin ${remote}`, { cwd: absPath });
      }
      tasks.push(`Added remote: ${remote}`);
    }

    // Create initial commit
    if (initialCommit && !bare && (gitignore || readme || license)) {
      if (!dryRun) {
        execSync("git add .", { cwd: absPath });
        execSync('git commit -m "Initial commit"', { cwd: absPath });
      }
      tasks.push("Created initial commit");
    }

    // Get repository info
    let repoInfo = {};
    if (!dryRun) {
      try {
        const gitDir = execSync("git rev-parse --git-dir", {
          cwd: absPath,
          encoding: "utf8",
        }).trim();

        const currentBranch = execSync("git branch --show-current", {
          cwd: absPath,
          encoding: "utf8",
        }).trim();

        repoInfo = {
          path: absPath,
          gitDir,
          branch: currentBranch || branch,
          bare,
        };
      } catch {
        repoInfo = {
          path: absPath,
          bare,
        };
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        repository: repoInfo,
        tasks,
        files: tasks.filter((t) => t.includes("Created")).length,
      },
      message: dryRun
        ? `Would initialize git repository in ${absPath}`
        : `Initialized git repository in ${absPath}`,
    };
  } catch (error) {
    console.error("[GIT-INIT] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to initialize git repository",
    };
  }
}

function generateGitignore() {
  return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production
dist/
build/

# Development
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Cache
.cache/
.tmp/
`;
}

function generateReadme(projectName) {
  return `# ${projectName}

## Description

Add your project description here.

## Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd ${projectName}

# Install dependencies
npm install
\`\`\`

## Usage

\`\`\`bash
# Run the project
npm start
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
`;
}

function generateLicense(type) {
  const year = new Date().getFullYear();
  const licenses = {
    MIT: `MIT License

Copyright (c) ${year}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

    "Apache-2.0": `Copyright ${year}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,

    "GPL-3.0": `Copyright (C) ${year}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
  };

  return licenses[type] || null;
}
