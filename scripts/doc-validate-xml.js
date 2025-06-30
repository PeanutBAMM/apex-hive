// doc-validate-xml.js - Validate XML documentation files
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";

export async function run(args = {}) {
  const {
    directory = "docs",
    recursive = true,
    schema,
    fix = false,
    strict = false,
    report = true,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[DOC-VALIDATE-XML] Validating XML documentation...");

  try {
    // Find XML files
    const xmlFiles = await findXMLFiles(directory, recursive);

    if (xmlFiles.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          valid: 0,
          invalid: 0,
          fixed: 0,
        },
        message: "No XML files found",
      };
    }

    console.error(`[DOC-VALIDATE-XML] Found ${xmlFiles.length} XML files`);

    // Validate each file
    const results = {
      valid: [],
      invalid: [],
      fixed: [],
    };

    for (const file of xmlFiles) {
      const validation = await validateXMLFile(file, { schema, strict });

      if (validation.valid) {
        results.valid.push({
          file,
          message: "Valid XML",
        });
      } else {
        results.invalid.push({
          file,
          errors: validation.errors,
          fixable: validation.fixable,
        });

        // Try to fix if requested
        if (fix && validation.fixable && !dryRun) {
          const fixResult = await fixXMLFile(file, validation.errors);
          if (fixResult.success) {
            results.fixed.push({
              file,
              fixes: fixResult.fixes,
            });

            // Move from invalid to valid
            results.invalid = results.invalid.filter((i) => i.file !== file);
            results.valid.push({
              file,
              message: "Fixed and validated",
            });
          }
        }
      }
    }

    // Generate validation report
    let reportPath = null;
    if (report && !dryRun) {
      reportPath = path.join(directory, "xml-validation-report.md");
      const reportContent = generateValidationReport(results, xmlFiles.length);
      await fs.writeFile(reportPath, reportContent);
    }

    return {
      success: true,
      dryRun,
      data: {
        total: xmlFiles.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        fixed: results.fixed.length,
        report: reportPath,
      },
      message: dryRun
        ? `Would validate ${xmlFiles.length} XML files`
        : `Validated ${xmlFiles.length} XML files: ${results.valid.length} valid, ${results.invalid.length} invalid`,
    };
  } catch (error) {
    console.error("[DOC-VALIDATE-XML] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to validate XML documentation",
    };
  }
}

async function findXMLFiles(directory, recursive) {
  const files = [];

  try {
    const findCommand = recursive
      ? `find ${directory} -name "*.xml" -type f`
      : `find ${directory} -maxdepth 1 -name "*.xml" -type f`;

    const output = execSync(findCommand, { encoding: "utf8" });
    const found = output
      .trim()
      .split("\n")
      .filter((f) => f);

    // Verify files exist and are readable
    for (const file of found) {
      try {
        await fs.access(file);
        files.push(file);
      } catch {
        // File not accessible
      }
    }
  } catch (error) {
    console.error("[DOC-VALIDATE-XML] Error finding files:", error.message);
  }

  return files;
}

async function validateXMLFile(filepath, options) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    fixable: false,
  };

  try {
    const content = await fs.readFile(filepath, "utf8");

    // Basic XML structure validation
    const structureErrors = validateXMLStructure(content);
    if (structureErrors.length > 0) {
      validation.valid = false;
      validation.errors.push(...structureErrors);
    }

    // Validate encoding
    const encodingValidation = validateEncoding(content);
    if (!encodingValidation.valid) {
      validation.valid = false;
      validation.errors.push(encodingValidation.error);
      validation.fixable = true;
    }

    // Validate well-formedness
    const wellFormedness = validateWellFormedness(content);
    if (!wellFormedness.valid) {
      validation.valid = false;
      validation.errors.push(...wellFormedness.errors);
      validation.fixable = wellFormedness.fixable;
    }

    // Validate against schema if provided
    if (options.schema) {
      const schemaValidation = await validateAgainstSchema(
        filepath,
        options.schema,
      );
      if (!schemaValidation.valid) {
        validation.valid = false;
        validation.errors.push(...schemaValidation.errors);
      }
    }

    // Additional strict checks
    if (options.strict) {
      const strictChecks = performStrictChecks(content);
      validation.warnings.push(...strictChecks.warnings);

      if (strictChecks.errors.length > 0) {
        validation.valid = false;
        validation.errors.push(...strictChecks.errors);
      }
    }

    // Check for common issues
    const commonIssues = checkCommonIssues(content);
    if (commonIssues.length > 0) {
      validation.warnings.push(...commonIssues);
      validation.fixable = true;
    }
  } catch (error) {
    validation.valid = false;
    validation.errors.push(`Failed to read file: ${error.message}`);
  }

  return validation;
}

function validateXMLStructure(content) {
  const errors = [];

  // Check for XML declaration
  if (!content.trim().startsWith("<?xml")) {
    errors.push({
      type: "missing-declaration",
      message: "Missing XML declaration",
      line: 1,
      fixable: true,
    });
  }

  // Check for root element
  const rootMatch = content.match(/<(\w+)[\s>]/);
  if (!rootMatch) {
    errors.push({
      type: "missing-root",
      message: "No root element found",
      fixable: false,
    });
    return errors;
  }

  const rootTag = rootMatch[1];
  const rootOpenCount = (
    content.match(new RegExp(`<${rootTag}[\\s>]`, "g")) || []
  ).length;
  const rootCloseCount = (content.match(new RegExp(`</${rootTag}>`, "g")) || [])
    .length;

  if (rootOpenCount !== rootCloseCount) {
    errors.push({
      type: "unclosed-root",
      message: `Root element <${rootTag}> not properly closed`,
      fixable: false,
    });
  }

  // Check for balanced tags
  const tagBalance = checkTagBalance(content);
  if (!tagBalance.balanced) {
    errors.push(...tagBalance.errors);
  }

  return errors;
}

function validateEncoding(content) {
  const declarationMatch = content.match(/<\?xml[^>]+\?>/);

  if (declarationMatch) {
    const declaration = declarationMatch[0];
    const encodingMatch = declaration.match(/encoding=["']([^"']+)["']/);

    if (!encodingMatch) {
      return {
        valid: false,
        error: {
          type: "missing-encoding",
          message: "XML declaration missing encoding attribute",
          fixable: true,
        },
      };
    }

    const encoding = encodingMatch[1].toLowerCase();
    if (!["utf-8", "utf-16", "iso-8859-1", "ascii"].includes(encoding)) {
      return {
        valid: false,
        error: {
          type: "invalid-encoding",
          message: `Invalid encoding: ${encoding}`,
          fixable: true,
        },
      };
    }
  }

  return { valid: true };
}

function validateWellFormedness(content) {
  const result = {
    valid: true,
    errors: [],
    fixable: false,
  };

  // Check for unescaped special characters in text content
  const textContent = content.replace(/<[^>]+>/g, "");
  if (textContent.includes("<") || textContent.includes(">")) {
    result.valid = false;
    result.errors.push({
      type: "unescaped-chars",
      message: "Unescaped < or > in text content",
      fixable: true,
    });
    result.fixable = true;
  }

  // Check for invalid characters in tag names
  const tagNameRegex = /<\/?([^\s>]+)/g;
  let match;
  while ((match = tagNameRegex.exec(content)) !== null) {
    const tagName = match[1];
    if (!tagName.match(/^[a-zA-Z_][\w.-]*$/)) {
      result.valid = false;
      result.errors.push({
        type: "invalid-tag-name",
        message: `Invalid tag name: ${tagName}`,
        fixable: false,
      });
    }
  }

  // Check for duplicate attributes
  const attrRegex = /<\w+([^>]*)>/g;
  while ((match = attrRegex.exec(content)) !== null) {
    const attrs = match[1];
    const attrNames = new Set();
    const attrNameRegex = /(\w+)=/g;
    let attrMatch;

    while ((attrMatch = attrNameRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1];
      if (attrNames.has(attrName)) {
        result.valid = false;
        result.errors.push({
          type: "duplicate-attribute",
          message: `Duplicate attribute: ${attrName}`,
          fixable: false,
        });
      }
      attrNames.add(attrName);
    }
  }

  return result;
}

function checkTagBalance(content) {
  const stack = [];
  const errors = [];
  let balanced = true;

  // Remove comments and CDATA sections
  const cleanContent = content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");

  const tagRegex = /<\/?([^\s>]+)[^>]*>/g;
  let match;

  while ((match = tagRegex.exec(cleanContent)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];

    // Skip self-closing tags
    if (fullTag.endsWith("/>")) continue;

    // Skip special tags
    if (tagName.startsWith("?") || tagName.startsWith("!")) continue;

    if (fullTag.startsWith("</")) {
      // Closing tag
      if (stack.length === 0) {
        balanced = false;
        errors.push({
          type: "unexpected-closing-tag",
          message: `Unexpected closing tag: </${tagName}>`,
          tag: tagName,
        });
      } else {
        const expected = stack.pop();
        if (expected !== tagName) {
          balanced = false;
          errors.push({
            type: "mismatched-tag",
            message: `Expected </${expected}>, found </${tagName}>`,
            expected,
            found: tagName,
          });
        }
      }
    } else {
      // Opening tag
      stack.push(tagName);
    }
  }

  // Check for unclosed tags
  if (stack.length > 0) {
    balanced = false;
    for (const tag of stack) {
      errors.push({
        type: "unclosed-tag",
        message: `Unclosed tag: <${tag}>`,
        tag,
      });
    }
  }

  return { balanced, errors };
}

async function validateAgainstSchema(filepath, schemaPath) {
  const result = {
    valid: true,
    errors: [],
  };

  try {
    // Try to use xmllint if available
    try {
      execSync(`which xmllint`, { stdio: "ignore" });

      const output = execSync(
        `xmllint --noout --schema ${schemaPath} ${filepath} 2>&1`,
        { encoding: "utf8" },
      );

      if (output.includes("validates")) {
        result.valid = true;
      } else {
        result.valid = false;
        const lines = output.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          if (line.includes("error")) {
            result.errors.push({
              type: "schema-validation",
              message: line,
            });
          }
        }
      }
    } catch (error) {
      // xmllint not available or validation failed
      if (error.status !== 0) {
        result.valid = false;
        result.errors.push({
          type: "schema-validation",
          message: "Schema validation failed",
        });
      } else {
        result.errors.push({
          type: "tool-missing",
          message: "xmllint not available for schema validation",
        });
      }
    }
  } catch (error) {
    result.errors.push({
      type: "schema-error",
      message: `Failed to validate against schema: ${error.message}`,
    });
  }

  return result;
}

function performStrictChecks(content) {
  const result = {
    warnings: [],
    errors: [],
  };

  // Check for proper indentation
  const lines = content.split("\n");
  let expectedIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Skip declaration and comments
    if (trimmed.startsWith("<?") || trimmed.startsWith("<!--")) continue;

    const actualIndent = line.length - trimmed.length;

    if (trimmed.startsWith("</")) {
      expectedIndent -= 2;
    }

    if (actualIndent !== expectedIndent && expectedIndent >= 0) {
      result.warnings.push({
        type: "indentation",
        message: `Inconsistent indentation at line ${i + 1}`,
        line: i + 1,
      });
    }

    if (
      !trimmed.startsWith("</") &&
      !trimmed.endsWith("/>") &&
      trimmed.endsWith(">")
    ) {
      expectedIndent += 2;
    }
  }

  // Check for consistent quote style
  const singleQuotes = (content.match(/='/g) || []).length;
  const doubleQuotes = (content.match(/="/g) || []).length;

  if (singleQuotes > 0 && doubleQuotes > 0) {
    result.warnings.push({
      type: "quote-style",
      message: "Inconsistent quote style (mix of single and double quotes)",
    });
  }

  // Check for trailing whitespace
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].endsWith(" ") || lines[i].endsWith("\t")) {
      result.warnings.push({
        type: "trailing-whitespace",
        message: `Trailing whitespace at line ${i + 1}`,
        line: i + 1,
      });
    }
  }

  return result;
}

function checkCommonIssues(content) {
  const issues = [];

  // Check for BOM
  if (content.charCodeAt(0) === 0xfeff) {
    issues.push({
      type: "bom",
      message: "File contains BOM (Byte Order Mark)",
      fixable: true,
    });
  }

  // Check for mixed line endings
  const crlfCount = (content.match(/\r\n/g) || []).length;
  const lfCount = (content.match(/(?<!\r)\n/g) || []).length;

  if (crlfCount > 0 && lfCount > 0) {
    issues.push({
      type: "line-endings",
      message: "Mixed line endings (CRLF and LF)",
      fixable: true,
    });
  }

  // Check for empty elements that could be self-closing
  const emptyElementRegex = /<(\w+)([^>]*)><\/\1>/g;
  let match;

  while ((match = emptyElementRegex.exec(content)) !== null) {
    issues.push({
      type: "empty-element",
      message: `Empty element <${match[1]}> could be self-closing`,
      tag: match[1],
      fixable: true,
    });
  }

  // Check for missing namespace declarations
  const namespacedTags = content.match(/<\w+:\w+/g) || [];
  if (namespacedTags.length > 0) {
    const namespaces = new Set();
    for (const tag of namespacedTags) {
      const ns = tag.substring(1).split(":")[0];
      namespaces.add(ns);
    }

    for (const ns of namespaces) {
      if (!content.includes(`xmlns:${ns}=`)) {
        issues.push({
          type: "missing-namespace",
          message: `Missing namespace declaration for prefix: ${ns}`,
          namespace: ns,
        });
      }
    }
  }

  return issues;
}

async function fixXMLFile(filepath, errors) {
  const fixes = {
    success: true,
    fixes: [],
  };

  try {
    let content = await fs.readFile(filepath, "utf8");
    const originalContent = content;

    // Fix missing XML declaration
    const missingDeclaration = errors.find(
      (e) => e.type === "missing-declaration",
    );
    if (missingDeclaration) {
      content = '<?xml version="1.0" encoding="UTF-8"?>\n' + content;
      fixes.fixes.push("Added XML declaration");
    }

    // Fix missing encoding
    const missingEncoding = errors.find((e) => e.type === "missing-encoding");
    if (missingEncoding) {
      content = content.replace(
        /<\?xml([^>]+)\?>/,
        '<?xml$1 encoding="UTF-8"?>',
      );
      fixes.fixes.push("Added encoding attribute");
    }

    // Fix invalid encoding
    const invalidEncoding = errors.find((e) => e.type === "invalid-encoding");
    if (invalidEncoding) {
      content = content.replace(/encoding=["'][^"']+["']/, 'encoding="UTF-8"');
      fixes.fixes.push("Fixed encoding to UTF-8");
    }

    // Fix unescaped characters
    const unescapedChars = errors.find((e) => e.type === "unescaped-chars");
    if (unescapedChars) {
      // Replace unescaped < and > in text content
      content = content.replace(/>([^<]+)</g, (match, text) => {
        const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `>${escaped}<`;
      });
      fixes.fixes.push("Escaped special characters");
    }

    // Fix BOM
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.substring(1);
      fixes.fixes.push("Removed BOM");
    }

    // Fix line endings
    if (content.includes("\r\n") && content.includes("\n")) {
      content = content.replace(/\r\n/g, "\n");
      fixes.fixes.push("Normalized line endings to LF");
    }

    // Fix empty elements
    content = content.replace(/<(\w+)([^>]*)><\/\1>/g, "<$1$2/>");
    fixes.fixes.push("Converted empty elements to self-closing");

    // Save fixed content
    if (content !== originalContent) {
      await fs.writeFile(filepath, content);
      fixes.success = true;
    } else {
      fixes.success = false;
      fixes.fixes = ["No automatic fixes applied"];
    }
  } catch (error) {
    fixes.success = false;
    fixes.error = error.message;
  }

  return fixes;
}

function generateValidationReport(results, total) {
  let report = "# XML Validation Report\n\n";

  report += `**Generated**: ${new Date().toISOString()}\n\n`;

  // Summary
  report += "## Summary\n\n";
  report += `- **Total Files**: ${total}\n`;
  report += `- **Valid**: ${results.valid.length} ✅\n`;
  report += `- **Invalid**: ${results.invalid.length} ❌\n`;
  report += `- **Fixed**: ${results.fixed.length} 🔧\n`;
  report += `- **Validation Rate**: ${((results.valid.length / total) * 100).toFixed(1)}%\n\n`;

  // Invalid files
  if (results.invalid.length > 0) {
    report += "## ❌ Invalid Files\n\n";

    for (const invalid of results.invalid) {
      report += `### ${invalid.file}\n\n`;

      for (const error of invalid.errors) {
        report += `- **${error.type || "error"}**: ${error.message || error}\n`;
      }

      if (invalid.fixable) {
        report +=
          "\n*This file has fixable issues. Run with --fix to attempt automatic fixes.*\n";
      }

      report += "\n";
    }
  }

  // Fixed files
  if (results.fixed.length > 0) {
    report += "## 🔧 Fixed Files\n\n";

    for (const fixed of results.fixed) {
      report += `### ${fixed.file}\n\n`;
      report += "Applied fixes:\n";

      for (const fix of fixed.fixes) {
        report += `- ${fix}\n`;
      }

      report += "\n";
    }
  }

  // Valid files
  if (results.valid.length > 0) {
    report += "## ✅ Valid Files\n\n";

    for (const valid of results.valid) {
      report += `- ${valid.file} - ${valid.message}\n`;
    }

    report += "\n";
  }

  // Recommendations
  report += "## Recommendations\n\n";

  if (results.invalid.length > 0) {
    report += "1. Fix validation errors in invalid files\n";
    report += "2. Run with --fix flag to apply automatic fixes\n";
    report += "3. Use XML schema validation for stricter checks\n";
  } else {
    report += "✨ All XML files are valid!\n\n";
    report += "Consider:\n";
    report += "1. Adding XML schema validation for stronger guarantees\n";
    report += "2. Enabling strict mode for style consistency\n";
  }

  return report;
}
