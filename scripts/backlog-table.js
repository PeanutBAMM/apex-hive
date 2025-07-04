// backlog-table.js - Generate table view of backlog items
import { writeFile } from "../modules/file-ops.js";

export async function run(args = {}) {
  const {
    columns = ["id", "title", "priority", "status", "assignee"],
    width = "auto",
    export: exportFormat = null,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[BACKLOG-TABLE] Generating table view...");

  try {
    // Load backlog items
    const displayModule = await import("./backlog-display.js");
    const displayResult = await displayModule.run({
      format: "json",
      limit: 100,
      modules,
    });

    if (!displayResult.success || displayResult.data.items.length === 0) {
      return {
        success: true,
        data: {
          table: "No backlog items to display",
          rows: 0,
        },
        message: "No backlog items found",
      };
    }

    const items = displayResult.data.items;

    // Calculate column widths
    const colWidths = calculateColumnWidths(items, columns, width);

    // Generate table
    let table = "";

    // Add title if exporting
    if (exportFormat) {
      table += `# Backlog Table - ${new Date().toISOString().split("T")[0]}\n\n`;
    }

    // Generate ASCII table
    const asciiTable = generateASCIITable(items, columns, colWidths);
    table += asciiTable;

    // Add summary
    table += `\n\nTotal items: ${items.length}\n`;

    // Export if requested
    if (exportFormat && !dryRun) {
      const filename = `backlog-table-${Date.now()}`;

      switch (exportFormat) {
        case "markdown":
        case "md":
          const mdTable = generateMarkdownTable(items, columns);
          await writeFile(`${filename}.md`, mdTable);
          table = mdTable;
          break;

        case "csv":
          const csvTable = generateCSVTable(items, columns);
          await writeFile(`${filename}.csv`, csvTable);
          break;

        case "html":
          const htmlTable = generateHTMLTable(items, columns);
          await writeFile(`${filename}.html`, htmlTable);
          break;

        case "json":
          await writeFile(`${filename}.json`, JSON.stringify(items, null, 2));
          break;

        default:
          // ASCII table already generated
          await writeFile(`${filename}.txt`, table);
      }
    }

    return {
      success: true,
      data: {
        table,
        rows: items.length,
        columns: columns.length,
        exported: exportFormat ? `${filename}.${exportFormat}` : null,
      },
      message: `Generated table with ${items.length} rows`,
    };
  } catch (error) {
    console.error("[BACKLOG-TABLE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to generate table",
    };
  }
}

function calculateColumnWidths(items, columns, maxWidth) {
  const minWidths = {
    id: 6,
    title: 20,
    priority: 10,
    status: 12,
    assignee: 12,
    category: 10,
    effort: 6,
    value: 6,
    score: 6,
  };

  const widths = {};

  // Calculate max width needed for each column
  for (const col of columns) {
    let maxLen = col.length; // Header length

    for (const item of items) {
      const value = formatCellValue(item[col], col);
      maxLen = Math.max(maxLen, value.length);
    }

    widths[col] = Math.max(minWidths[col] || 10, Math.min(maxLen + 2, 50));
  }

  // Adjust if total width exceeds max
  if (maxWidth !== "auto") {
    const totalWidth = Object.values(widths).reduce((sum, w) => sum + w + 1, 0);
    if (totalWidth > maxWidth) {
      // Shrink title column first
      const excess = totalWidth - maxWidth;
      widths.title = Math.max(20, widths.title - excess);
    }
  }

  return widths;
}

function formatCellValue(value, column) {
  if (value === null || value === undefined) {
    return "-";
  }

  switch (column) {
    case "priority":
    case "status":
    case "category":
      return value.toString().toUpperCase();

    case "assignee":
      return Array.isArray(value) ? value[0] || "-" : value.toString();

    case "effort":
    case "value":
    case "score":
      return typeof value === "number" ? value.toString() : "-";

    case "created":
    case "updated":
      return value ? new Date(value).toISOString().split("T")[0] : "-";

    default:
      return value.toString();
  }
}

function generateASCIITable(items, columns, colWidths) {
  let table = "";

  // Top border
  table += "┌";
  for (let i = 0; i < columns.length; i++) {
    table += "─".repeat(colWidths[columns[i]]);
    table += i < columns.length - 1 ? "┬" : "┐";
  }
  table += "\n";

  // Header row
  table += "│";
  for (const col of columns) {
    const header = col.charAt(0).toUpperCase() + col.slice(1);
    table += " " + header.padEnd(colWidths[col] - 2) + " │";
  }
  table += "\n";

  // Header separator
  table += "├";
  for (let i = 0; i < columns.length; i++) {
    table += "─".repeat(colWidths[columns[i]]);
    table += i < columns.length - 1 ? "┼" : "┤";
  }
  table += "\n";

  // Data rows
  for (const item of items) {
    table += "│";
    for (const col of columns) {
      const value = formatCellValue(item[col], col);
      const truncated =
        value.length > colWidths[col] - 2
          ? value.substring(0, colWidths[col] - 5) + "..."
          : value;
      table += " " + truncated.padEnd(colWidths[col] - 2) + " │";
    }
    table += "\n";
  }

  // Bottom border
  table += "└";
  for (let i = 0; i < columns.length; i++) {
    table += "─".repeat(colWidths[columns[i]]);
    table += i < columns.length - 1 ? "┴" : "┘";
  }
  table += "\n";

  return table;
}

function generateMarkdownTable(items, columns) {
  let table = "# Backlog Table\n\n";

  // Header
  table +=
    "| " +
    columns.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(" | ") +
    " |\n";
  table += "| " + columns.map(() => "---").join(" | ") + " |\n";

  // Rows
  for (const item of items) {
    const values = columns.map((col) => {
      const value = formatCellValue(item[col], col);
      // Escape pipe characters in markdown
      return value.replace(/\|/g, "\\|");
    });
    table += "| " + values.join(" | ") + " |\n";
  }

  table += `\n**Total items**: ${items.length}\n`;

  return table;
}

function generateCSVTable(items, columns) {
  let csv = columns.join(",") + "\n";

  for (const item of items) {
    const values = columns.map((col) => {
      const value = formatCellValue(item[col], col);
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(",") || value.includes('"')) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csv += values.join(",") + "\n";
  }

  return csv;
}

function generateHTMLTable(items, columns) {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Backlog Table</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .priority-critical { color: #d32f2f; font-weight: bold; }
    .priority-high { color: #f57c00; }
    .priority-medium { color: #388e3c; }
    .priority-low { color: #616161; }
    .status-completed { text-decoration: line-through; opacity: 0.6; }
  </style>
</head>
<body>
  <h1>Backlog Table</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <table>
    <thead>
      <tr>
        ${columns.map((c) => `<th>${c.charAt(0).toUpperCase() + c.slice(1)}</th>`).join("")}
      </tr>
    </thead>
    <tbody>`;

  for (const item of items) {
    const priorityClass = item.priority ? `priority-${item.priority}` : "";
    const statusClass = item.status === "completed" ? "status-completed" : "";

    html += `
      <tr class="${priorityClass} ${statusClass}">
        ${columns
          .map((col) => {
            const value = formatCellValue(item[col], col);
            return `<td>${escapeHTML(value)}</td>`;
          })
          .join("")}
      </tr>`;
  }

  html += `
    </tbody>
  </table>
  
  <p><strong>Total items</strong>: ${items.length}</p>
</body>
</html>`;

  return html;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
