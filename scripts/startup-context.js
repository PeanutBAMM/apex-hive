#!/usr/bin/env node
/**
 * Intelligent startup context analyzer
 * Provides comprehensive overview of project state and previous work
 */

import { readFile, batchRead } from "../modules/file-ops.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// High value context files
const CONTEXT_FILES = [
  "CLAUDE.md",
  "status-report.md",
  "BACKLOG.md",
  "issues-report.md",
  "migration-status.md",
];

// Write to stderr to avoid stdout pollution
function logError(message) {
  process.stderr.write(`[STARTUP-CONTEXT] ${message}\n`);
}

async function getLatestConversation() {
  try {
    const conversationsDir = join(rootDir, "conversations");
    const files = await fs.readdir(conversationsDir);

    // Filter markdown files and sort by timestamp
    const mdFiles = files
      .filter((f) => f.endsWith(".md") && !f.includes("index"))
      .sort((a, b) => b.localeCompare(a)); // Latest first

    if (mdFiles.length === 0) {
      return null;
    }

    // Read the latest conversation
    const latestFile = join(conversationsDir, mdFiles[0]);
    const content = await readFile(latestFile);

    // Extract comprehensive info
    const titleMatch = content.match(/^# (.+)$/m);
    const tagsMatch = content.match(/\*\*Tags\*\*: `(.+)`/);
    const branchMatch = content.match(/\*\*Branch\*\*: (.+)/);
    const dateMatch = content.match(/\*\*Date\*\*: (.+)/);

    // Get full summary section
    const summaryMatch = content.match(
      /## Conversation Summary\n\n([\s\S]*?)(?=\n##|$)/,
    );
    let fullSummary = "No summary available";

    if (summaryMatch) {
      // Extract key sections from summary
      const accomplishmentsMatch = summaryMatch[1].match(
        /### What We Accomplished\n\n([\s\S]*?)(?=\n###|$)/,
      );
      const scopeMatch = summaryMatch[1].match(
        /### Scope of Changes\n\n([\s\S]*?)(?=\n###|$)/,
      );
      const challengesMatch = summaryMatch[1].match(
        /### Challenges & Solutions\n\n([\s\S]*?)(?=\n###|$)/,
      );

      fullSummary = [];
      if (accomplishmentsMatch)
        fullSummary.push(accomplishmentsMatch[1].trim());
      if (scopeMatch) fullSummary.push(scopeMatch[1].trim());
      if (challengesMatch) fullSummary.push(challengesMatch[1].trim());
      fullSummary = fullSummary.join("\n\n");
    }

    const topicsMatch = content.match(/\*\*Topics\*\*: (.+)/);

    return {
      file: mdFiles[0],
      title: titleMatch ? titleMatch[1] : "Unknown",
      tags: tagsMatch
        ? tagsMatch[1].split("`, `").map((t) => t.replace(/`/g, ""))
        : [],
      branch: branchMatch ? branchMatch[1] : "unknown",
      date: dateMatch ? dateMatch[1] : "unknown",
      summary: fullSummary,
      topics: topicsMatch ? topicsMatch[1].split(", ") : [],
    };
  } catch (error) {
    logError(`Failed to read conversation: ${error.message}`);
    return null;
  }
}

async function getGitContext() {
  try {
    const branch = execSync("git branch --show-current", {
      encoding: "utf8",
    }).trim();
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    const lastCommit = execSync("git log -1 --oneline", {
      encoding: "utf8",
    }).trim();
    const recentCommits = execSync("git log --oneline -3", { encoding: "utf8" })
      .trim()
      .split("\n");

    // Get modified files
    const modifiedFiles = status
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.substring(3).trim());

    // Check if we're ahead/behind remote
    let remoteStatus = "unknown";
    try {
      execSync("git fetch --dry-run 2>&1", { encoding: "utf8" });
      const ahead = execSync("git rev-list --count @{u}..HEAD", {
        encoding: "utf8",
      }).trim();
      const behind = execSync("git rev-list --count HEAD..@{u}", {
        encoding: "utf8",
      }).trim();
      remoteStatus = `${ahead} ahead, ${behind} behind`;
    } catch {}

    return {
      branch,
      hasChanges: status.length > 0,
      changeCount: modifiedFiles.length,
      modifiedFiles: modifiedFiles.slice(0, 5), // Show first 5
      lastCommit,
      recentCommits,
      remoteStatus,
    };
  } catch (error) {
    logError(`Failed to get git context: ${error.message}`);
    return null;
  }
}

async function getCacheStatus() {
  try {
    // Import cache modules
    const { commandCache, fileCache, searchCache, conversationCache } =
      await import("../modules/unified-cache.js");

    const cacheStats = {
      readmes: 0,
      highValueDocs: 0,
      conversations: 0,
      scripts: 0,
      recipes: 0,
      totalSize: 0,
    };

    // Get stats from each cache
    const fileStats = await fileCache.stats();
    const convStats = await conversationCache.stats();
    const commandStats = await commandCache.stats();

    // Estimate based on known patterns from cache-warm-all
    // Since we can't iterate keys, we use the total item count
    if (fileStats.items > 0) {
      // Approximate distribution based on cache-warm-all patterns
      cacheStats.readmes = Math.floor(fileStats.items * 0.4); // ~40% READMEs
      cacheStats.highValueDocs = Math.floor(fileStats.items * 0.3); // ~30% docs
      cacheStats.scripts = Math.floor(fileStats.items * 0.2); // ~20% scripts
      cacheStats.recipes = Math.floor(fileStats.items * 0.1); // ~10% other
    }

    cacheStats.conversations = convStats.items;

    // Calculate total size
    cacheStats.totalSize = fileStats.size + convStats.size + commandStats.size;

    return cacheStats;
  } catch (error) {
    logError(`Failed to get cache status: ${error.message}`);
    return null;
  }
}

async function getSystemIssues() {
  try {
    // Run detect-issues with limited output
    const detectModule = await import("./detect-issues.js");
    const result = await detectModule.run({
      page: 1,
      limit: 3,
      categories: ["code", "security"],
      report: false,
    });

    if (result.success && result.data) {
      const { summary, issues } = result.data;

      // Get top 3 issues
      const topIssues = [];
      for (const severity of ["critical", "high", "medium"]) {
        if (issues[severity] && issues[severity].length > 0) {
          topIssues.push(...issues[severity].slice(0, 3 - topIssues.length));
        }
        if (topIssues.length >= 3) break;
      }

      return {
        summary,
        topIssues: topIssues.map((issue) => ({
          type: issue.type,
          severity: issue.severity,
          file: issue.file,
          message: issue.message,
        })),
      };
    }

    return null;
  } catch (error) {
    logError(`Failed to get system issues: ${error.message}`);
    return null;
  }
}

async function getBacklogItems() {
  try {
    const backlogPath = join(rootDir, "BACKLOG.md");
    const content = await readFile(backlogPath);

    // Extract high priority items
    const highPriorityMatch = content.match(
      /## 🔥 High Priority\n\n([\s\S]*?)(?=\n##|$)/,
    );
    const items = [];

    if (highPriorityMatch) {
      const itemMatches = highPriorityMatch[1].matchAll(
        /- \[ \] \*\*(.+?)\*\* - (.+?)(?=\n  -|\n- \[|\n##|$)/g,
      );
      for (const match of itemMatches) {
        items.push({
          title: match[1],
          description: match[2].trim(),
        });
      }
    }

    return items.slice(0, 5); // Top 5 items
  } catch (error) {
    logError(`Failed to read backlog: ${error.message}`);
    return [];
  }
}

async function getMigrationStatus() {
  try {
    const migrationPath = join(rootDir, "migration-status.md");
    if (
      await fs
        .access(migrationPath)
        .then(() => true)
        .catch(() => false)
    ) {
      const content = await readFile(migrationPath);

      // Extract progress
      const progressMatch = content.match(/Migrated: (\d+) \((.+?)%\)/);
      const remainingMatch = content.match(/Remaining: (\d+)/);

      if (progressMatch) {
        return {
          migrated: parseInt(progressMatch[1]),
          percentage: progressMatch[2],
          remaining: remainingMatch ? parseInt(remainingMatch[1]) : 0,
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function run(args = {}) {
  logError("Analyzing startup context...");

  try {
    // Gather all context in parallel
    const [conversation, git, cache, issues, backlog, migration] =
      await Promise.all([
        getLatestConversation(),
        getGitContext(),
        getCacheStatus(),
        getSystemIssues(),
        getBacklogItems(),
        getMigrationStatus(),
      ]);

    // Build focus recommendations
    const focusAreas = [];

    // Check if we should continue previous work
    if (conversation && migration && conversation.tags.includes("migration")) {
      focusAreas.push(
        `Continue cached file operations migration (${migration.percentage}% complete)`,
      );
    } else if (conversation && conversation.tags.includes("fix")) {
      focusAreas.push(`Verify fixes from previous session are working`);
    }

    // Add other focus areas
    if (issues && issues.summary.critical > 0) {
      focusAreas.push(`Fix ${issues.summary.critical} critical issues`);
    }
    if (git && git.changeCount > 5) {
      focusAreas.push(
        `Review and commit ${git.changeCount} uncommitted changes`,
      );
    }
    if (git && git.remoteStatus.includes("ahead")) {
      const ahead = git.remoteStatus.split(" ")[0];
      focusAreas.push(`Push ${ahead} commits to remote`);
    }

    // Build result
    const result = {
      previousSession: conversation
        ? {
            title: conversation.title,
            date: conversation.date,
            branch: conversation.branch,
            tags: conversation.tags,
            topics: conversation.topics,
            summary: conversation.summary,
          }
        : null,

      cacheStatus: cache
        ? {
            readmeFiles: cache.readmes,
            highValueDocs: cache.highValueDocs,
            conversations: cache.conversations,
            scripts: cache.scripts,
            recipes: cache.recipes,
            totalSize: `${(cache.totalSize / 1024).toFixed(2)} KB`,
          }
        : null,

      gitStatus: git
        ? {
            branch: git.branch,
            uncommittedChanges: git.changeCount,
            modifiedFiles: git.modifiedFiles,
            remoteStatus: git.remoteStatus,
            recentCommits: git.recentCommits,
          }
        : null,

      systemIssues: issues
        ? {
            critical: issues.summary.critical,
            high: issues.summary.high,
            medium: issues.summary.medium,
            total: issues.summary.total,
            topIssues: issues.topIssues,
          }
        : null,

      focusAndBacklog: {
        recommendedFocus: focusAreas,
        topBacklogItems: backlog,
      },

      migrationProgress: migration,
    };

    // Output clean JSON to stdout
    console.log(
      JSON.stringify(
        {
          success: true,
          data: result,
          message: "Startup context analysis complete",
        },
        null,
        2,
      ),
    );
  } catch (error) {
    // Error to stderr, clean JSON to stdout
    logError(`Error: ${error.message}`);
    console.log(
      JSON.stringify(
        {
          success: false,
          error: error.message,
          message: "Failed to analyze startup context",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}
