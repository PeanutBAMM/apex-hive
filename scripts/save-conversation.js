// save-conversation.js - Save AI conversation context
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import { conversationCache } from "../modules/unified-cache.js";
import crypto from "crypto";

export async function run(args = {}) {
  const {
    title,
    tags: inputTags = [],
    format = "markdown",
    directory = "conversations",
    autoCommit = false,
    dryRun = false,
    modules = {},
  } = args;

  // Ensure tags is always an array (handle string input from MCP)
  let tags;
  if (typeof inputTags === "string") {
    tags = inputTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  } else if (Array.isArray(inputTags)) {
    tags = inputTags;
  } else {
    tags = [];
  }

  console.error("[SAVE-CONVERSATION] Saving conversation context...");

  try {
    // Generate conversation data
    const conversationData = {
      timestamp: new Date().toISOString(),
      title: title || generateTitle(),
      tags,
      context: await gatherContext(),
      summary: await generateSummary(),
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

    // Generate a detailed narrative summary BEFORE formatting
    const narrativeSummary = await createTextSummary(
      conversationData.summary,
      conversationData.context,
      conversationData.metadata,
    );

    // Add narrative summary to conversation data
    conversationData.narrativeSummary = narrativeSummary;

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

    const result = {
      success: true,
      dryRun,
      data: {
        title: conversationData.title,
        tags,
        size: content.length,
        format,
        file: filepath,
        committed: autoCommit && !dryRun,
        summaryLength: narrativeSummary.length,
      },
      message: dryRun
        ? `Would save conversation to ${filepath}`
        : `Saved conversation to ${filepath}`,
    };

    return result;
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

  // Add narrative summary at the top
  if (data.narrativeSummary) {
    md += data.narrativeSummary + "\n\n";
    md += "---\n\n";
  }

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

  // Add narrative summary at the top
  if (data.narrativeSummary) {
    claude += data.narrativeSummary + "\n\n";
    claude += "---\n\n";
  }

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
    narrativeSummary: conversationData.narrativeSummary
      ? conversationData.narrativeSummary.substring(0, 200) + "..."
      : null,
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

// Helper function to retrieve recent conversations from cache
export async function getRecentConversations(limit = 10) {
  const conversations = [];

  try {
    // Get cache stats to find conversation keys
    const stats = await conversationCache.stats();

    // Filter for conversation keys and sort by timestamp
    const conversationKeys = stats.active
      .filter((item) => item.key.startsWith("conversation-"))
      .sort((a, b) => b.lastAccess - a.lastAccess)
      .slice(0, limit);

    // Retrieve each conversation
    for (const item of conversationKeys) {
      const conversation = await conversationCache.get(item.key);
      if (conversation) {
        conversations.push({
          ...conversation,
          cacheKey: item.key,
          hits: item.hits,
        });
      }
    }
  } catch (error) {
    console.error(
      "[SAVE-CONVERSATION] Error retrieving conversations:",
      error.message,
    );
  }

  return conversations;
}

// Helper to extract keywords from summary
export function extractKeywords(summary, count = 10) {
  // Simple keyword extraction based on frequency
  const words = summary
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4); // Skip short words

  const frequency = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Return top N most frequent words
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

// Helper to create text summary from data
async function createTextSummary(summaryData, context, metadata) {
  let narrative = [];

  // Opening context
  narrative.push("## Conversation Summary");
  narrative.push("");

  // Set the scene
  if (metadata.projectName) {
    narrative.push(
      `Today's development session focused on the **${metadata.projectName}** project${metadata.gitBranch ? ` on the \`${metadata.gitBranch}\` branch` : ""}.`,
    );
  } else {
    narrative.push(
      `This development session involved working on various aspects of the codebase.`,
    );
  }
  narrative.push("");

  // Describe the journey based on git commits
  if (summaryData && summaryData.actions && summaryData.actions.length > 0) {
    narrative.push("### What We Accomplished");
    narrative.push("");
    narrative.push(
      "Throughout this session, we made significant progress on several fronts:",
    );
    narrative.push("");

    // Group similar actions
    const implementActions = summaryData.actions.filter((a) =>
      a.toLowerCase().includes("implement"),
    );
    const fixActions = summaryData.actions.filter((a) =>
      a.toLowerCase().includes("fix"),
    );
    const updateActions = summaryData.actions.filter((a) =>
      a.toLowerCase().includes("update"),
    );
    const otherActions = summaryData.actions.filter(
      (a) =>
        !a.toLowerCase().includes("implement") &&
        !a.toLowerCase().includes("fix") &&
        !a.toLowerCase().includes("update"),
    );

    if (implementActions.length > 0) {
      narrative.push("**New Implementations:**");
      implementActions.slice(0, 3).forEach((action) => {
        narrative.push(`- ${action}`);
      });
      narrative.push("");
    }

    if (fixActions.length > 0) {
      narrative.push("**Issues Resolved:**");
      fixActions.slice(0, 3).forEach((action) => {
        narrative.push(`- ${action}`);
      });
      narrative.push("");
    }

    if (updateActions.length > 0) {
      narrative.push("**Updates & Improvements:**");
      updateActions.slice(0, 3).forEach((action) => {
        narrative.push(`- ${action}`);
      });
      narrative.push("");
    }

    if (
      otherActions.length > 0 &&
      implementActions.length + fixActions.length + updateActions.length < 3
    ) {
      narrative.push("**Other Changes:**");
      otherActions.slice(0, 2).forEach((action) => {
        narrative.push(`- ${action}`);
      });
      narrative.push("");
    }
  }

  // Describe the scope of changes
  if (context.files && context.files.length > 0) {
    narrative.push("### Scope of Changes");
    narrative.push("");
    narrative.push(
      `The session involved modifications to ${context.files.length} files across the codebase. Key areas of focus included:`,
    );
    narrative.push("");

    // Group files by directory/type
    const scriptFiles = context.files.filter((f) => f.includes("/scripts/"));
    const configFiles = context.files.filter((f) => f.includes("/config/"));
    const moduleFiles = context.files.filter((f) => f.includes("/modules/"));
    const docFiles = context.files.filter(
      (f) => f.includes("/docs/") || f.includes("README"),
    );
    const otherFiles = context.files.filter(
      (f) =>
        !f.includes("/scripts/") &&
        !f.includes("/config/") &&
        !f.includes("/modules/") &&
        !f.includes("/docs/") &&
        !f.includes("README"),
    );

    if (scriptFiles.length > 0) {
      narrative.push(
        `- **Scripts** (${scriptFiles.length} files): Core functionality and automation scripts`,
      );
    }
    if (configFiles.length > 0) {
      narrative.push(
        `- **Configuration** (${configFiles.length} files): System configuration and settings`,
      );
    }
    if (moduleFiles.length > 0) {
      narrative.push(
        `- **Modules** (${moduleFiles.length} files): Shared modules and utilities`,
      );
    }
    if (docFiles.length > 0) {
      narrative.push(
        `- **Documentation** (${docFiles.length} files): Documentation updates and improvements`,
      );
    }
    if (otherFiles.length > 0) {
      narrative.push(
        `- **Other** (${otherFiles.length} files): Various other components`,
      );
    }
    narrative.push("");
  }

  // Add challenges and solutions if we detect patterns
  const hasCache =
    context.files?.some((f) => f.includes("cache")) ||
    summaryData?.topics?.some((t) => t.includes("cache"));
  const hasConversation =
    context.files?.some((f) => f.includes("conversation")) ||
    summaryData?.topics?.some((t) => t.includes("conversation"));
  const hasFix = summaryData?.actions?.some((a) =>
    a.toLowerCase().includes("fix"),
  );

  if (hasCache || hasConversation || hasFix) {
    narrative.push("### Challenges & Solutions");
    narrative.push("");

    if (hasConversation && hasCache) {
      narrative.push(
        "One of the main challenges addressed in this session was implementing an effective conversation memory system. We explored different approaches for storing and retrieving conversation data, ultimately focusing on a unified solution that leverages both filesystem storage and caching for optimal performance.",
      );
      narrative.push("");
    } else if (hasCache) {
      narrative.push(
        "We worked on cache-related functionality, optimizing performance and ensuring efficient data retrieval across the system.",
      );
      narrative.push("");
    }

    if (hasFix) {
      narrative.push(
        "Several issues were identified and resolved during this session, improving the overall stability and functionality of the codebase.",
      );
      narrative.push("");
    }
  }

  // Technical details
  if (
    summaryData &&
    summaryData.technologies &&
    summaryData.technologies.length > 0
  ) {
    narrative.push("### Technical Stack");
    narrative.push("");
    narrative.push(
      `This session utilized the following technologies: **${summaryData.technologies.join(", ")}**`,
    );
    narrative.push("");
  }

  // Command activity
  if (context.commands && context.commands.length > 0) {
    const apexCommands = context.commands.filter((cmd) => cmd.includes("apex"));
    const gitCommands = context.commands.filter((cmd) => cmd.includes("git"));
    const npmCommands = context.commands.filter((cmd) => cmd.includes("npm"));

    if (
      apexCommands.length > 0 ||
      gitCommands.length > 0 ||
      npmCommands.length > 0
    ) {
      narrative.push("### Development Workflow");
      narrative.push("");
      narrative.push("The session followed a structured development workflow:");
      narrative.push("");

      if (apexCommands.length > 0) {
        narrative.push(
          `- **Apex commands** (${apexCommands.length}): Used for automation and task execution`,
        );
      }
      if (gitCommands.length > 0) {
        narrative.push(
          `- **Git operations** (${gitCommands.length}): Version control and collaboration`,
        );
      }
      if (npmCommands.length > 0) {
        narrative.push(
          `- **NPM commands** (${npmCommands.length}): Package management and builds`,
        );
      }
      narrative.push("");
    }
  }

  // Key topics and focus areas
  if (summaryData && summaryData.topics && summaryData.topics.length > 0) {
    narrative.push("### Key Topics");
    narrative.push("");
    narrative.push(
      `The main areas of focus during this session included: ${summaryData.topics.map((t) => `**${t}**`).join(", ")}.`,
    );
    narrative.push("");
  }

  // Closing summary
  narrative.push("### Summary");
  narrative.push("");

  const changeCount = context.changes?.length || 0;
  const fileCount = context.files?.length || 0;
  const actionCount = summaryData?.actions?.length || 0;

  if (changeCount > 0 || fileCount > 0 || actionCount > 0) {
    narrative.push(
      `This was a productive session with ${actionCount} significant actions taken, affecting ${fileCount} files. The changes made today contribute to the ongoing development and improvement of the project.`,
    );
  } else {
    narrative.push(
      "This session involved exploration and analysis of the codebase, setting the foundation for future development work.",
    );
  }

  // Join all parts into a coherent narrative
  return narrative.join("\n").trim();
}
