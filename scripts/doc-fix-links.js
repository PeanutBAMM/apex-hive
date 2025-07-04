// doc-fix-links.js - Fix broken links in documentation
import { readFile, writeFile, listFiles, pathExists } from "../modules/file-ops.js";
import { promises as fs } from "fs";
import path from "path";

export async function run(args) {
  const { 
    target = ".", 
    dryRun = false, 
    updateHttps = true, 
    projectWide = true,  // New option for project-wide scanning
    modules 
  } = args;

  console.error("[DOC-FIX-LINKS] Fixing links" + (projectWide ? " project-wide..." : " in documentation..."));

  try {
    // Find files to check
    const files = projectWide 
      ? await findProjectFiles(target)
      : await findMarkdownFiles(target);

    if (files.length === 0) {
      return {
        status: "no-files",
        message: projectWide ? "No project files found" : "No markdown files found",
        target,
      };
    }

    const allFixes = [];

    // Process each file
    for (const file of files) {
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
  const ext = path.extname(filePath).toLowerCase();

  // For markdown files
  if (ext === '.md') {
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
  }
  
  // For all file types including JS, JSON - check comments and strings
  if (['.js', '.json', '.yaml', '.yml', '.md'].includes(ext)) {
    // Fix file path references in comments and strings
    const pathPatterns = [
      // Matches any docs paths (with or without extensions)
      /["'`](docs\/[^"'`]+)["'`]/g,
      // Matches relative docs paths
      /["'`](\.\.\/docs\/[^"'`]+)["'`]/g,
      // Matches script/module/config paths
      /["'`]((?:scripts|modules|config)\/[^"'`]+\.js)["'`]/g,
    ];

    for (const pattern of pathPatterns) {
      const pathMatches = Array.from(content.matchAll(pattern));
      
      for (const match of pathMatches) {
        const [fullMatch, filePath] = match;
        const fixedPath = await fixFilePath(filePath, modules);
        
        if (fixedPath !== filePath) {
          updated = updated.replace(fullMatch, fullMatch.replace(filePath, fixedPath));
          fixes.push({
            type: "file-path",
            original: filePath,
            fixed: fixedPath,
            line: content.substring(0, match.index).split("\n").length,
          });
        }
      }
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
      
      // If URL ends with / and no variations exist, it's a broken directory link
      if (url.endsWith('/')) {
        console.error(`[DOC-FIX-LINKS] Broken directory link: ${url} from ${fromFile}`);
        
        // For directory links from docs/scripts/*/* to ../architecture/ or ../development/
        // They should be ../../architecture/ or ../../development/
        if (fromFile.startsWith('docs/scripts/') && url.startsWith('../')) {
          const parts = fromFile.split('/');
          const depth = parts.length - 1; // docs/scripts/category/file.md = 3 (not counting file)
          const targetDepth = url.split('../').length - 1; // ../architecture/ = 1 level up
          
          // From docs/scripts/*/* we need to go up 3 levels to reach docs/
          if (depth === 3 && targetDepth === 1) {
            const fixedUrl = '../' + url; // Add one more ../
            console.error(`[DOC-FIX-LINKS] Fixed directory link: ${url} -> ${fixedUrl}`);
            return fixedUrl;
          }
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

async function findProjectFiles(dir) {
  const files = [];
  const extensions = ['.js', '.json', '.md', '.yaml', '.yml'];

  async function scan(directory) {
    try {
      const entries = await listFiles(directory, { 
        withFileTypes: true,
        includeDirectories: true 
      });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (typeof entry.isFile === "function" ? entry.isFile() : entry._isFile) {
          // Skip README files and check extensions
          const basename = path.basename(fullPath).toLowerCase();
          const ext = path.extname(fullPath).toLowerCase();
          
          if (!basename.includes('readme') && extensions.includes(ext)) {
            files.push(fullPath);
          }
        } else if (
          (typeof entry.isDirectory === "function"
            ? entry.isDirectory()
            : entry._isDirectory) &&
          !entry.name.startsWith(".") &&
          !["node_modules", "dist", "build", "coverage", ".git"].includes(entry.name)
        ) {
          await scan(fullPath);
        }
      }
    } catch (error) {
      console.error(`[DOC-FIX-LINKS] Error scanning ${directory}:`, error.message);
    }
  }

  await scan(dir);
  console.error(`[DOC-FIX-LINKS] Found ${files.length} project files`);
  return files;
}

async function fileExists(filePath) {
  return await pathExists(filePath);
}

async function fixFilePath(filePath, modules) {
  // Check if the file exists at the current path
  if (await fileExists(filePath)) {
    return filePath;
  }

  console.error(`[DOC-FIX-LINKS] Broken link found: ${filePath}`);
  
  // Extract filename and analyze the path structure
  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);
  const pathParts = dirname.split('/');
  
  // Smart search: look for the file throughout the docs structure
  const searchResults = await findFileInDocs(basename);
  
  if (searchResults.length === 0) {
    console.error(`[DOC-FIX-LINKS] No replacement found for: ${filePath}`);
    return filePath;
  }
  
  if (searchResults.length === 1) {
    console.error(`[DOC-FIX-LINKS] Found replacement: ${filePath} -> ${searchResults[0]}`);
    return searchResults[0];
  }
  
  // Multiple matches - try to find best match based on context
  const bestMatch = await findBestMatch(filePath, searchResults, pathParts);
  console.error(`[DOC-FIX-LINKS] Best match: ${filePath} -> ${bestMatch}`);
  return bestMatch;
}

async function findFileInDocs(filename) {
  const matches = [];
  
  async function searchDir(dir) {
    try {
      const entries = await listFiles(dir, { 
        withFileTypes: true,
        includeDirectories: true 
      });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if ((typeof entry.isFile === "function" ? entry.isFile() : entry._isFile) && 
            path.basename(fullPath) === filename) {
          matches.push(fullPath);
        } else if ((typeof entry.isDirectory === "function" ? entry.isDirectory() : entry._isDirectory) && 
                   !entry.name.startsWith('.')) {
          await searchDir(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  await searchDir('docs');
  return matches;
}

async function findBestMatch(originalPath, candidates, pathParts) {
  // Score each candidate based on similarity to original path
  const scored = candidates.map(candidate => {
    let score = 0;
    const candidateParts = candidate.split('/');
    
    // Bonus for matching path segments
    for (const part of pathParts) {
      if (candidateParts.includes(part)) {
        score += 10;
      }
      
      // Extra bonus for matching keywords
      if (part.includes('api') && candidate.includes('api')) score += 5;
      if (part.includes('guide') && candidate.includes('guide')) score += 5;
      if (part.includes('reference') && candidate.includes('reference')) score += 5;
      if (part.includes('contrib') && candidate.includes('contrib')) score += 5;
    }
    
    // Penalty for deeply nested paths
    score -= candidateParts.length;
    
    return { path: candidate, score };
  });
  
  // Return highest scoring match
  scored.sort((a, b) => b.score - a.score);
  return scored[0].path;
}
