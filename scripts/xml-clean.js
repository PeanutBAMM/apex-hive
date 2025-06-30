// xml-clean.js - Clean and standardize XML tags in documentation
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    pattern = "**/*.md",
    remove = false,
    standardize = true,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[XML-CLEAN] Cleaning XML tags in documentation...");

  try {
    // Find markdown files
    const files = await findMarkdownFiles(pattern);

    const results = {
      scanned: 0,
      cleaned: 0,
      removed: 0,
      standardized: 0,
      changes: [],
    };

    for (const file of files) {
      results.scanned++;

      try {
        const content = await fs.readFile(file, "utf8");
        const cleaned = cleanXMLTags(content, { remove, standardize });

        if (cleaned.changed) {
          results.cleaned++;
          results.changes.push({
            file,
            removed: cleaned.removed,
            standardized: cleaned.standardized,
          });

          if (!dryRun) {
            await fs.writeFile(file, cleaned.content);
          }

          results.removed += cleaned.removed;
          results.standardized += cleaned.standardized;
        }
      } catch (error) {
        console.error(`[XML-CLEAN] Error processing ${file}:`, error.message);
      }
    }

    return {
      success: true,
      dryRun,
      data: results,
      message: dryRun
        ? `Would clean ${results.cleaned} files (${results.removed} removals, ${results.standardized} standardizations)`
        : `Cleaned ${results.cleaned} files (${results.removed} removals, ${results.standardized} standardizations)`,
    };
  } catch (error) {
    console.error("[XML-CLEAN] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to clean XML tags",
    };
  }
}

async function findMarkdownFiles(pattern) {
  const files = [];

  async function scanDir(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.isDirectory() &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules"
        ) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory not accessible
    }
  }

  await scanDir(".");
  return files;
}

function cleanXMLTags(content, options) {
  let cleaned = content;
  let removed = 0;
  let standardized = 0;
  let changed = false;

  // Define tag mappings for standardization
  const tagMappings = {
    // Common variations to standard forms
    desc: "description",
    descr: "description",
    sum: "summary",
    req: "requirements",
    reqs: "requirements",
    require: "requirements",
    install: "installation",
    config: "configuration",
    configs: "configuration",
    warn: "warning",
    warnings: "warning",
    notes: "note",
    examples: "example",
    params: "param",
    parameter: "param",
    parameters: "param",
    return: "returns",
    throw: "throws",
    exception: "throws",
    exceptions: "throws",
  };

  // Define deprecated/removable tags
  const deprecatedTags = [
    "old",
    "obsolete",
    "legacy",
    "temp",
    "temporary",
    "draft",
    "wip",
    "todo",
    "fixme",
    "xxx",
    "hack",
  ];

  if (options.remove) {
    // Remove all XML tags
    const beforeLength = cleaned.length;
    cleaned = cleaned.replace(/<\/?[^>]+>/g, "");
    removed = Math.floor((beforeLength - cleaned.length) / 10); // Rough estimate of tags removed
    changed = cleaned !== content;
  } else {
    // Clean and standardize tags
    const lines = cleaned.split("\n");
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let lineChanged = false;

      // Skip code blocks
      if (line.trim().startsWith("```")) {
        processedLines.push(line);
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          processedLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          processedLines.push(lines[i]);
        }
        continue;
      }

      // Process XML tags in the line
      line = line.replace(
        /<\/?(\w+)([^>]*)>/g,
        (match, tagName, attributes) => {
          const isClosing = match.startsWith("</");
          const lowerTag = tagName.toLowerCase();

          // Remove deprecated tags
          if (deprecatedTags.includes(lowerTag)) {
            removed++;
            lineChanged = true;
            return "";
          }

          // Standardize tag names
          if (options.standardize && tagMappings[lowerTag]) {
            const standardTag = tagMappings[lowerTag];
            standardized++;
            lineChanged = true;
            return isClosing
              ? `</${standardTag}>`
              : `<${standardTag}${attributes}>`;
          }

          // Clean up tag formatting
          if (options.standardize) {
            // Remove unnecessary spaces
            const cleanedAttrs = attributes.trim();
            const cleanedTag = isClosing
              ? `</${lowerTag}>`
              : cleanedAttrs
                ? `<${lowerTag} ${cleanedAttrs}>`
                : `<${lowerTag}>`;

            if (cleanedTag !== match) {
              standardized++;
              lineChanged = true;
              return cleanedTag;
            }
          }

          return match;
        },
      );

      // Remove empty tag pairs
      line = line.replace(/<(\w+)>\s*<\/\1>/g, () => {
        removed++;
        lineChanged = true;
        return "";
      });

      // Clean up extra whitespace from removed tags
      if (lineChanged) {
        line = line.replace(/\s{2,}/g, " ").trim();
        changed = true;
      }

      processedLines.push(line);
    }

    if (changed) {
      cleaned = processedLines.join("\n");

      // Final cleanup: remove multiple empty lines
      cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    }
  }

  return {
    content: cleaned,
    changed,
    removed,
    standardized,
  };
}
