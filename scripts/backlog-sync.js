// backlog-sync.js - Sync backlog between different sources
import { promises as fs } from "fs";
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    source = "local",
    target = "github",
    direction = "push",
    dryRun = false,
    modules = {},
  } = args;

  console.error("[BACKLOG-SYNC] Syncing backlog items...");

  try {
    let sourceItems = [];
    let targetItems = [];

    // Load from source
    console.error(`[BACKLOG-SYNC] Loading from ${source}...`);
    sourceItems = await loadItems(source, modules);

    // Load from target
    console.error(`[BACKLOG-SYNC] Loading from ${target}...`);
    targetItems = await loadItems(target, modules);

    // Compare and find differences
    const comparison = compareItems(sourceItems, targetItems);

    // Determine sync actions
    const syncActions = [];

    switch (direction) {
      case "push":
        // Source -> Target
        for (const item of comparison.inSourceOnly) {
          syncActions.push({
            action: "create",
            target,
            item,
          });
        }
        for (const item of comparison.modified) {
          syncActions.push({
            action: "update",
            target,
            item: item.source,
          });
        }
        break;

      case "pull":
        // Target -> Source
        for (const item of comparison.inTargetOnly) {
          syncActions.push({
            action: "create",
            target: source,
            item,
          });
        }
        for (const item of comparison.modified) {
          syncActions.push({
            action: "update",
            target: source,
            item: item.target,
          });
        }
        break;

      case "sync":
        // Bidirectional sync (newer wins)
        for (const item of comparison.inSourceOnly) {
          syncActions.push({
            action: "create",
            target,
            item,
          });
        }
        for (const item of comparison.inTargetOnly) {
          syncActions.push({
            action: "create",
            target: source,
            item,
          });
        }
        for (const item of comparison.modified) {
          const newer =
            (item.source.updated || 0) > (item.target.updated || 0)
              ? "source"
              : "target";
          syncActions.push({
            action: "update",
            target: newer === "source" ? target : source,
            item: newer === "source" ? item.source : item.target,
          });
        }
        break;
    }

    // Execute sync actions
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      actions: [],
    };

    if (!dryRun && syncActions.length > 0) {
      console.error(
        `[BACKLOG-SYNC] Executing ${syncActions.length} sync actions...`,
      );

      for (const action of syncActions) {
        try {
          await executeSyncAction(action);
          if (action.action === "create") {
            results.created++;
          } else {
            results.updated++;
          }
          results.actions.push({
            ...action,
            status: "success",
          });
        } catch (error) {
          results.errors++;
          results.actions.push({
            ...action,
            status: "error",
            error: error.message,
          });
        }
      }
    } else {
      results.actions = syncActions.map((a) => ({ ...a, status: "dry-run" }));
    }

    return {
      success: true,
      dryRun,
      data: {
        source: {
          type: source,
          items: sourceItems.length,
        },
        target: {
          type: target,
          items: targetItems.length,
        },
        comparison,
        syncActions: syncActions.length,
        results,
      },
      message: dryRun
        ? `Would sync ${syncActions.length} items`
        : `Synced ${results.created + results.updated} items, ${results.errors} errors`,
    };
  } catch (error) {
    console.error("[BACKLOG-SYNC] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to sync backlog",
    };
  }
}

async function loadItems(source, modules) {
  const items = [];

  switch (source) {
    case "local":
    case "json":
      // Load from local JSON file
      try {
        const data = JSON.parse(await fs.readFile("backlog.json", "utf8"));
        items.push(...(Array.isArray(data) ? data : data.items || []));
      } catch {
        // No local file, return empty
      }
      break;

    case "github":
      // Load from GitHub issues
      try {
        const output = execSync(
          "gh issue list --json number,title,state,labels,assignees,body,createdAt,updatedAt --limit 100",
          {
            encoding: "utf8",
          },
        );
        const issues = JSON.parse(output);

        for (const issue of issues) {
          items.push({
            id: `gh-${issue.number}`,
            number: issue.number,
            title: issue.title,
            status: issue.state,
            labels: issue.labels.map((l) => l.name),
            assignees: issue.assignees.map((a) => a.login),
            description: issue.body,
            created: issue.createdAt,
            updated: issue.updatedAt,
            source: "github",
          });
        }
      } catch {
        // GitHub CLI not available or no issues
      }
      break;

    case "markdown":
      // Load from markdown files
      const mdFiles = ["TODO.md", "BACKLOG.md", "ROADMAP.md"];
      for (const file of mdFiles) {
        try {
          const content = await fs.readFile(file, "utf8");
          const parsed = parseMarkdown(content);
          items.push(...parsed);
        } catch {
          // File doesn't exist
        }
      }
      break;

    case "trello":
    case "jira":
    case "asana":
      // Would implement API integration
      console.error(`[BACKLOG-SYNC] ${source} integration not yet implemented`);
      break;
  }

  return items;
}

function parseMarkdown(content) {
  const items = [];
  const lines = content.split("\n");
  let currentSection = "general";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section headers
    if (line.startsWith("##")) {
      currentSection = line.replace(/^#+\s*/, "").toLowerCase();
      continue;
    }

    // Task items
    const taskMatch = line.match(/^[\s-]*\[( |x)\]\s+(.+)/i);
    if (taskMatch) {
      const [, checked, text] = taskMatch;
      items.push({
        id: `md-${i}`,
        title: text.trim(),
        status: checked === "x" ? "completed" : "pending",
        section: currentSection,
        source: "markdown",
      });
    }
  }

  return items;
}

function compareItems(sourceItems, targetItems) {
  const sourceMap = new Map(
    sourceItems.map((item) => [item.id || item.title, item]),
  );
  const targetMap = new Map(
    targetItems.map((item) => [item.id || item.title, item]),
  );

  const comparison = {
    inSourceOnly: [],
    inTargetOnly: [],
    inBoth: [],
    modified: [],
  };

  // Find items only in source
  for (const [id, item] of sourceMap) {
    if (!targetMap.has(id)) {
      comparison.inSourceOnly.push(item);
    }
  }

  // Find items only in target and items in both
  for (const [id, item] of targetMap) {
    if (!sourceMap.has(id)) {
      comparison.inTargetOnly.push(item);
    } else {
      const sourceItem = sourceMap.get(id);
      comparison.inBoth.push({ source: sourceItem, target: item });

      // Check if modified
      if (isDifferent(sourceItem, item)) {
        comparison.modified.push({ source: sourceItem, target: item });
      }
    }
  }

  return comparison;
}

function isDifferent(item1, item2) {
  // Compare key fields
  const fields = ["title", "status", "priority", "description"];

  for (const field of fields) {
    if (item1[field] !== item2[field]) {
      return true;
    }
  }

  return false;
}

async function executeSyncAction(action) {
  switch (action.target) {
    case "local":
    case "json":
      // Update local JSON file
      let data = { items: [] };
      try {
        data = JSON.parse(await fs.readFile("backlog.json", "utf8"));
      } catch {
        // File doesn't exist yet
      }

      if (!Array.isArray(data)) {
        data = { items: data.items || [] };
      }

      const items = Array.isArray(data) ? data : data.items;

      if (action.action === "create") {
        items.push(action.item);
      } else if (action.action === "update") {
        const index = items.findIndex(
          (i) => i.id === action.item.id || i.title === action.item.title,
        );
        if (index >= 0) {
          items[index] = { ...items[index], ...action.item };
        }
      }

      await fs.writeFile("backlog.json", JSON.stringify(data, null, 2));
      break;

    case "github":
      // Create or update GitHub issue
      if (action.action === "create") {
        const body = action.item.description || "";
        const labels = action.item.labels?.join(",") || "";
        execSync(
          `gh issue create --title "${action.item.title}" --body "${body}" --label "${labels}"`,
          {
            stdio: "pipe",
          },
        );
      } else if (action.action === "update" && action.item.number) {
        execSync(
          `gh issue edit ${action.item.number} --title "${action.item.title}"`,
          {
            stdio: "pipe",
          },
        );
      }
      break;

    default:
      throw new Error(`Sync to ${action.target} not implemented`);
  }
}
