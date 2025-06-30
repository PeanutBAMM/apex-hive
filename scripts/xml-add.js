// xml-add.js - Add XML metadata tags to documentation
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    file,
    tag,
    content: tagContent,
    position = "after-title",
    validate = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[XML-ADD] Adding XML tags to documentation...");

  // Validate required arguments
  if (!file || !tag) {
    return {
      success: false,
      error: "Missing required arguments",
      message:
        "Target file and tag required. Usage: apex doc:add-xml <file> --tag <tagname>",
    };
  }

  try {
    // Check if file exists
    try {
      await fs.access(file);
    } catch {
      return {
        success: false,
        error: "File not found",
        message: `File ${file} does not exist`,
      };
    }

    // Read file content
    const originalContent = await fs.readFile(file, "utf8");

    // Generate tag content if not provided
    const xmlContent = tagContent || generateDefaultContent(tag, file);

    // Determine insertion point
    const insertPosition = findInsertPosition(originalContent, position);

    // Create the XML tag
    const xmlTag = formatXMLTag(tag, xmlContent);

    // Insert the tag
    const newContent = insertXMLTag(originalContent, xmlTag, insertPosition);

    // Validate if requested
    if (validate) {
      const validateModule = await import("./xml-validate.js");
      const validation = await validateModule.run({
        pattern: file,
        modules,
      });

      if (!validation.data?.valid) {
        return {
          success: false,
          error: "Validation failed",
          message: "Adding this tag would create invalid XML structure",
          validation: validation.data,
        };
      }
    }

    // Write changes if not dry run
    if (!dryRun) {
      await fs.writeFile(file, newContent);
    }

    return {
      success: true,
      dryRun,
      data: {
        file,
        tag,
        position: insertPosition.line,
        added: xmlTag,
      },
      message: dryRun
        ? `Would add <${tag}> tag to ${file}`
        : `Added <${tag}> tag to ${file}`,
    };
  } catch (error) {
    console.error("[XML-ADD] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to add XML tag",
    };
  }
}

function generateDefaultContent(tag, filename) {
  const defaults = {
    summary: "Brief description of this document",
    overview: "This document provides...",
    requirements: "- Requirement 1\n- Requirement 2",
    installation: "Installation instructions...",
    usage: "Usage instructions...",
    example: "```\n// Example code\n```",
    api: "API documentation...",
    configuration: "Configuration options...",
    version: "1.0.0",
    since: new Date().toISOString().split("T")[0],
    author: "Apex Hive",
    status: "draft",
    tags: "documentation, " + path.basename(filename, ".md"),
  };

  return defaults[tag] || `${tag} content`;
}

function findInsertPosition(content, position) {
  const lines = content.split("\n");
  let targetLine = 0;

  switch (position) {
    case "start":
      targetLine = 0;
      break;

    case "after-title":
      // Find first heading
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^#\s+/)) {
          targetLine = i + 1;
          // Skip any immediate content after title
          while (targetLine < lines.length && lines[targetLine].trim() !== "") {
            targetLine++;
          }
          break;
        }
      }
      break;

    case "before-first-heading":
      // Find first secondary heading
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^##\s+/)) {
          targetLine = i;
          break;
        }
      }
      if (targetLine === 0) targetLine = lines.length;
      break;

    case "end":
      targetLine = lines.length;
      break;

    default:
      // Try to parse as line number
      const lineNum = parseInt(position);
      if (!isNaN(lineNum)) {
        targetLine = Math.max(0, Math.min(lineNum - 1, lines.length));
      }
  }

  return {
    line: targetLine,
    column: 0,
  };
}

function formatXMLTag(tag, content) {
  // Check if content is multi-line
  const isMultiLine = content.includes("\n");

  if (isMultiLine) {
    // Format multi-line content with proper indentation
    const indentedContent = content
      .split("\n")
      .map((line) => (line.trim() ? line : ""))
      .join("\n");

    return `<${tag}>\n${indentedContent}\n</${tag}>`;
  } else {
    // Single line tag
    return `<${tag}>${content}</${tag}>`;
  }
}

function insertXMLTag(content, xmlTag, position) {
  const lines = content.split("\n");

  // Add empty lines around the tag for readability
  const tagWithSpacing = `\n${xmlTag}\n`;

  // Insert at the specified position
  lines.splice(position.line, 0, tagWithSpacing);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n"); // Normalize multiple empty lines
}
