// doc-post-merge.js - Post-merge documentation tasks
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    check = true,
    generate = true,
    validate = true,
    sync = true,
    updateReadme = true,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[DOC-POST-MERGE] Running post-merge documentation tasks...");

  try {
    const tasks = [];
    const results = {
      success: true,
      tasks: [],
    };

    // Get merge information
    const mergeInfo = await getMergeInfo();

    if (!mergeInfo.isMerge) {
      return {
        success: true,
        data: {
          tasks: [],
          message: "Not a merge commit",
        },
        message: "No post-merge tasks needed (not a merge commit)",
      };
    }

    console.error("[DOC-POST-MERGE] Detected merge commit, running tasks...");

    // Task 1: Check for documentation conflicts
    if (check) {
      console.error("[DOC-POST-MERGE] Checking for documentation issues...");
      const checkResult = await checkDocumentationIssues(mergeInfo);

      tasks.push({
        name: "check-issues",
        status: checkResult.success ? "completed" : "warning",
        details: checkResult,
      });

      if (!checkResult.success && checkResult.critical) {
        return {
          success: false,
          error: "Critical documentation issues found",
          data: { tasks },
          message: "Post-merge blocked by critical issues",
        };
      }
    }

    // Task 2: Generate missing documentation
    if (generate && !dryRun) {
      console.error(
        "[DOC-POST-MERGE] Generating documentation for new files...",
      );
      const generateResult = await generateNewFileDocs(mergeInfo, modules);

      tasks.push({
        name: "generate-docs",
        status: generateResult.success ? "completed" : "failed",
        details: generateResult,
      });
    }

    // Task 3: Validate all documentation
    if (validate) {
      console.error("[DOC-POST-MERGE] Validating documentation...");
      const validateResult = await validateAllDocs(modules);

      tasks.push({
        name: "validate-docs",
        status: validateResult.success ? "completed" : "warning",
        details: validateResult,
      });
    }

    // Task 4: Sync documentation
    if (sync && !dryRun) {
      console.error("[DOC-POST-MERGE] Syncing documentation...");
      const syncResult = await syncDocumentation(modules);

      tasks.push({
        name: "sync-docs",
        status: syncResult.success ? "completed" : "warning",
        details: syncResult,
      });
    }

    // Task 5: Update README if needed
    if (updateReadme && !dryRun) {
      console.error("[DOC-POST-MERGE] Updating README...");
      const readmeResult = await updateReadmeIfNeeded(mergeInfo, modules);

      tasks.push({
        name: "update-readme",
        status: readmeResult.success ? "completed" : "warning",
        details: readmeResult,
      });
    }

    // Generate summary report
    const report = generatePostMergeReport(tasks, mergeInfo);

    if (!dryRun) {
      const reportPath = "docs/post-merge-report.md";
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, report);
    }

    // Determine overall success
    const failedTasks = tasks.filter((t) => t.status === "failed");
    const warningTasks = tasks.filter((t) => t.status === "warning");

    return {
      success: failedTasks.length === 0,
      dryRun,
      data: {
        tasks: tasks.map((t) => ({ name: t.name, status: t.status })),
        failed: failedTasks.length,
        warnings: warningTasks.length,
        report: dryRun ? null : "docs/post-merge-report.md",
      },
      message: dryRun
        ? `Would run ${tasks.length} post-merge tasks`
        : `Completed ${tasks.length} post-merge tasks: ${failedTasks.length} failed, ${warningTasks.length} warnings`,
    };
  } catch (error) {
    console.error("[DOC-POST-MERGE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to run post-merge documentation tasks",
    };
  }
}

async function getMergeInfo() {
  const info = {
    isMerge: false,
    branch: null,
    mergedFrom: null,
    files: {
      added: [],
      modified: [],
      deleted: [],
      renamed: [],
    },
  };

  try {
    // Check if last commit is a merge
    const lastCommit = execSync("git log -1 --format=%H", {
      encoding: "utf8",
    }).trim();
    const parentCount =
      execSync(`git rev-list --parents -n 1 ${lastCommit}`, {
        encoding: "utf8",
      })
        .trim()
        .split(" ").length - 1;

    if (parentCount > 1) {
      info.isMerge = true;

      // Get current branch
      info.branch = execSync("git branch --show-current", {
        encoding: "utf8",
      }).trim();

      // Get merge commit message to find merged branch
      const mergeMessage = execSync("git log -1 --format=%s", {
        encoding: "utf8",
      }).trim();
      const branchMatch = mergeMessage.match(
        /Merge (?:branch|pull request) ['"]?([^'"]+)['"]?/,
      );
      if (branchMatch) {
        info.mergedFrom = branchMatch[1];
      }

      // Get changed files
      const changes = execSync(
        "git diff-tree --no-commit-id --name-status -r HEAD",
        {
          encoding: "utf8",
        },
      )
        .trim()
        .split("\n")
        .filter((l) => l);

      for (const change of changes) {
        const [status, ...pathParts] = change.split("\t");
        const filepath = pathParts.join("\t");

        switch (status) {
          case "A":
            info.files.added.push(filepath);
            break;
          case "M":
            info.files.modified.push(filepath);
            break;
          case "D":
            info.files.deleted.push(filepath);
            break;
          case "R":
            const [oldPath, newPath] = filepath.split("\t");
            info.files.renamed.push({ from: oldPath, to: newPath });
            break;
        }
      }
    }
  } catch (error) {
    console.error("[DOC-POST-MERGE] Error getting merge info:", error.message);
  }

  return info;
}

async function checkDocumentationIssues(mergeInfo) {
  const issues = {
    success: true,
    critical: false,
    conflicts: [],
    missing: [],
    outdated: [],
  };

  try {
    // Check for conflict markers in docs
    const docFiles = execSync(
      'find docs -name "*.md" -type f 2>/dev/null || true',
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    for (const file of docFiles) {
      try {
        const content = await fs.readFile(file, "utf8");

        // Check for conflict markers
        if (content.includes("<<<<<<<") || content.includes(">>>>>>>")) {
          issues.conflicts.push(file);
          issues.critical = true;
          issues.success = false;
        }
      } catch {
        // Ignore read errors
      }
    }

    // Check for missing docs for new code files
    const codeExtensions = [".js", ".ts", ".jsx", ".tsx", ".py", ".java"];
    const newCodeFiles = mergeInfo.files.added.filter(
      (f) =>
        codeExtensions.some((ext) => f.endsWith(ext)) &&
        !f.includes("test") &&
        !f.includes("spec") &&
        !f.includes("node_modules"),
    );

    for (const codeFile of newCodeFiles) {
      const docPath = getExpectedDocPath(codeFile);

      try {
        await fs.access(docPath);
      } catch {
        issues.missing.push({
          code: codeFile,
          expectedDoc: docPath,
        });
      }
    }

    // Check for potentially outdated docs (modified code without modified docs)
    const modifiedCode = mergeInfo.files.modified.filter((f) =>
      codeExtensions.some((ext) => f.endsWith(ext)),
    );

    for (const codeFile of modifiedCode) {
      const docPath = getExpectedDocPath(codeFile);

      try {
        const codeStats = await fs.stat(codeFile);
        const docStats = await fs.stat(docPath);

        if (codeStats.mtime > docStats.mtime) {
          issues.outdated.push({
            code: codeFile,
            doc: docPath,
            codeModified: codeStats.mtime,
            docModified: docStats.mtime,
          });
        }
      } catch {
        // Doc doesn't exist, already in missing
      }
    }
  } catch (error) {
    issues.success = false;
    issues.error = error.message;
  }

  return issues;
}

async function generateNewFileDocs(mergeInfo, modules) {
  const result = {
    success: true,
    generated: [],
    failed: [],
  };

  // Use doc-generate-missing module if available
  if (modules["doc:generate-missing"]) {
    try {
      const generateResult = await modules["doc:generate-missing"].run({
        threshold: 50, // Only generate for files > 50 lines
      });

      result.success = generateResult.success;
      result.generated = generateResult.data.generated || [];

      return result;
    } catch {
      // Fall back to basic generation
    }
  }

  // Basic documentation generation for new files
  const codeExtensions = [".js", ".ts", ".jsx", ".tsx"];
  const newFiles = mergeInfo.files.added.filter(
    (f) =>
      codeExtensions.some((ext) => f.endsWith(ext)) &&
      !f.includes("test") &&
      !f.includes("spec"),
  );

  for (const file of newFiles) {
    try {
      const content = await fs.readFile(file, "utf8");
      const lines = content.split("\n").length;

      // Only document files with substantial content
      if (lines > 50) {
        const docPath = getExpectedDocPath(file);
        const docContent = generateBasicDoc(file, content);

        await fs.mkdir(path.dirname(docPath), { recursive: true });
        await fs.writeFile(docPath, docContent);

        result.generated.push({
          source: file,
          doc: docPath,
        });
      }
    } catch (error) {
      result.failed.push({
        file,
        error: error.message,
      });
    }
  }

  return result;
}

async function validateAllDocs(modules) {
  const result = {
    success: true,
    validations: {},
  };

  // Run various validation modules if available
  const validations = [
    { module: "doc:validate", name: "structure" },
    { module: "doc:validate-links", name: "links" },
    { module: "doc:validate-xml", name: "xml" },
  ];

  for (const { module, name } of validations) {
    if (modules[module]) {
      try {
        const validateResult = await modules[module].run({
          directory: "docs",
          fix: false,
        });

        result.validations[name] = {
          success: validateResult.success,
          valid: validateResult.data.valid || 0,
          invalid: validateResult.data.invalid || 0,
        };

        if (!validateResult.success) {
          result.success = false;
        }
      } catch (error) {
        result.validations[name] = {
          success: false,
          error: error.message,
        };
      }
    }
  }

  return result;
}

async function syncDocumentation(modules) {
  const result = {
    success: true,
    synced: [],
  };

  // Use doc-sync module if available
  if (modules["doc:sync"]) {
    try {
      const syncResult = await modules["doc:sync"].run();

      result.success = syncResult.success;
      result.synced = syncResult.data.synced || [];

      return result;
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }
  }

  // Basic sync: ensure docs match code structure
  try {
    // Find all source directories
    const sourceDirs = execSync(
      'find . -type d -name "src" -o -name "lib" 2>/dev/null | head -10',
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n")
      .filter((d) => d);

    for (const srcDir of sourceDirs) {
      const docDir = srcDir.replace(/^\.\//, "docs/api/");

      try {
        await fs.mkdir(docDir, { recursive: true });
        result.synced.push(docDir);
      } catch {
        // Directory creation failed
      }
    }
  } catch (error) {
    result.success = false;
    result.error = error.message;
  }

  return result;
}

async function updateReadmeIfNeeded(mergeInfo, modules) {
  const result = {
    success: true,
    updated: false,
    sections: [],
  };

  // Check if README needs updating
  const needsUpdate = await checkReadmeNeedsUpdate(mergeInfo);

  if (!needsUpdate) {
    return result;
  }

  // Use doc-update-readme module if available
  if (modules["doc:update-readme"]) {
    try {
      const updateResult = await modules["doc:update-readme"].run();

      result.success = updateResult.success;
      result.updated = updateResult.success;
      result.sections = updateResult.data.sections || [];

      return result;
    } catch {
      // Fall back to basic update
    }
  }

  // Basic README update
  try {
    const readmePath = "README.md";
    let content = await fs.readFile(readmePath, "utf8");

    // Update last modified date if present
    const dateRegex = /Last (?:Modified|Updated):\s*\d{4}-\d{2}-\d{2}/i;
    if (dateRegex.test(content)) {
      content = content.replace(
        dateRegex,
        `Last Modified: ${new Date().toISOString().split("T")[0]}`,
      );
      result.sections.push("last-modified");
    }

    // Update file count if present
    const fileCountRegex = /(\d+)\s*(?:source\s*)?files/i;
    if (fileCountRegex.test(content)) {
      const fileCount = execSync(
        'find . -name "*.js" -o -name "*.ts" | wc -l',
        {
          encoding: "utf8",
        },
      ).trim();

      content = content.replace(fileCountRegex, `${fileCount} files`);
      result.sections.push("file-count");
    }

    if (result.sections.length > 0) {
      await fs.writeFile(readmePath, content);
      result.updated = true;
    }
  } catch (error) {
    result.success = false;
    result.error = error.message;
  }

  return result;
}

async function checkReadmeNeedsUpdate(mergeInfo) {
  // README should be updated if:
  // 1. New features added (new directories or significant files)
  // 2. Dependencies changed
  // 3. Configuration files modified

  const significantChanges = [
    ...mergeInfo.files.added,
    ...mergeInfo.files.modified,
  ].filter(
    (f) =>
      f === "package.json" ||
      f === "README.md" ||
      f.endsWith("config.js") ||
      f.endsWith("config.json") ||
      (f.includes("src/") && f.endsWith("index.js")),
  );

  return significantChanges.length > 0;
}

function getExpectedDocPath(codePath) {
  // Convert code path to documentation path
  const ext = path.extname(codePath);
  const docPath = codePath
    .replace(/^\.\//, "")
    .replace(/^src\//, "docs/api/")
    .replace(/^lib\//, "docs/api/")
    .replace(ext, ".md");

  return docPath;
}

function generateBasicDoc(filepath, content) {
  const basename = path.basename(filepath);
  const lines = content.split("\n");

  let doc = `# ${basename}\n\n`;
  doc += `**Auto-generated documentation**\n\n`;
  doc += `- **Path**: \`${filepath}\`\n`;
  doc += `- **Lines**: ${lines.length}\n`;
  doc += `- **Generated**: ${new Date().toISOString()}\n\n`;

  // Extract first comment as description
  const firstCommentMatch = content.match(/\/\*\*([\s\S]*?)\*\/|\/\/(.+)/);
  if (firstCommentMatch) {
    const comment = (firstCommentMatch[1] || firstCommentMatch[2]).trim();
    doc += `## Description\n\n${comment}\n\n`;
  }

  // Extract exports
  const exports = [];
  const exportRegex =
    /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  if (exports.length > 0) {
    doc += `## Exports\n\n`;
    for (const exp of exports) {
      doc += `- \`${exp}\`\n`;
    }
    doc += "\n";
  }

  doc += `## Documentation\n\n`;
  doc += `*This file was added in a merge. Please update this documentation with proper details.*\n\n`;
  doc += `[View Source](${filepath})\n`;

  return doc;
}

function generatePostMergeReport(tasks, mergeInfo) {
  let report = "# Post-Merge Documentation Report\n\n";

  report += `**Generated**: ${new Date().toISOString()}\n`;
  report += `**Branch**: ${mergeInfo.branch}\n`;

  if (mergeInfo.mergedFrom) {
    report += `**Merged From**: ${mergeInfo.mergedFrom}\n`;
  }

  report += "\n";

  // Summary
  report += "## Summary\n\n";

  const taskCounts = {
    completed: tasks.filter((t) => t.status === "completed").length,
    warning: tasks.filter((t) => t.status === "warning").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  };

  report += `- **Total Tasks**: ${tasks.length}\n`;
  report += `- **Completed**: ${taskCounts.completed} ✅\n`;
  report += `- **Warnings**: ${taskCounts.warning} ⚠️\n`;
  report += `- **Failed**: ${taskCounts.failed} ❌\n\n`;

  // Changed files
  report += "## Changed Files\n\n";
  report += `- **Added**: ${mergeInfo.files.added.length}\n`;
  report += `- **Modified**: ${mergeInfo.files.modified.length}\n`;
  report += `- **Deleted**: ${mergeInfo.files.deleted.length}\n`;
  report += `- **Renamed**: ${mergeInfo.files.renamed.length}\n\n`;

  // Task details
  report += "## Task Results\n\n";

  for (const task of tasks) {
    const statusEmoji = {
      completed: "✅",
      warning: "⚠️",
      failed: "❌",
    };

    report += `### ${task.name} ${statusEmoji[task.status]}\n\n`;

    if (task.details) {
      // Check issues task
      if (task.name === "check-issues" && task.details.conflicts) {
        if (task.details.conflicts.length > 0) {
          report += "**Conflicts Found:**\n";
          for (const file of task.details.conflicts) {
            report += `- ${file}\n`;
          }
          report += "\n";
        }

        if (task.details.missing && task.details.missing.length > 0) {
          report += "**Missing Documentation:**\n";
          for (const item of task.details.missing) {
            report += `- ${item.code} → ${item.expectedDoc}\n`;
          }
          report += "\n";
        }

        if (task.details.outdated && task.details.outdated.length > 0) {
          report += "**Potentially Outdated:**\n";
          for (const item of task.details.outdated) {
            report += `- ${item.doc} (code modified more recently)\n`;
          }
          report += "\n";
        }
      }

      // Generate docs task
      if (task.name === "generate-docs" && task.details.generated) {
        report += `**Generated ${task.details.generated.length} documentation files**\n\n`;
      }

      // Validate docs task
      if (task.name === "validate-docs" && task.details.validations) {
        for (const [type, validation] of Object.entries(
          task.details.validations,
        )) {
          report += `**${type} validation**: `;
          if (validation.success) {
            report += `${validation.valid} valid, ${validation.invalid} invalid\n`;
          } else {
            report += `Failed - ${validation.error || "Unknown error"}\n`;
          }
        }
        report += "\n";
      }

      // Update README task
      if (task.name === "update-readme" && task.details.updated) {
        report += `**Updated sections**: ${task.details.sections.join(", ")}\n\n`;
      }
    }
  }

  // Action items
  report += "## Action Items\n\n";

  const actionItems = [];

  // Based on task results
  for (const task of tasks) {
    if (task.status === "failed") {
      actionItems.push(`Fix failed task: ${task.name}`);
    }

    if (task.name === "check-issues" && task.details) {
      if (task.details.conflicts && task.details.conflicts.length > 0) {
        actionItems.push("Resolve merge conflicts in documentation files");
      }
      if (task.details.missing && task.details.missing.length > 0) {
        actionItems.push("Create documentation for new code files");
      }
      if (task.details.outdated && task.details.outdated.length > 0) {
        actionItems.push("Update outdated documentation");
      }
    }
  }

  if (actionItems.length > 0) {
    for (const item of actionItems) {
      report += `- [ ] ${item}\n`;
    }
  } else {
    report +=
      "✨ No action items - all documentation tasks completed successfully!\n";
  }

  return report;
}
