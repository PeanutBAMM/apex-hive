// save-conversation.js - Save AI conversation context
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    title,
    tags = [],
    format = "markdown",
    directory = "conversations",
    autoCommit = false,
    summary = true,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[SAVE-CONVERSATION] Saving conversation context...");

  try {
    // Generate conversation data
    const conversationData = {
      timestamp: new Date().toISOString(),
      title: title || generateTitle(),
      tags,
      context: await gatherContext(),
      summary: summary ? await generateSummary() : null,
      metadata: await gatherMetadata(),
    };

    // Generate filename
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "-");
    const safeTitle = (conversationData.title || "conversation")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 50);

    const filename = `${dateStr}-${timeStr}-${safeTitle}`;

    // Format content
    let content;
    let extension;

    switch (format) {
      case "markdown":
        content = formatAsMarkdown(conversationData);
        extension = "md";
        break;

      case "json":
        content = JSON.stringify(conversationData, null, 2);
        extension = "json";
        break;

      case "claude":
        content = formatAsClaudeContext(conversationData);
        extension = "md";
        break;

      default:
        content = formatAsMarkdown(conversationData);
        extension = "md";
    }

    // Save file
    const filepath = path.join(directory, `${filename}.${extension}`);

    if (!dryRun) {
      // Create directory if needed
      await fs.mkdir(directory, { recursive: true });

      // Write conversation
      await fs.writeFile(filepath, content);

      // Update index
      await updateConversationIndex(directory, {
        file: `${filename}.${extension}`,
        ...conversationData,
      });

      // Auto-commit if requested
      if (autoCommit) {
        try {
          execSync(`git add ${filepath}`, { stdio: "pipe" });
          execSync(
            `git commit -m "Save conversation: ${conversationData.title}"`,
            {
              stdio: "pipe",
            },
          );
        } catch {
          // Git operations failed, ignore
        }
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        file: filepath,
        title: conversationData.title,
        tags,
        size: content.length,
        format,
        committed: autoCommit && !dryRun,
      },
      message: dryRun
        ? `Would save conversation to ${filepath}`
        : `Saved conversation to ${filepath}`,
    };
  } catch (error) {
    console.error("[SAVE-CONVERSATION] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to save conversation",
    };
  }
}

function generateTitle() {
  // Try to extract from recent commands or files
  try {
    const recentCommands = execSync("history | tail -20", {
      encoding: "utf8",
      shell: "/bin/bash",
    })
      .trim()
      .split("\n");

    // Look for meaningful commands
    for (const cmd of recentCommands.reverse()) {
      if (
        cmd.includes("fix") ||
        cmd.includes("implement") ||
        cmd.includes("create") ||
        cmd.includes("update")
      ) {
        return cmd.substring(0, 50);
      }
    }
  } catch {
    // History not available
  }

  return `AI Session ${new Date().toISOString().split("T")[0]}`;
}

async function gatherContext() {
  const context = {
    workingDirectory: process.cwd(),
    files: [],
    commands: [],
    changes: [],
  };

  // Get recently modified files
  try {
    const recentFiles = execSync(
      'find . -type f -name "*.js" -mmin -60 -not -path "./node_modules/*" | head -20',
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    context.files = recentFiles;
  } catch {
    // Ignore errors
  }

  // Get git changes
  try {
    const gitStatus = execSync("git status --porcelain", { encoding: "utf8" });
    context.changes = gitStatus
      .trim()
      .split("\n")
      .filter((l) => l);
  } catch {
    // Not a git repo
  }

  // Get recent commands from bash history
  try {
    const history = execSync("tail -50 ~/.bash_history 2>/dev/null || true", {
      encoding: "utf8",
    });

    context.commands = history
      .trim()
      .split("\n")
      .filter((cmd) => cmd && !cmd.startsWith("#"))
      .slice(-20);
  } catch {
    // History not available
  }

  return context;
}

async function generateSummary() {
  const summary = {
    topics: [],
    technologies: [],
    actions: [],
  };

  // Analyze files for technologies
  try {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));

    // Extract key dependencies
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    const keyTechs = [...deps, ...devDeps].filter((dep) =>
      [
        "react",
        "vue",
        "angular",
        "express",
        "next",
        "gatsby",
        "webpack",
        "typescript",
      ].some((tech) => dep.includes(tech)),
    );

    summary.technologies = [...new Set(keyTechs)];
  } catch {
    // No package.json
  }

  // Analyze recent git commits for actions
  try {
    const commits = execSync("git log --oneline -10", { encoding: "utf8" })
      .trim()
      .split("\n");

    const actionWords = [
      "add",
      "fix",
      "update",
      "implement",
      "create",
      "refactor",
      "remove",
    ];

    for (const commit of commits) {
      for (const action of actionWords) {
        if (commit.toLowerCase().includes(action)) {
          summary.actions.push(commit.substring(0, 60));
          break;
        }
      }
    }
  } catch {
    // Not a git repo
  }

  // Extract topics from file names
  try {
    const files = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" | head -50',
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n");

    const topics = new Set();
    for (const file of files) {
      const parts = path.basename(file, ".js").split("-");
      for (const part of parts) {
        if (part.length > 3 && !["test", "spec", "index"].includes(part)) {
          topics.add(part);
        }
      }
    }

    summary.topics = Array.from(topics).slice(0, 10);
  } catch {
    // Ignore errors
  }

  return summary;
}

async function gatherMetadata() {
  const metadata = {
    nodeVersion: process.version,
    platform: process.platform,
    projectName: null,
    gitBranch: null,
    lastCommit: null,
  };

  // Get project name
  try {
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    metadata.projectName = pkg.name;
  } catch {
    // No package.json
  }

  // Get git info
  try {
    metadata.gitBranch = execSync("git branch --show-current", {
      encoding: "utf8",
    }).trim();

    const lastCommit = execSync('git log -1 --format="%H|%s"', {
      encoding: "utf8",
    }).trim();
    const [hash, subject] = lastCommit.split("|");
    metadata.lastCommit = {
      hash: hash.substring(0, 7),
      message: subject,
    };
  } catch {
    // Not a git repo
  }

  return metadata;
}

function formatAsMarkdown(data) {
  let md = `# ${data.title}\n\n`;

  // Metadata
  md += `**Date**: ${data.timestamp}\n`;
  if (data.tags.length > 0) {
    md += `**Tags**: ${data.tags.map((t) => `\`${t}\``).join(", ")}\n`;
  }
  if (data.metadata.projectName) {
    md += `**Project**: ${data.metadata.projectName}\n`;
  }
  if (data.metadata.gitBranch) {
    md += `**Branch**: ${data.metadata.gitBranch}\n`;
  }
  md += "\n";

  // Summary
  if (data.summary) {
    md += "## Summary\n\n";

    if (data.summary.topics.length > 0) {
      md += `**Topics**: ${data.summary.topics.join(", ")}\n`;
    }
    if (data.summary.technologies.length > 0) {
      md += `**Technologies**: ${data.summary.technologies.join(", ")}\n`;
    }
    if (data.summary.actions.length > 0) {
      md += "\n**Recent Actions**:\n";
      for (const action of data.summary.actions) {
        md += `- ${action}\n`;
      }
    }
    md += "\n";
  }

  // Context
  md += "## Context\n\n";

  if (data.context.files.length > 0) {
    md += "### Files Modified\n\n";
    for (const file of data.context.files) {
      md += `- ${file}\n`;
    }
    md += "\n";
  }

  if (data.context.changes.length > 0) {
    md += "### Git Changes\n\n```\n";
    md += data.context.changes.join("\n");
    md += "\n```\n\n";
  }

  if (data.context.commands.length > 0) {
    md += "### Recent Commands\n\n```bash\n";
    md += data.context.commands.join("\n");
    md += "\n```\n\n";
  }

  // Metadata footer
  md += "---\n\n";
  md += `*Generated by save-conversation on ${data.timestamp}*\n`;

  return md;
}

function formatAsClaudeContext(data) {
  let claude = `# Claude Development Context\n\n`;

  // Quick reference section
  claude += "## Quick Reference\n\n";

  if (data.metadata.projectName) {
    claude += `- **Project**: ${data.metadata.projectName}\n`;
  }
  if (data.metadata.gitBranch) {
    claude += `- **Current Branch**: ${data.metadata.gitBranch}\n`;
  }
  if (data.summary?.technologies.length > 0) {
    claude += `- **Stack**: ${data.summary.technologies.join(", ")}\n`;
  }
  claude += "\n";

  // Current focus
  if (data.summary?.actions.length > 0) {
    claude += "## Current Focus\n\n";
    claude += "Recent work includes:\n";
    for (const action of data.summary.actions.slice(0, 5)) {
      claude += `- ${action}\n`;
    }
    claude += "\n";
  }

  // Active files
  if (data.context.files.length > 0) {
    claude += "## Active Files\n\n";
    claude += "Currently working on:\n";
    for (const file of data.context.files.slice(0, 10)) {
      claude += `- ${file}\n`;
    }
    claude += "\n";
  }

  // Important commands
  if (data.context.commands.length > 0) {
    claude += "## Useful Commands\n\n```bash\n";

    // Filter for interesting commands
    const interestingCommands = data.context.commands
      .filter(
        (cmd) =>
          cmd.includes("npm") ||
          cmd.includes("git") ||
          cmd.includes("test") ||
          cmd.includes("build"),
      )
      .slice(-10);

    claude += interestingCommands.join("\n");
    claude += "\n```\n\n";
  }

  // Notes section
  claude += "## Notes\n\n";
  claude += "_Add any important notes or context here_\n\n";

  // Timestamp
  claude += "---\n\n";
  claude += `*Context saved: ${data.timestamp}*\n`;

  return claude;
}

async function updateConversationIndex(directory, conversationData) {
  const indexPath = path.join(directory, "index.json");
  let index = [];

  // Load existing index
  try {
    const existing = await fs.readFile(indexPath, "utf8");
    index = JSON.parse(existing);
  } catch {
    // No index yet
  }

  // Add new conversation
  index.unshift({
    file: conversationData.file,
    title: conversationData.title,
    timestamp: conversationData.timestamp,
    tags: conversationData.tags,
    summary: conversationData.summary?.topics || [],
  });

  // Keep only last 100 conversations
  index = index.slice(0, 100);

  // Save updated index
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

  // Also create a markdown index
  let mdIndex = "# Conversation Index\n\n";

  // Group by date
  const byDate = {};
  for (const conv of index) {
    const date = conv.timestamp.split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(conv);
  }

  for (const [date, convs] of Object.entries(byDate)) {
    mdIndex += `## ${date}\n\n`;
    for (const conv of convs) {
      mdIndex += `- [${conv.title}](${conv.file})`;
      if (conv.tags.length > 0) {
        mdIndex += ` - ${conv.tags.map((t) => `\`${t}\``).join(", ")}`;
      }
      mdIndex += "\n";
    }
    mdIndex += "\n";
  }

  await fs.writeFile(path.join(directory, "README.md"), mdIndex);
}
