// doc-validate-links.js - Validate links in documentation files
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";
import { URL } from "url";

export async function run(args = {}) {
  const {
    directory = "docs",
    recursive = true,
    external = true,
    internal = true,
    anchors = true,
    timeout = 5000,
    retries = 1,
    fix = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[DOC-VALIDATE-LINKS] Validating documentation links...");

  try {
    // Find documentation files
    const docFiles = await findDocFiles(directory, recursive);

    if (docFiles.length === 0) {
      return {
        success: true,
        data: {
          files: 0,
          links: 0,
          valid: 0,
          broken: 0,
        },
        message: "No documentation files found",
      };
    }

    console.error(
      `[DOC-VALIDATE-LINKS] Found ${docFiles.length} documentation files`,
    );

    // Extract all links
    const allLinks = await extractAllLinks(docFiles);

    if (allLinks.length === 0) {
      return {
        success: true,
        data: {
          files: docFiles.length,
          links: 0,
          valid: 0,
          broken: 0,
        },
        message: "No links found in documentation",
      };
    }

    console.error(
      `[DOC-VALIDATE-LINKS] Found ${allLinks.length} links to validate`,
    );

    // Categorize links
    const categorized = categorizeLinks(allLinks);

    // Validate links
    const validation = {
      valid: [],
      broken: [],
      fixed: [],
    };

    // Validate internal links
    if (internal) {
      console.error("[DOC-VALIDATE-LINKS] Validating internal links...");
      const internalResults = await validateInternalLinks(
        categorized.internal,
        directory,
      );
      validation.valid.push(...internalResults.valid);
      validation.broken.push(...internalResults.broken);
    }

    // Validate external links
    if (external) {
      console.error("[DOC-VALIDATE-LINKS] Validating external links...");
      const externalResults = await validateExternalLinks(
        categorized.external,
        { timeout, retries },
      );
      validation.valid.push(...externalResults.valid);
      validation.broken.push(...externalResults.broken);
    }

    // Validate anchor links
    if (anchors) {
      console.error("[DOC-VALIDATE-LINKS] Validating anchor links...");
      const anchorResults = await validateAnchorLinks(
        categorized.anchors,
        docFiles,
      );
      validation.valid.push(...anchorResults.valid);
      validation.broken.push(...anchorResults.broken);
    }

    // Fix broken links if requested
    if (fix && validation.broken.length > 0 && !dryRun) {
      console.error("[DOC-VALIDATE-LINKS] Attempting to fix broken links...");
      const fixResults = await fixBrokenLinks(validation.broken);
      validation.fixed = fixResults.fixed;

      // Update broken list
      validation.broken = validation.broken.filter(
        (b) =>
          !fixResults.fixed.find((f) => f.link === b.link && f.file === b.file),
      );
    }

    // Generate report
    const reportPath = path.join(directory, "link-validation-report.md");
    if (!dryRun) {
      const report = generateLinkReport({
        files: docFiles.length,
        total: allLinks.length,
        ...categorized,
        ...validation,
      });
      await fs.writeFile(reportPath, report);
    }

    return {
      success: true,
      dryRun,
      data: {
        files: docFiles.length,
        links: allLinks.length,
        valid: validation.valid.length,
        broken: validation.broken.length,
        fixed: validation.fixed.length,
        report: dryRun ? null : reportPath,
      },
      message: dryRun
        ? `Would validate ${allLinks.length} links in ${docFiles.length} files`
        : `Validated ${allLinks.length} links: ${validation.valid.length} valid, ${validation.broken.length} broken`,
    };
  } catch (error) {
    console.error("[DOC-VALIDATE-LINKS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to validate documentation links",
    };
  }
}

async function findDocFiles(directory, recursive) {
  const files = [];

  try {
    const extensions = ["md", "markdown", "mdx", "rst", "txt", "html", "htm"];
    const extPattern = extensions.map((ext) => `-name "*.${ext}"`).join(" -o ");

    const findCommand = recursive
      ? `find ${directory} -type f \\( ${extPattern} \\)`
      : `find ${directory} -maxdepth 1 -type f \\( ${extPattern} \\)`;

    const output = execSync(findCommand, { encoding: "utf8" });
    const found = output
      .trim()
      .split("\n")
      .filter((f) => f);

    // Verify files exist
    for (const file of found) {
      try {
        await fs.access(file);
        files.push(file);
      } catch {
        // File not accessible
      }
    }
  } catch (error) {
    console.error("[DOC-VALIDATE-LINKS] Error finding files:", error.message);
  }

  return files;
}

async function extractAllLinks(files) {
  const allLinks = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf8");
      const links = extractLinks(content, file);
      allLinks.push(...links);
    } catch (error) {
      console.error(
        `[DOC-VALIDATE-LINKS] Error reading ${file}:`,
        error.message,
      );
    }
  }

  return allLinks;
}

function extractLinks(content, filepath) {
  const links = [];
  const patterns = [
    // Markdown links: [text](url)
    /\[([^\]]+)\]\(([^)]+)\)/g,

    // Reference links: [text][ref]
    /\[([^\]]+)\]\[([^\]]+)\]/g,

    // HTML links: <a href="url">
    /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi,

    // Direct URLs
    /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,

    // Relative paths in markdown
    /\[([^\]]+)\]:\s*(.+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[2] || match[1] || match[0];

      // Clean up URL
      url = url.trim();

      // Skip email links
      if (url.startsWith("mailto:")) continue;

      // Get line number
      const lineNumber = content.substring(0, match.index).split("\n").length;

      links.push({
        file: filepath,
        line: lineNumber,
        text: match[1] || url,
        url: url,
        type: detectLinkType(url, filepath),
      });
    }
  }

  return links;
}

function detectLinkType(url, filepath) {
  // External URL
  if (url.match(/^https?:\/\//)) {
    return "external";
  }

  // Anchor link
  if (url.startsWith("#")) {
    return "anchor";
  }

  // Absolute path
  if (url.startsWith("/")) {
    return "absolute";
  }

  // Relative path
  return "relative";
}

function categorizeLinks(links) {
  const categorized = {
    internal: [],
    external: [],
    anchors: [],
    absolute: [],
  };

  for (const link of links) {
    switch (link.type) {
      case "external":
        categorized.external.push(link);
        break;

      case "anchor":
        categorized.anchors.push(link);
        break;

      case "absolute":
        categorized.absolute.push(link);
        break;

      case "relative":
        categorized.internal.push(link);
        break;
    }
  }

  return categorized;
}

async function validateInternalLinks(links, baseDir) {
  const results = {
    valid: [],
    broken: [],
  };

  for (const link of links) {
    try {
      // Resolve the link relative to the file
      const fileDir = path.dirname(link.file);
      let targetPath;

      // Handle fragment identifiers
      const [pathPart, fragment] = link.url.split("#");

      if (pathPart) {
        targetPath = path.resolve(fileDir, pathPart);
      } else {
        // Just a fragment, refers to same file
        targetPath = link.file;
      }

      // Check if file exists
      try {
        await fs.access(targetPath);

        // If there's a fragment, validate it
        if (fragment) {
          const isValidAnchor = await validateAnchorInFile(
            targetPath,
            fragment,
          );
          if (isValidAnchor) {
            results.valid.push(link);
          } else {
            results.broken.push({
              ...link,
              reason: `Anchor '#${fragment}' not found in ${path.basename(targetPath)}`,
              suggestion: await findSimilarAnchor(targetPath, fragment),
            });
          }
        } else {
          results.valid.push(link);
        }
      } catch {
        // File doesn't exist
        results.broken.push({
          ...link,
          reason: "File not found",
          suggestion: await findSimilarFile(targetPath, baseDir),
        });
      }
    } catch (error) {
      results.broken.push({
        ...link,
        reason: `Error: ${error.message}`,
      });
    }
  }

  return results;
}

async function validateExternalLinks(links, options) {
  const results = {
    valid: [],
    broken: [],
  };

  // Group by domain to avoid rate limiting
  const byDomain = {};
  for (const link of links) {
    try {
      const url = new URL(link.url);
      const domain = url.hostname;
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(link);
    } catch {
      results.broken.push({
        ...link,
        reason: "Invalid URL format",
      });
    }
  }

  // Validate links by domain with delay
  for (const [domain, domainLinks] of Object.entries(byDomain)) {
    console.error(
      `[DOC-VALIDATE-LINKS] Checking ${domainLinks.length} links from ${domain}...`,
    );

    for (const link of domainLinks) {
      const result = await validateExternalLink(link.url, options);

      if (result.valid) {
        results.valid.push(link);
      } else {
        results.broken.push({
          ...link,
          reason: result.reason,
          statusCode: result.statusCode,
        });
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Larger delay between domains
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

async function validateExternalLink(url, options) {
  let attempts = 0;

  while (attempts <= options.retries) {
    try {
      // Use curl for link checking
      const command = `curl -I -L --max-time ${options.timeout / 1000} -s -o /dev/null -w "%{http_code}" "${url}"`;
      const statusCode = execSync(command, { encoding: "utf8" }).trim();

      if (statusCode.startsWith("2") || statusCode === "304") {
        return { valid: true, statusCode };
      } else if (statusCode === "000") {
        return {
          valid: false,
          reason: "Connection timeout",
          statusCode,
        };
      } else {
        return {
          valid: false,
          reason: `HTTP ${statusCode}`,
          statusCode,
        };
      }
    } catch (error) {
      attempts++;
      if (attempts > options.retries) {
        return {
          valid: false,
          reason: "Connection failed",
        };
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
    }
  }

  return { valid: false, reason: "Max retries exceeded" };
}

async function validateAnchorLinks(links, allFiles) {
  const results = {
    valid: [],
    broken: [],
  };

  for (const link of links) {
    const anchor = link.url.substring(1); // Remove #
    const isValid = await validateAnchorInFile(link.file, anchor);

    if (isValid) {
      results.valid.push(link);
    } else {
      results.broken.push({
        ...link,
        reason: "Anchor not found",
        suggestion: await findSimilarAnchor(link.file, anchor),
      });
    }
  }

  return results;
}

async function validateAnchorInFile(filepath, anchor) {
  try {
    const content = await fs.readFile(filepath, "utf8");
    const ext = path.extname(filepath);

    if (ext === ".md" || ext === ".markdown" || ext === ".mdx") {
      // Convert anchor to heading format
      const headingText = anchor.replace(/-/g, " ");

      // Check for markdown headings
      const headingPatterns = [
        new RegExp(`^#+\\s+.*${anchor}`, "mi"),
        new RegExp(`^#+\\s+${headingText}`, "mi"),
        new RegExp(`<a\\s+(?:name|id)=["']${anchor}["']`, "i"),
        new RegExp(`\\{#${anchor}\\}`, "i"),
      ];

      for (const pattern of headingPatterns) {
        if (pattern.test(content)) {
          return true;
        }
      }
    } else if (ext === ".html" || ext === ".htm") {
      // Check for HTML anchors
      const anchorPatterns = [
        new RegExp(`<[^>]+\\s+id=["']${anchor}["']`, "i"),
        new RegExp(`<a\\s+name=["']${anchor}["']`, "i"),
      ];

      for (const pattern of anchorPatterns) {
        if (pattern.test(content)) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

async function findSimilarAnchor(filepath, anchor) {
  try {
    const content = await fs.readFile(filepath, "utf8");
    const ext = path.extname(filepath);

    const anchors = [];

    if (ext === ".md" || ext === ".markdown" || ext === ".mdx") {
      // Extract all headings
      const headingRegex = /^#+\s+(.+)$/gm;
      let match;

      while ((match = headingRegex.exec(content)) !== null) {
        const heading = match[1];
        const anchorId = heading
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        anchors.push({
          text: heading,
          id: anchorId,
        });
      }
    }

    // Find most similar anchor
    if (anchors.length > 0) {
      const similarities = anchors.map((a) => ({
        ...a,
        similarity: calculateSimilarity(anchor, a.id),
      }));

      similarities.sort((a, b) => b.similarity - a.similarity);

      if (similarities[0].similarity > 0.5) {
        return `Did you mean '#${similarities[0].id}'?`;
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

async function findSimilarFile(targetPath, baseDir) {
  try {
    const targetName = path.basename(targetPath);
    const targetDir = path.dirname(targetPath);

    // Find all files in the base directory
    const allFiles = execSync(
      `find ${baseDir} -type f -name "*.md" -o -name "*.markdown"`,
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    // Calculate similarities
    const similarities = allFiles.map((file) => ({
      file,
      similarity: calculateSimilarity(
        targetName.toLowerCase(),
        path.basename(file).toLowerCase(),
      ),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    if (similarities[0] && similarities[0].similarity > 0.5) {
      const suggestion = path.relative(targetDir, similarities[0].file);
      return `Did you mean '${suggestion}'?`;
    }
  } catch {
    // Ignore errors
  }

  return null;
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

async function fixBrokenLinks(brokenLinks) {
  const results = {
    fixed: [],
    failed: [],
  };

  // Group by file
  const byFile = {};
  for (const link of brokenLinks) {
    if (!byFile[link.file]) byFile[link.file] = [];
    byFile[link.file].push(link);
  }

  // Fix links file by file
  for (const [filepath, links] of Object.entries(byFile)) {
    try {
      let content = await fs.readFile(filepath, "utf8");
      let modified = false;

      for (const link of links) {
        if (link.suggestion && link.suggestion.includes("Did you mean")) {
          // Extract suggested replacement
          const suggestionMatch = link.suggestion.match(/['"]([^'"]+)['"]/);
          if (suggestionMatch) {
            const replacement = suggestionMatch[1];

            // Replace the link
            const oldPattern = new RegExp(
              `\\[([^\\]]+)\\]\\(${escapeRegex(link.url)}\\)`,
              "g",
            );

            if (oldPattern.test(content)) {
              content = content.replace(oldPattern, `[$1](${replacement})`);
              modified = true;

              results.fixed.push({
                file: filepath,
                line: link.line,
                old: link.url,
                new: replacement,
                link: link.url,
              });
            }
          }
        }
      }

      if (modified) {
        await fs.writeFile(filepath, content);
      }
    } catch (error) {
      results.failed.push({
        file: filepath,
        error: error.message,
      });
    }
  }

  return results;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateLinkReport(data) {
  let report = "# Link Validation Report\n\n";

  report += `**Generated**: ${new Date().toISOString()}\n\n`;

  // Summary
  report += "## Summary\n\n";
  report += `- **Files Scanned**: ${data.files}\n`;
  report += `- **Total Links**: ${data.total}\n`;
  report += `- **Valid Links**: ${data.valid.length} ✅\n`;
  report += `- **Broken Links**: ${data.broken.length} ❌\n`;

  if (data.fixed && data.fixed.length > 0) {
    report += `- **Fixed Links**: ${data.fixed.length} 🔧\n`;
  }

  report += "\n";

  // Link breakdown
  report += "## Link Types\n\n";
  report += `- **Internal**: ${data.internal.length}\n`;
  report += `- **External**: ${data.external.length}\n`;
  report += `- **Anchors**: ${data.anchors.length}\n`;
  report += `- **Absolute**: ${data.absolute.length}\n\n`;

  // Broken links details
  if (data.broken.length > 0) {
    report += "## ❌ Broken Links\n\n";

    // Group by file
    const brokenByFile = {};
    for (const link of data.broken) {
      if (!brokenByFile[link.file]) brokenByFile[link.file] = [];
      brokenByFile[link.file].push(link);
    }

    for (const [file, links] of Object.entries(brokenByFile)) {
      report += `### ${file}\n\n`;

      for (const link of links) {
        report += `- **Line ${link.line}**: \`${link.url}\`\n`;
        report += `  - Text: "${link.text}"\n`;
        report += `  - Reason: ${link.reason}\n`;

        if (link.suggestion) {
          report += `  - Suggestion: ${link.suggestion}\n`;
        }

        report += "\n";
      }
    }
  }

  // Fixed links
  if (data.fixed && data.fixed.length > 0) {
    report += "## 🔧 Fixed Links\n\n";

    for (const fix of data.fixed) {
      report += `- **${fix.file}** (line ${fix.line})\n`;
      report += `  - Old: \`${fix.old}\`\n`;
      report += `  - New: \`${fix.new}\`\n\n`;
    }
  }

  // Recommendations
  report += "## Recommendations\n\n";

  if (data.broken.length > 0) {
    report += "1. Review and fix broken links manually\n";
    report += "2. Update relative paths when moving files\n";
    report += "3. Use link checking in CI/CD pipeline\n";
    report +=
      "4. Consider using reference-style links for frequently used URLs\n";
  } else {
    report += "✨ All links are valid!\n\n";
    report += "Best practices:\n";
    report += "1. Continue regular link validation\n";
    report += "2. Use relative links for internal references\n";
    report += "3. Set up automated link checking in CI\n";
  }

  return report;
}
