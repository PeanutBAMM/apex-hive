// backlog-display.js - Display backlog in various formats
import { readFile } from "../modules/file-ops.js";
import { loadBacklogItems } from "../modules/backlog-parser.js";

export async function run(args = {}) {
  const {
    format = "list",
    filter = {},
    sort = "priority",
    limit = 20,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[BACKLOG-DISPLAY] Displaying backlog items...");

  try {
    // Get scored items if available
    let items = [];
    try {
      const scoreData = JSON.parse(await readFile("backlog-scores.json"));
      items = scoreData.items;
    } catch {
      // No scores, load raw items
      const analyzeModule = await import("./backlog-analyze.js");
      const result = await analyzeModule.run({ modules });

      if (result.success) {
        // Load detailed items
        items = await loadDetailedItems(modules);
      }
    }

    if (items.length === 0) {
      return {
        success: true,
        data: {
          items: [],
          display: "No backlog items to display",
        },
        message: "No backlog items found",
      };
    }

    // Apply filters
    let filtered = items;

    if (filter.status) {
      filtered = filtered.filter((item) => item.status === filter.status);
    }

    if (filter.priority) {
      filtered = filtered.filter((item) => item.priority === filter.priority);
    }

    if (filter.category) {
      filtered = filtered.filter((item) => item.category === filter.category);
    }

    if (filter.assigned) {
      filtered = filtered.filter(
        (item) =>
          item.assignees?.includes(filter.assigned) ||
          item.assignee === filter.assigned,
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower),
      );
    }

    // Sort items
    filtered = sortItems(filtered, sort);

    // Apply limit
    const limited = filtered.slice(0, limit);

    // Format display
    let display;
    switch (format) {
      case "table":
        display = formatTable(limited);
        break;

      case "cards":
        display = formatCards(limited);
        break;

      case "kanban":
        display = formatKanban(filtered); // Show all for kanban
        break;

      case "summary":
        display = formatSummary(filtered, limited);
        break;

      case "json":
        display = JSON.stringify(limited, null, 2);
        break;

      case "list":
      default:
        display = formatList(limited);
        break;
    }

    return {
      success: true,
      data: {
        total: items.length,
        filtered: filtered.length,
        displayed: limited.length,
        items: limited,
        display,
      },
      message: `Displaying ${limited.length} of ${filtered.length} items`,
    };
  } catch (error) {
    console.error("[BACKLOG-DISPLAY] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to display backlog",
    };
  }
}

async function loadDetailedItems(modules) {
  // Load items from BACKLOG.md using the new parser
  return await loadBacklogItems();
}

function sortItems(items, sortBy) {
  const sorted = [...items];

  switch (sortBy) {
    case "priority":
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      sorted.sort(
        (a, b) =>
          (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99),
      );
      break;

    case "score":
      sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
      break;

    case "effort":
      sorted.sort((a, b) => (a.effort || 0) - (b.effort || 0));
      break;

    case "value":
      sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
      break;

    case "status":
      sorted.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
      break;

    case "created":
      sorted.sort(
        (a, b) =>
          new Date(b.created || 0).getTime() -
          new Date(a.created || 0).getTime(),
      );
      break;

    case "updated":
      sorted.sort(
        (a, b) =>
          new Date(b.updated || 0).getTime() -
          new Date(a.updated || 0).getTime(),
      );
      break;

    default:
    // Keep original order
  }

  return sorted;
}

function formatList(items) {
  let output = "";

  for (const item of items) {
    const priority = item.priority ? `[${item.priority.toUpperCase()}]` : "";
    const status = item.status ? `(${item.status})` : "";
    const score = item.score ? ` - Score: ${Math.round(item.score)}` : "";

    output += `${item.id || "-"}. ${item.title} ${priority} ${status}${score}\n`;

    if (item.assignee || item.assignees?.length > 0) {
      const assigned = item.assignee || item.assignees.join(", ");
      output += `   Assigned to: ${assigned}\n`;
    }

    output += "\n";
  }

  return output;
}

function formatTable(items) {
  // Simple ASCII table
  const headers = ["ID", "Title", "Priority", "Status", "Assignee"];
  const colWidths = [6, 40, 10, 12, 15];

  let table = "";

  // Header
  table += "┌" + colWidths.map((w) => "─".repeat(w)).join("┬") + "┐\n";
  table += "│";
  headers.forEach((h, i) => {
    table += ` ${h.padEnd(colWidths[i] - 2)} │`;
  });
  table += "\n";
  table += "├" + colWidths.map((w) => "─".repeat(w)).join("┼") + "┤\n";

  // Rows
  for (const item of items) {
    table += "│";
    const values = [
      (item.id || "-").toString().substring(0, colWidths[0] - 2),
      (item.title || "").substring(0, colWidths[1] - 2),
      (item.priority || "-").substring(0, colWidths[2] - 2),
      (item.status || "-").substring(0, colWidths[3] - 2),
      (item.assignee || item.assignees?.[0] || "-").substring(
        0,
        colWidths[4] - 2,
      ),
    ];

    values.forEach((v, i) => {
      table += ` ${v.padEnd(colWidths[i] - 2)} │`;
    });
    table += "\n";
  }

  // Footer
  table += "└" + colWidths.map((w) => "─".repeat(w)).join("┴") + "┘\n";

  return table;
}

function formatCards(items) {
  let output = "";

  for (const item of items) {
    output += "┌────────────────────────────────────────┐\n";
    output += `│ ${(item.title || "Untitled").padEnd(38)} │\n`;
    output += "├────────────────────────────────────────┤\n";
    output += `│ ID: ${(item.id || "-").toString().padEnd(34)} │\n`;
    output += `│ Priority: ${(item.priority || "-").padEnd(28)} │\n`;
    output += `│ Status: ${(item.status || "-").padEnd(30)} │\n`;

    if (item.score) {
      output += `│ Score: ${Math.round(item.score).toString().padEnd(31)} │\n`;
    }

    if (item.effort || item.value) {
      output +=
        `│ Effort: ${item.effort || "-"} | Value: ${item.value || "-"}`.padEnd(
          40,
        ) + "│\n";
    }

    output += "└────────────────────────────────────────┘\n\n";
  }

  return output;
}

function formatKanban(items) {
  // Group by status
  const columns = {
    pending: [],
    "in-progress": [],
    review: [],
    completed: [],
    other: [],
  };

  for (const item of items) {
    const status = item.status || "pending";
    const column = columns[status] || columns.other;
    column.push(item);
  }

  let output = "";
  const colWidth = 30;

  // Headers
  const headers = Object.keys(columns).filter(
    (k) => k !== "other" || columns.other.length > 0,
  );
  output +=
    headers.map((h) => h.toUpperCase().padEnd(colWidth)).join(" │ ") + "\n";
  output += headers.map(() => "─".repeat(colWidth)).join("─┼─") + "\n";

  // Find max rows
  const maxRows = Math.max(...headers.map((h) => columns[h].length));

  // Rows
  for (let i = 0; i < maxRows; i++) {
    const row = headers.map((h) => {
      const item = columns[h][i];
      if (item) {
        const title = item.title.substring(0, colWidth - 4);
        const priority = item.priority
          ? `[${item.priority.charAt(0).toUpperCase()}]`
          : "";
        return `${title} ${priority}`.padEnd(colWidth);
      }
      return " ".repeat(colWidth);
    });

    output += row.join(" │ ") + "\n";
  }

  // Summary
  output += "\n";
  headers.forEach((h) => {
    output += `${h}: ${columns[h].length} items\n`;
  });

  return output;
}

function formatSummary(allItems, displayedItems) {
  let summary = "## Backlog Summary\n\n";

  // Overall stats
  summary += `**Total Items**: ${allItems.length}\n`;
  summary += `**Displayed**: ${displayedItems.length}\n\n`;

  // By priority
  const byPriority = {};
  for (const item of allItems) {
    const p = item.priority || "none";
    byPriority[p] = (byPriority[p] || 0) + 1;
  }

  summary += "### By Priority\n";
  for (const [priority, count] of Object.entries(byPriority)) {
    summary += `- ${priority}: ${count}\n`;
  }

  // By status
  const byStatus = {};
  for (const item of allItems) {
    const s = item.status || "unknown";
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  summary += "\n### By Status\n";
  for (const [status, count] of Object.entries(byStatus)) {
    summary += `- ${status}: ${count}\n`;
  }

  // Top items
  summary += "\n### Top Items\n";
  for (const item of displayedItems.slice(0, 5)) {
    summary += `- ${item.title} [${item.priority || "none"}]\n`;
  }

  return summary;
}
