// doc-add-xml.js - Add XML documentation tags to files
import { promises as fs } from "fs";
import path from "path";

export async function run(args) {
  const { target, tag, attributes = {}, dryRun = false, modules } = args;

  if (!target || !tag) {
    throw new Error(
      "Target file and tag required. Usage: apex doc:add-xml <file> --tag <tagname>",
    );
  }

  console.error(`[DOC-ADD-XML] Adding <${tag}> to ${target}...`);

  try {
    // Check if file exists
    const exists = await fileExists(target);
    if (!exists) {
      return {
        status: "error",
        message: `File not found: ${target}`,
      };
    }

    // Read file content
    const content = await fs.readFile(target, "utf8");

    // Generate XML tag
    const xmlTag = generateXMLTag(tag, attributes);

    // Determine where to add the tag
    const position = determinePosition(content, tag);

    // Insert tag
    const updated = insertTag(content, xmlTag, position);

    if (updated === content) {
      return {
        status: "no-change",
        message: "Tag already exists or no suitable location found",
      };
    }

    // Save if not dry run
    if (!dryRun) {
      await fs.writeFile(target, updated);
    }

    return {
      status: dryRun ? "dry-run" : "added",
      file: target,
      tag,
      attributes,
      position: position.type,
      line: position.line,
      message: dryRun
        ? `Would add <${tag}> at line ${position.line}`
        : `Added <${tag}> at line ${position.line}`,
    };
  } catch (error) {
    console.error("[DOC-ADD-XML] Error:", error.message);
    return {
      status: "error",
      message: "Failed to add XML tag",
      error: error.message,
    };
  }
}

function generateXMLTag(tag, attributes) {
  let xml = `<${tag}`;

  // Add attributes
  for (const [key, value] of Object.entries(attributes)) {
    xml += ` ${key}="${escapeXML(value)}"`;
  }

  // Common self-closing tags
  const selfClosing = ["meta", "link", "img", "br", "hr", "input"];

  if (selfClosing.includes(tag.toLowerCase())) {
    xml += " />";
  } else {
    xml += `>\n</${tag}>`;
  }

  return xml;
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function determinePosition(content, tag) {
  const lines = content.split("\n");

  // Special handling for different tags
  switch (tag.toLowerCase()) {
    case "description":
    case "overview":
      // Add after title
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^#\s+/)) {
          return { type: "after-title", line: i + 2 };
        }
      }
      return { type: "start", line: 1 };

    case "example":
    case "usage":
      // Add before closing or at end
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes("</") || lines[i].match(/^##/)) {
          return { type: "before-section", line: i };
        }
      }
      return { type: "end", line: lines.length };

    case "metadata":
    case "meta":
      // Add at start
      return { type: "start", line: 1 };

    default:
      // Find appropriate section or add at end
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(tag)) {
          return { type: "near-reference", line: i + 1 };
        }
      }
      return { type: "end", line: lines.length };
  }
}

function insertTag(content, xmlTag, position) {
  const lines = content.split("\n");

  // Check if tag already exists
  if (content.includes(`<${xmlTag.match(/<(\w+)/)[1]}`)) {
    return content;
  }

  // Insert at position
  lines.splice(position.line - 1, 0, "", xmlTag, "");

  return lines.join("\n");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
