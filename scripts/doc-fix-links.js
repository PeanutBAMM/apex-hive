// doc-fix-links.js - Fix broken links in documentation
import { readFile, writeFile, listFiles, pathExists } from "../modules/file-ops.js";
import { promises as fs } from "fs";
import path from "path";

export async function run(args) {
  const { target = ".", dryRun = false, updateHttps = true, modules } = args;

  console.error("[DOC-FIX-LINKS] Fixing documentation links...");

  try {
    // Find all markdown files
    const mdFiles = await findMarkdownFiles(target);

    if (mdFiles.length === 0) {
      return {
        status: "no-files",
        message: "No markdown files found",
        target,
      };
    }

    const allFixes = [];

    // Process each file
    for (const file of mdFiles) {
      const fixes = await fixFileLinks(file, dryRun, updateHttps, modules);
      if (fixes.length > 0) {
        allFixes.push({
          file,
          fixes,
          count: fixes.length,
        });
      }
    }

    return {
      status: allFixes.length > 0 ? "fixed" : "no-issues",
      files: allFixes.length,
      totalFixes: allFixes.reduce((sum, f) => sum + f.count, 0),
      details: allFixes,
      message: dryRun
        ? `Would fix ${allFixes.reduce((sum, f) => sum + f.count, 0)} link(s) in ${allFixes.length} file(s)`
        : `Fixed ${allFixes.reduce((sum, f) => sum + f.count, 0)} link(s) in ${allFixes.length} file(s)`,
    };
  } catch (error) {
    console.error("[DOC-FIX-LINKS] Error:", error.message);
    return {
      status: "error",
      message: "Failed to fix links",
      error: error.message,
    };
  }
}

async function fixFileLinks(filePath, dryRun, updateHttps, modules) {
  const content = await readFile(filePath);
  let updated = content;
  const fixes = [];

  // Fix markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const matches = Array.from(content.matchAll(linkRegex));

  for (const match of matches) {
    const [fullMatch, text, url] = match;
    const fixedUrl = await fixUrl(url, filePath, updateHttps);

    if (fixedUrl !== url) {
      updated = updated.replace(fullMatch, `[${text}](${fixedUrl})`);
      fixes.push({
        type: "markdown-link",
        original: url,
        fixed: fixedUrl,
        line: content.substring(0, match.index).split("\n").length,
      });
    }
  }

  // Fix image links
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imgMatches = Array.from(content.matchAll(imgRegex));

  for (const match of imgMatches) {
    const [fullMatch, alt, src] = match;
    const fixedSrc = await fixUrl(src, filePath, updateHttps);

    if (fixedSrc !== src) {
      updated = updated.replace(fullMatch, `![${alt}](${fixedSrc})`);
      fixes.push({
        type: "image-link",
        original: src,
        fixed: fixedSrc,
        line: content.substring(0, match.index).split("\n").length,
      });
    }
  }

  // Fix reference-style links
  const refRegex = /^\[([^\]]+)\]:\s*(.+)$/gm;
  const refMatches = Array.from(content.matchAll(refRegex));

  for (const match of refMatches) {
    const [fullMatch, ref, url] = match;
    const fixedUrl = await fixUrl(url, filePath, updateHttps);

    if (fixedUrl !== url) {
      updated = updated.replace(fullMatch, `[${ref}]: ${fixedUrl}`);
      fixes.push({
        type: "reference-link",
        original: url,
        fixed: fixedUrl,
        line: content.substring(0, match.index).split("\n").length,
      });
    }
  }

  // Save if changes were made
  if (!dryRun && updated !== content) {
    await writeFile(filePath, updated);
  }

  return fixes;
}

async function fixUrl(url, fromFile, updateHttps) {
  // Skip external URLs (except for HTTP->HTTPS)
  if (url.includes("://")) {
    if (
      updateHttps &&
      url.startsWith("http://") &&
      !url.includes("localhost")
    ) {
      return url.replace("http://", "https://");
    }
    return url;
  }

  // Skip anchors
  if (url.startsWith("#")) {
    return url;
  }

  // Handle relative links
  if (url.startsWith("./") || url.startsWith("../") || !url.startsWith("/")) {
    const basePath = path.dirname(fromFile);
    const targetPath = path.resolve(basePath, url.split("#")[0]);

    // Check if target exists
    if (!(await fileExists(targetPath))) {
      // Try common variations
      const variations = [
        targetPath + ".md",
        targetPath + "/README.md",
        targetPath + "/index.md",
        targetPath.replace(/\.md$/, ""),
        targetPath.toLowerCase(),
        targetPath.toUpperCase(),
      ];

      for (const variant of variations) {
        if (await fileExists(variant)) {
          // Calculate new relative path
          const newRelative = path.relative(basePath, variant);
          const anchor = url.includes("#")
            ? url.substring(url.indexOf("#"))
            : "";
          return newRelative.split(path.sep).join("/") + anchor;
        }
      }

      // Try to find file by name
      const fileName = path.basename(targetPath);
      const found = await findFileByName(fileName, path.dirname(basePath));

      if (found) {
        const newRelative = path.relative(basePath, found);
        const anchor = url.includes("#") ? url.substring(url.indexOf("#")) : "";
        return newRelative.split(path.sep).join("/") + anchor;
      }
    }
  }

  return url;
}

async function findFileByName(fileName, searchDir) {
  const candidates = [];

  async function scan(dir, depth = 0) {
    if (depth > 3) return; // Limit search depth

    try {
      const entries = await listFiles(dir, {
        withFileTypes: true,
        includeDirectories: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if ((typeof entry.isFile === "function" ? entry.isFile() : entry._isFile) && entry.name === fileName) {
          candidates.push(fullPath);
        } else if (
          (typeof entry.isDirectory === "function"
            ? entry.isDirectory()
            : entry._isDirectory) &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules"
        ) {
          await scan(fullPath, depth + 1);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  await scan(searchDir);

  // Return the closest match
  return candidates.sort((a, b) => {
    const aDepth = a.split(path.sep).length;
    const bDepth = b.split(path.sep).length;
    return aDepth - bDepth;
  })[0];
}

async function findMarkdownFiles(dir) {
  const files = [];

  async function scan(directory) {
    try {
      const entries = await listFiles(directory, {
        withFileTypes: true,
        includeDirectories: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (
          (typeof entry.isDirectory === "function"
            ? entry.isDirectory()
            : entry._isDirectory) &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules"
        ) {
          await scan(fullPath);
        } else if (entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(
        `[DOC-FIX-LINKS] Failed to scan ${directory}:`,
        error.message,
      );
    }
  }

  await scan(dir);
  return files;
}

async function fileExists(filePath) {
  return await pathExists(filePath);
}
