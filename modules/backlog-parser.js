// backlog-parser.js - Parse BACKLOG.md file into structured items
import { promises as fs } from "fs";

/**
 * Parse BACKLOG.md file into structured backlog items
 * @param {string} filePath - Path to BACKLOG.md file
 * @returns {Promise<Array>} Array of parsed backlog items
 */
export async function parseBacklogFile(filePath = "BACKLOG.md") {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseBacklogContent(content);
  } catch (error) {
    console.error("[BACKLOG-PARSER] Error reading file:", error.message);
    return [];
  }
}

/**
 * Parse markdown content into structured backlog items
 * @param {string} content - Markdown content
 * @returns {Array} Array of parsed backlog items
 */
export function parseBacklogContent(content) {
  const items = [];
  const lines = content.split("\n");

  let currentPriority = "medium";
  let currentCategory = "general";
  let currentSection = null;
  let itemId = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse priority headers
    if (line.match(/^##\s*.*high\s*priority/i)) {
      currentPriority = "high";
      currentSection = "priority";
    } else if (line.match(/^##\s*.*medium\s*priority/i)) {
      currentPriority = "medium";
      currentSection = "priority";
    } else if (line.match(/^##\s*.*low\s*priority/i)) {
      currentPriority = "low";
      currentSection = "priority";
    }

    // Parse category headers
    if (line.match(/^###\s+(.+)/)) {
      const categoryMatch = line.match(/^###\s+(.+)/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1]
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      }
    }

    // Parse todo items
    const todoMatch = line.match(/^[\s-]*\[( |x)\]\s+(.+)/i);
    if (todoMatch) {
      const [, checked, text] = todoMatch;

      // Extract title and metadata
      let title = text;
      let description = "";

      // Check for bold title pattern
      const boldMatch = text.match(/^\*\*(.+?)\*\*\s*-?\s*(.+)?/);
      if (boldMatch) {
        title = boldMatch[1];
        description = boldMatch[2] || "";
      }

      // Look for multi-line descriptions
      const descriptionLines = [];
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^\s{2,}/)) {
        const descLine = lines[j].trim();
        if (descLine.startsWith("- ")) {
          descriptionLines.push(descLine.substring(2));
        } else if (descLine) {
          descriptionLines.push(descLine);
        }
        j++;
      }

      if (descriptionLines.length > 0) {
        description = (description + " " + descriptionLines.join(" ")).trim();
      }

      // Estimate effort and value based on description
      const effort = estimateEffort(title, description);
      const value = estimateValue(title, description, currentPriority);

      // Detect tags from description
      const tags = extractTags(title + " " + description);

      items.push({
        id: String(itemId++),
        title: title.trim(),
        description: description.trim(),
        priority: currentPriority,
        status: checked === "x" ? "completed" : "pending",
        category: currentCategory,
        effort,
        value,
        risk: estimateRisk(title, description),
        dependencies: [],
        tags,
        source: "BACKLOG.md",
      });
    }
  }

  return items;
}

/**
 * Estimate effort based on title and description
 */
function estimateEffort(title, description) {
  const text = (title + " " + description).toLowerCase();

  // Keywords that indicate high effort
  if (
    text.includes("system") ||
    text.includes("infrastructure") ||
    text.includes("refactor") ||
    text.includes("migration")
  ) {
    return 8;
  }

  // Keywords that indicate medium effort
  if (
    text.includes("implement") ||
    text.includes("create") ||
    text.includes("build") ||
    text.includes("enhance")
  ) {
    return 5;
  }

  // Keywords that indicate low effort
  if (
    text.includes("fix") ||
    text.includes("update") ||
    text.includes("add") ||
    text.includes("small")
  ) {
    return 3;
  }

  return 4; // Default medium effort
}

/**
 * Estimate value based on title, description and priority
 */
function estimateValue(title, description, priority) {
  const text = (title + " " + description).toLowerCase();
  let baseValue = 5;

  // Priority multiplier
  if (priority === "high" || priority === "critical") {
    baseValue = 8;
  } else if (priority === "low") {
    baseValue = 3;
  }

  // Keywords that increase value
  if (
    text.includes("performance") ||
    text.includes("security") ||
    text.includes("critical") ||
    text.includes("user")
  ) {
    baseValue += 2;
  }

  // Keywords that might decrease value
  if (text.includes("nice to have") || text.includes("cosmetic")) {
    baseValue -= 2;
  }

  return Math.max(1, Math.min(10, baseValue));
}

/**
 * Estimate risk based on title and description
 */
function estimateRisk(title, description) {
  const text = (title + " " + description).toLowerCase();

  if (
    text.includes("breaking") ||
    text.includes("migration") ||
    text.includes("security") ||
    text.includes("critical")
  ) {
    return 4;
  }

  if (
    text.includes("refactor") ||
    text.includes("update") ||
    text.includes("change")
  ) {
    return 3;
  }

  if (text.includes("new") || text.includes("add")) {
    return 2;
  }

  return 1;
}

/**
 * Extract tags from text
 */
function extractTags(text) {
  const tags = new Set();
  const lowerText = text.toLowerCase();

  // Common tags to detect
  const tagPatterns = [
    { pattern: /test/i, tag: "testing" },
    { pattern: /doc/i, tag: "documentation" },
    { pattern: /performance|optimize|fast/i, tag: "performance" },
    { pattern: /security|auth/i, tag: "security" },
    { pattern: /ui|interface|frontend/i, tag: "ui" },
    { pattern: /backend|api|server/i, tag: "backend" },
    { pattern: /cache/i, tag: "cache" },
    { pattern: /ci|cd|pipeline/i, tag: "ci-cd" },
    { pattern: /bug|fix/i, tag: "bug" },
    { pattern: /feature|implement/i, tag: "feature" },
  ];

  for (const { pattern, tag } of tagPatterns) {
    if (pattern.test(lowerText)) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

/**
 * Load and parse backlog with fallback to sample data
 */
export async function loadBacklogItems() {
  try {
    // Try to load from BACKLOG.md
    const items = await parseBacklogFile("BACKLOG.md");

    if (items.length > 0) {
      console.error(
        `[BACKLOG-PARSER] Loaded ${items.length} items from BACKLOG.md`,
      );
      return items;
    }

    // Fallback to sample data for testing
    console.error("[BACKLOG-PARSER] No items found, using sample data");
    return getSampleItems();
  } catch (error) {
    console.error("[BACKLOG-PARSER] Error loading backlog:", error.message);
    return getSampleItems();
  }
}

/**
 * Get sample backlog items for testing
 */
function getSampleItems() {
  return [
    {
      id: "1",
      title: "Sample task - BACKLOG.md not found",
      description:
        "This is sample data. Create a BACKLOG.md file to see real items.",
      priority: "high",
      status: "pending",
      category: "sample",
      effort: 1,
      value: 1,
      risk: 1,
      dependencies: [],
      tags: ["sample"],
      source: "sample-data",
    },
  ];
}
