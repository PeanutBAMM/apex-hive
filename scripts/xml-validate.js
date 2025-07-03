// xml-validate.js - Validate XML structure in documentation
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    pattern = "**/*.md",
    strict = false,
    fix = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[XML-VALIDATE] Validating XML tags in documentation...");

  try {
    // Find all markdown files
    const files = await findMarkdownFiles(pattern);

    const results = {
      scanned: 0,
      valid: 0,
      invalid: 0,
      fixed: 0,
      issues: [],
    };

    for (const file of files) {
      results.scanned++;

      try {
        const content = await fs.readFile(file, "utf8");
        const validation = validateXMLTags(content, file);

        if (validation.valid) {
          results.valid++;
        } else {
          results.invalid++;
          results.issues.push({
            file,
            errors: validation.errors,
          });

          // Fix if requested
          if (fix && !dryRun) {
            const fixed = fixXMLIssues(content, validation.errors);
            if (fixed.changed) {
              await fs.writeFile(file, fixed.content);
              results.fixed++;
            }
          }
        }
      } catch (error) {
        console.error(
          `[XML-VALIDATE] Error processing ${file}:`,
          error.message,
        );
        results.issues.push({
          file,
          errors: [{ type: "read-error", message: error.message }],
        });
      }
    }

    return {
      success: true,
      valid: results.invalid === 0,
      data: results,
      message:
        results.invalid === 0
          ? `All ${results.scanned} files have valid XML tags`
          : `Found XML issues in ${results.invalid} of ${results.scanned} files`,
    };
  } catch (error) {
    console.error("[XML-VALIDATE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to validate XML tags",
    };
  }
}

async function findMarkdownFiles(pattern) {
  const files = [];

  // Simple implementation - in real world would use glob
  async function scanDir(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          (typeof entry.isDirectory === "function"
            ? entry.isDirectory()
            : entry._isDirectory) &&
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

function validateXMLTags(content, filename) {
  const errors = [];
  const lines = content.split("\n");
  const tagStack = [];

  // Common XML-like tags in documentation
  const knownTags = [
    "summary",
    "overview",
    "details",
    "example",
    "code",
    "warning",
    "note",
    "tip",
    "important",
    "caution",
    "api",
    "method",
    "param",
    "returns",
    "throws",
    "todo",
    "fixme",
    "deprecated",
    "since",
    "version",
    "requirements",
    "installation",
    "usage",
    "configuration",
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip code blocks
    if (line.trim().startsWith("```")) {
      // Find end of code block
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        i++;
      }
      continue;
    }

    // Find XML tags
    const tagMatches = line.matchAll(/<\/?(\w+)(?:\s+[^>]*)?\/?>/g);

    for (const match of tagMatches) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (fullTag.startsWith("</")) {
        // Closing tag
        if (tagStack.length === 0) {
          errors.push({
            line: lineNum,
            column: match.index + 1,
            type: "unmatched-closing",
            tag: tagName,
            message: `Unmatched closing tag </${tagName}>`,
          });
        } else {
          const expected = tagStack.pop();
          if (expected !== tagName) {
            errors.push({
              line: lineNum,
              column: match.index + 1,
              type: "mismatched-closing",
              tag: tagName,
              expected,
              message: `Expected </${expected}> but found </${tagName}>`,
            });
            // Try to recover by looking for the expected tag in stack
            const idx = tagStack.lastIndexOf(tagName);
            if (idx >= 0) {
              tagStack.splice(idx);
            }
          }
        }
      } else if (fullTag.endsWith("/>")) {
        // Self-closing tag - valid
      } else {
        // Opening tag
        tagStack.push(tagName);

        // Validate known tags in strict mode
        if (strict && !knownTags.includes(tagName)) {
          errors.push({
            line: lineNum,
            column: match.index + 1,
            type: "unknown-tag",
            tag: tagName,
            message: `Unknown tag <${tagName}>`,
          });
        }
      }
    }

    // Check for malformed tags
    const malformedMatches = line.matchAll(/<[^>]*$/g);
    for (const match of malformedMatches) {
      errors.push({
        line: lineNum,
        column: match.index + 1,
        type: "malformed",
        message: "Unclosed tag",
      });
    }
  }

  // Check for unclosed tags
  while (tagStack.length > 0) {
    const tag = tagStack.pop();
    errors.push({
      type: "unclosed",
      tag,
      message: `Unclosed tag <${tag}>`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function fixXMLIssues(content, errors) {
  let fixed = content;
  let changed = false;

  // Sort errors by line number in reverse order to avoid offset issues
  const sortedErrors = [...errors].sort(
    (a, b) => (b.line || 0) - (a.line || 0),
  );

  for (const error of sortedErrors) {
    switch (error.type) {
      case "unclosed":
        // Add closing tag at end of content
        fixed += `\n</${error.tag}>`;
        changed = true;
        break;

      case "unmatched-closing":
        // Remove unmatched closing tag
        if (error.line) {
          const lines = fixed.split("\n");
          lines[error.line - 1] = lines[error.line - 1].replace(
            `</${error.tag}>`,
            "",
          );
          fixed = lines.join("\n");
          changed = true;
        }
        break;

      case "mismatched-closing":
        // Replace with expected closing tag
        if (error.line && error.expected) {
          const lines = fixed.split("\n");
          lines[error.line - 1] = lines[error.line - 1].replace(
            `</${error.tag}>`,
            `</${error.expected}>`,
          );
          fixed = lines.join("\n");
          changed = true;
        }
        break;
    }
  }

  return { content: fixed, changed };
}
