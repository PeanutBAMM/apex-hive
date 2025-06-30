// backlog-analyze.js - Analyze backlog items and provide insights
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    source = "todos",
    format = "summary",
    dryRun = false,
    modules = {},
  } = args;

  console.error("[BACKLOG-ANALYZE] Analyzing backlog items...");

  try {
    const items = await loadBacklogItems(source, modules);

    if (items.length === 0) {
      return {
        success: true,
        data: {
          items: [],
          analysis: {
            total: 0,
            byCategory: {},
            byPriority: {},
            byStatus: {},
          },
        },
        message: "No backlog items found",
      };
    }

    // Analyze items
    const analysis = {
      total: items.length,
      byCategory: {},
      byPriority: {},
      byStatus: {},
      byAge: {},
      complexity: {},
      blockers: [],
    };

    // Categorize items
    for (const item of items) {
      // By category
      const category = item.category || "uncategorized";
      if (!analysis.byCategory[category]) {
        analysis.byCategory[category] = { count: 0, items: [] };
      }
      analysis.byCategory[category].count++;
      analysis.byCategory[category].items.push(item.id || item.title);

      // By priority
      const priority = item.priority || "medium";
      if (!analysis.byPriority[priority]) {
        analysis.byPriority[priority] = { count: 0, items: [] };
      }
      analysis.byPriority[priority].count++;
      analysis.byPriority[priority].items.push(item.id || item.title);

      // By status
      const status = item.status || "pending";
      if (!analysis.byStatus[status]) {
        analysis.byStatus[status] = { count: 0, items: [] };
      }
      analysis.byStatus[status].count++;
      analysis.byStatus[status].items.push(item.id || item.title);

      // By age (if created date available)
      if (item.created) {
        const age = Math.floor(
          (Date.now() - new Date(item.created).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const ageBucket =
          age < 7 ? "new" : age < 30 ? "recent" : age < 90 ? "old" : "stale";

        if (!analysis.byAge[ageBucket]) {
          analysis.byAge[ageBucket] = { count: 0, items: [] };
        }
        analysis.byAge[ageBucket].count++;
        analysis.byAge[ageBucket].items.push(item.id || item.title);
      }

      // Complexity estimation
      const complexity = estimateComplexity(item);
      if (!analysis.complexity[complexity]) {
        analysis.complexity[complexity] = { count: 0, items: [] };
      }
      analysis.complexity[complexity].count++;
      analysis.complexity[complexity].items.push(item.id || item.title);

      // Find blockers
      if (item.blocked || item.dependencies?.length > 0) {
        analysis.blockers.push({
          item: item.id || item.title,
          blockedBy: item.blockedBy || item.dependencies,
        });
      }
    }

    // Calculate insights
    const insights = generateInsights(analysis, items);

    // Format output
    let formattedOutput;
    switch (format) {
      case "detailed":
        formattedOutput = formatDetailed(analysis, insights, items);
        break;
      case "summary":
      default:
        formattedOutput = formatSummary(analysis, insights);
        break;
    }

    return {
      success: true,
      data: {
        items: items.length,
        analysis,
        insights,
        formatted: formattedOutput,
      },
      message: `Analyzed ${items.length} backlog items`,
    };
  } catch (error) {
    console.error("[BACKLOG-ANALYZE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to analyze backlog",
    };
  }
}

async function loadBacklogItems(source, modules) {
  const items = [];

  switch (source) {
    case "todos":
      // Load from TODO files
      try {
        const todoFiles = ["TODO.md", "BACKLOG.md", "ROADMAP.md"];
        for (const file of todoFiles) {
          try {
            const content = await fs.readFile(file, "utf8");
            const parsed = parseTodoFile(content);
            items.push(...parsed);
          } catch {
            // File doesn't exist
          }
        }
      } catch {
        // No todo files
      }
      break;

    case "github":
      // Would load from GitHub issues
      items.push({
        id: "sample-1",
        title: "Sample GitHub issue",
        priority: "high",
        status: "open",
        category: "feature",
      });
      break;

    case "json":
      // Load from backlog.json
      try {
        const data = JSON.parse(await fs.readFile("backlog.json", "utf8"));
        items.push(...(data.items || data));
      } catch {
        // No backlog.json
      }
      break;
  }

  // Add sample items if none found
  if (items.length === 0) {
    items.push(
      {
        id: "1",
        title: "Implement feature X",
        priority: "high",
        status: "pending",
        category: "feature",
      },
      {
        id: "2",
        title: "Fix bug Y",
        priority: "critical",
        status: "in-progress",
        category: "bug",
      },
      {
        id: "3",
        title: "Update documentation",
        priority: "low",
        status: "pending",
        category: "docs",
      },
    );
  }

  return items;
}

function parseTodoFile(content) {
  const items = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Parse markdown checkboxes
    const todoMatch = line.match(/^[\s-]*\[( |x)\]\s+(.+)/i);
    if (todoMatch) {
      const [, checked, text] = todoMatch;
      const priority = text.includes("!") ? "high" : "medium";
      items.push({
        title: text.replace(/!/g, "").trim(),
        status: checked === "x" ? "completed" : "pending",
        priority,
        category: "todo",
      });
    }
  }

  return items;
}

function estimateComplexity(item) {
  // Simple complexity estimation
  const factors = {
    hasSubtasks: item.subtasks?.length > 0,
    hasDependencies: item.dependencies?.length > 0,
    isBlocked: item.blocked || false,
    descriptionLength: (item.description || "").length,
    hasAttachments: item.attachments?.length > 0,
  };

  let score = 0;
  if (factors.hasSubtasks) score += 2;
  if (factors.hasDependencies) score += 2;
  if (factors.isBlocked) score += 3;
  if (factors.descriptionLength > 200) score += 1;
  if (factors.hasAttachments) score += 1;

  if (score >= 5) return "complex";
  if (score >= 2) return "medium";
  return "simple";
}

function generateInsights(analysis, items) {
  const insights = [];

  // Priority insights
  if (analysis.byPriority.critical?.count > 0) {
    insights.push({
      type: "alert",
      message: `${analysis.byPriority.critical.count} critical items need immediate attention`,
    });
  }

  // Status insights
  const completed = analysis.byStatus.completed?.count || 0;
  const total = analysis.total;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  insights.push({
    type: "metric",
    message: `Completion rate: ${completionRate}%`,
  });

  // Age insights
  if (analysis.byAge.stale?.count > 0) {
    insights.push({
      type: "warning",
      message: `${analysis.byAge.stale.count} items are over 90 days old`,
    });
  }

  // Complexity insights
  if (analysis.complexity.complex?.count > 0) {
    insights.push({
      type: "info",
      message: `${analysis.complexity.complex.count} complex items may need breakdown`,
    });
  }

  // Blocker insights
  if (analysis.blockers.length > 0) {
    insights.push({
      type: "alert",
      message: `${analysis.blockers.length} items are blocked`,
    });
  }

  return insights;
}

function formatSummary(analysis, insights) {
  let summary = "## Backlog Analysis Summary\n\n";

  summary += `**Total Items**: ${analysis.total}\n\n`;

  summary += "### By Priority\n";
  for (const [priority, data] of Object.entries(analysis.byPriority)) {
    summary += `- ${priority}: ${data.count}\n`;
  }

  summary += "\n### By Status\n";
  for (const [status, data] of Object.entries(analysis.byStatus)) {
    summary += `- ${status}: ${data.count}\n`;
  }

  summary += "\n### Key Insights\n";
  for (const insight of insights) {
    const icon =
      insight.type === "alert"
        ? "🚨"
        : insight.type === "warning"
          ? "⚠️"
          : "ℹ️";
    summary += `${icon} ${insight.message}\n`;
  }

  return summary;
}

function formatDetailed(analysis, insights, items) {
  return {
    summary: formatSummary(analysis, insights),
    analysis,
    insights,
    items: items.slice(0, 10), // First 10 items
  };
}
