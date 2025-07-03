// doc-organize.js - Organize documentation with dynamic folder support
import { readFile, writeFile, pathExists, listFiles, getFileStats } from "../modules/file-ops.js";
import { promises as fs } from "fs"; // Still need for mkdir
import path from "path";

export async function run(args) {
  const { source = "docs", dryRun = false, createIndex = true, modules } = args;

  console.error("[DOC-ORGANIZE] Organizing documentation...");

  try {
    // Define documentation categories with improved structure
    const categories = {
      "getting-started": {
        patterns: [/README/i, /INSTALL/i, /SETUP/i, /QUICKSTART/i, /TUTORIAL/i, /getting-started/i],
        description: "Installation and setup guides",
      },
      "architecture": {
        patterns: [/architecture|design|system|flow|gateway|router|module|component|utility|api-|natural-language|recipes|output-formatter/i],
        description: "System architecture and components",
        subfolders: {
          "design": {
            patterns: [/design|architecture|gateway|router|flow|system-overview/i],
            description: "System design and architecture"
          },
          "components": {
            patterns: [/module|component|utility|api-|file-ops|logger|utils|cache|rag|search|backlog|git-ops|output-formatter|natural-language|recipes/i],
            description: "System components and modules",
            subfolders: {
              "core": {
                patterns: [/^(file-ops|logger|utils|git-ops)$/i],
                description: "Core system modules"
              },
              "cache": {
                patterns: [/unified-cache|cache-module/i],
                description: "Caching system"
              },
              "features": {
                patterns: [/natural-language|recipes|output-formatter|rag-system/i],
                description: "System features"
              },
              "api": {
                patterns: [/^api-/i],
                description: "API documentation"
              }
            }
          },
          "patterns": {
            patterns: [/pattern|best-practice|standard|convention/i],
            description: "Design patterns and best practices"
          }
        }
      },
      "scripts": {
        patterns: [/scripts-.*-scripts|changes-scripts-|script-doc|script-ref|script-/i],
        description: "Script documentation",
        dynamicSubfolders: true // Enable dynamic folder detection
      },
      "operations": {
        patterns: [/deploy|release|production|hosting|troubleshoot|monitor|debug|error|issue/i],
        description: "Operations and deployment",
        subfolders: {
          "deployment": {
            patterns: [/deploy|release|production|hosting|changelog|version/i],
            description: "Deployment and releases"
          },
          "troubleshooting": {
            patterns: [/troubleshoot|debug|error|issue|fix|problem/i],
            description: "Troubleshooting guides"
          },
          "monitoring": {
            patterns: [/monitor|status|health|metric|performance/i],
            description: "Monitoring and metrics"
          }
        }
      },
      "development": {
        patterns: [/development|contributing|build|test|testing/i],
        description: "Development guides",
        subfolders: {
          "contributing": {
            patterns: [/contributing|contribute|pull-request/i],
            description: "Contribution guidelines"
          },
          "testing": {
            patterns: [/test|testing|unit-test|integration|spec/i],
            description: "Testing documentation",
            subfolders: {
              "unified-cache": {
                patterns: [/unified-cache|cache.*test/i],
                description: "Cache testing",
                subfolders: {
                  "unit-tests": {
                    patterns: [/unit/i],
                    description: "Unit tests"
                  },
                  "integration-tests": {
                    patterns: [/integration/i],
                    description: "Integration tests"
                  }
                }
              }
            }
          },
          "building": {
            patterns: [/build|compile|bundle|package/i],
            description: "Build processes"
          }
        }
      },
      "reference": {
        patterns: [/reference|command|configuration|schema|quick-ref/i],
        description: "Quick reference guides",
      },
      "changes": {
        patterns: [/^changes-|changelog|update|migration|release-notes/i],
        description: "Change logs and updates",
      },
      "misc": {
        patterns: [],
        description: "Other documentation",
      },
    };

    // Find all markdown files
    const allDocs = await findAllDocs(source);

    if (allDocs.length === 0) {
      return {
        status: "no-docs",
        message: "No documentation files found",
        source,
      };
    }

    // Clean up any existing prefixes first
    const cleanedDocs = await cleanupPrefixes(allDocs);

    // Categorize documents with subfolder support
    const categorized = await categorizeDocs(cleanedDocs, categories);

    // Organize files
    const moves = await planMoves(categorized, source, categories);

    if (moves.length === 0) {
      return {
        status: "organized",
        message: "Documentation is already well organized",
        categories: Object.keys(categorized).map((cat) => ({
          name: cat,
          count: categorized[cat].length,
        })),
      };
    }

    // Execute moves
    let executed = 0;
    if (!dryRun) {
      executed = await executeMoves(moves, modules);
    }

    // Create index files
    let indexFiles = [];
    if (createIndex && !dryRun) {
      indexFiles = await createIndexFiles(source, categorized, categories);
    }

    return {
      status: dryRun ? "dry-run" : "organized",
      source,
      moves: moves.length,
      executed,
      indexFiles: indexFiles.length,
      categories: Object.keys(categorized).map((cat) => ({
        name: cat,
        count: categorized[cat].length,
        description: categories[cat].description,
      })),
      message: dryRun
        ? `Would move ${moves.length} file(s) and create ${indexFiles.length} index file(s)`
        : `Moved ${executed} file(s) and created ${indexFiles.length} index file(s)`,
    };
  } catch (error) {
    console.error("[DOC-ORGANIZE] Error:", error.message);
    return {
      status: "error",
      message: "Failed to organize documentation",
      error: error.message,
    };
  }
}

async function findAllDocs(sourceDir) {
  const docs = [];

  async function scan(dir, base = "") {
    try {
      const entries = await listFiles(dir, { withFileTypes: true, includeDirectories: true });

      for (const entry of entries) {
        const relativePath = path.join(base, entry.name);
        const fullPath = path.join(dir, entry.name);

        if ((typeof entry.isDirectory === "function" ? entry.isDirectory() : entry._isDirectory) && !entry.name.startsWith(".")) {
          await scan(fullPath, relativePath);
        } else if (entry.name.endsWith(".md")) {
          docs.push({
            name: entry.name,
            path: relativePath,
            fullPath,
          });
        }
      }
    } catch (error) {
      console.error(`[DOC-ORGANIZE] Failed to scan ${dir}:`, error.message);
    }
  }

  await scan(sourceDir);
  return docs;
}

// Enhanced cleanup function for complex patterns
function cleanupFileName(fileName) {
  let clean = fileName;
  
  // Remove numbered prefixes: "99-misc-", "03-reference-"
  clean = clean.replace(/^\d{2}-[^-]+-/, '');
  
  // Remove restructuring prefix
  clean = clean.replace(/^restructuring-/, '');
  
  // Remove scripts suffix: "-scripts.md" → ".md"
  clean = clean.replace(/-scripts\.md$/, '.md');
  
  // Remove duplicate patterns: "scripts-ci-scripts" → "ci"
  clean = clean.replace(/^scripts-(.+)-scripts/, '$1');
  
  // Remove changes- prefix for script docs
  clean = clean.replace(/^changes-scripts-/, '');
  
  return clean;
}

async function cleanupPrefixes(docs) {
  // Enhanced cleanup with multiple patterns
  return docs.map(doc => {
    const cleanName = cleanupFileName(doc.name);
    return {
      ...doc,
      originalName: doc.name,
      name: cleanName
    };
  });
}

// Dynamic folder detection for scripts
function detectDynamicFolder(doc, content) {
  const fileName = doc.name.replace('.md', '');
  
  // Try to extract category from filename patterns
  // Examples: "ci-monitor.md" → "ci", "git-commit.md" → "git"
  const prefixMatch = fileName.match(/^([^-]+)-/);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    // Map common prefixes to folders
    const folderMap = {
      'ci': 'ci',
      'doc': 'documentation',
      'quality': 'quality',
      'git': 'git',
      'backlog': 'backlog',
      'cache': 'cache',
      'deploy': 'deployment',
      'build': 'deployment',
      'release': 'deployment',
      'version': 'deployment',
      'test': 'quality',
      'lint': 'quality',
      'format': 'quality',
      'fix': 'utilities',
      'init': 'utilities',
      'report': 'utilities',
      'search': 'utilities',
      'code': 'utilities',
      'save': 'utilities',
      'startup': 'utilities',
      'detect': 'quality',
      'xml': 'documentation',
      'changelog': 'deployment'
    };
    
    if (folderMap[prefix]) {
      return folderMap[prefix];
    }
  }
  
  // Check content for clues
  if (content.includes('CI') || content.includes('continuous integration')) return 'ci';
  if (content.includes('documentation')) return 'documentation';
  if (content.includes('quality') || content.includes('lint')) return 'quality';
  if (content.includes('git') || content.includes('commit')) return 'git';
  if (content.includes('deploy') || content.includes('release')) return 'deployment';
  
  return 'utilities'; // Default
}

// Recursive function to determine target path with subfolders
function determineTargetPath(doc, category, categoryConfig, content) {
  const basePath = [category];
  
  // Handle dynamic subfolders for scripts
  if (categoryConfig.dynamicSubfolders) {
    const dynamicFolder = detectDynamicFolder(doc, content);
    return [...basePath, dynamicFolder];
  }
  
  // Check if category has predefined subfolders
  if (!categoryConfig.subfolders) {
    return basePath;
  }
  
  // Recursive function to find matching subfolder
  function findSubfolder(subfolders, currentPath) {
    for (const [subName, subConfig] of Object.entries(subfolders)) {
      const patterns = subConfig.patterns || [];
      const combinedText = `${doc.name} ${content}`;
      
      // Check if document matches subfolder patterns
      for (const pattern of patterns) {
        if (pattern.test(combinedText)) {
          const newPath = [...currentPath, subName];
          
          // Check for deeper subfolders
          if (subConfig.subfolders) {
            const deeperPath = findSubfolder(subConfig.subfolders, newPath);
            if (deeperPath.length > newPath.length) {
              return deeperPath;
            }
          }
          
          return newPath;
        }
      }
    }
    
    return currentPath;
  }
  
  return findSubfolder(categoryConfig.subfolders, basePath);
}

async function categorizeDocs(docs, categories) {
  const categorized = {};

  // Initialize categories
  for (const cat of Object.keys(categories)) {
    categorized[cat] = [];
  }

  for (const doc of docs) {
    let category = "misc";
    let targetPath = ["misc"];

    // Priority 1: Check if already in correct path
    const currentDir = path.dirname(doc.path);
    if (currentDir !== "." && currentDir !== "") {
      // Check if current directory matches a category or subfolder
      const pathParts = currentDir.split(path.sep);
      const topLevel = pathParts[0];
      
      if (categories[topLevel]) {
        category = topLevel;
        // Keep existing subfolder structure if valid
        targetPath = pathParts;
      }
    }

    // Priority 2: Check filename and content patterns
    if (category === "misc") {
      const content = await readFile(doc.fullPath).catch(() => "");
      const firstLine = content.split("\n")[0] || "";
      const combinedText = `${doc.name} ${firstLine}`;

      // Check each category's patterns
      for (const [cat, config] of Object.entries(categories)) {
        if (cat === "misc") continue;

        for (const pattern of config.patterns) {
          if (pattern.test(combinedText)) {
            category = cat;
            // Determine full target path including subfolders
            targetPath = determineTargetPath(doc, cat, config, content);
            break;
          }
        }

        if (category !== "misc") break;
      }
    }

    // Store with target path
    categorized[category].push({
      ...doc,
      targetPath
    });
  }

  return categorized;
}

async function planMoves(categorized, sourceDir, categories) {
  const moves = [];

  for (const [category, docs] of Object.entries(categorized)) {
    if (category === "misc" && docs.length < 3) {
      // Don't create misc folder for just a few files
      continue;
    }

    for (const doc of docs) {
      // Check if already in correct location
      const currentDir = path.dirname(doc.path);
      const targetDir = doc.targetPath.join(path.sep);

      // Skip if already in correct folder
      if (currentDir === targetDir) {
        continue;
      }

      // Plan move to target path
      moves.push({
        from: doc.fullPath,
        to: path.join(sourceDir, targetDir, doc.name),
        category,
        targetPath: doc.targetPath,
      });
    }
  }

  return moves;
}

async function executeMoves(moves, modules) {
  let executed = 0;
  const fileOps = modules?.fileOps;

  for (const move of moves) {
    try {
      // Create target directory (including nested subdirectories)
      const targetDir = path.dirname(move.to);
      await fs.mkdir(targetDir, { recursive: true });

      // Move file
      if (fileOps) {
        // Use fileOps for better handling
        const content = await fileOps.read(move.from);
        await fileOps.write(move.to, content);
        await fileOps.delete(move.from);
      } else {
        // Direct move
        await fs.rename(move.from, move.to);
      }

      console.error(
        `[DOC-ORGANIZE] Moved ${path.basename(move.from)} to ${move.targetPath.join("/")}`,
      );
      executed++;
    } catch (error) {
      console.error(
        `[DOC-ORGANIZE] Failed to move ${move.from}:`,
        error.message,
      );
    }
  }

  // Clean up empty directories
  await cleanEmptyDirs(path.dirname(moves[0]?.from || "."));

  return executed;
}

// Enhanced index creation with subfolder support
async function createIndexFiles(sourceDir, categorized, categories) {
  const indexFiles = [];

  // Create main index
  const mainIndex = await createMainIndex(sourceDir, categorized, categories);
  if (mainIndex) indexFiles.push(mainIndex);

  // Create category and subfolder indexes
  for (const [category, docs] of Object.entries(categorized)) {
    if (docs.length === 0) continue;

    // Group docs by target path for subfolder indexes
    const pathGroups = {};
    for (const doc of docs) {
      const pathKey = doc.targetPath.join("/");
      if (!pathGroups[pathKey]) {
        pathGroups[pathKey] = [];
      }
      pathGroups[pathKey].push(doc);
    }

    // Create index for each path
    for (const [pathKey, pathDocs] of Object.entries(pathGroups)) {
      const pathParts = pathKey.split("/");
      const indexPath = path.join(sourceDir, ...pathParts, "README.md");
      
      // Find the configuration for this path
      let config = categories[category];
      let currentPath = [category];
      
      // Navigate to the correct config level
      for (let i = 1; i < pathParts.length; i++) {
        if (config.subfolders && config.subfolders[pathParts[i]]) {
          config = config.subfolders[pathParts[i]];
          currentPath.push(pathParts[i]);
        } else if (config.dynamicSubfolders) {
          // For dynamic folders, create a generic config
          config = {
            description: `${formatCategoryName(pathParts[i])} documentation`
          };
          currentPath.push(pathParts[i]);
        }
      }
      
      const index = await createCategoryIndex(
        sourceDir,
        currentPath,
        pathDocs,
        config,
      );
      if (index) indexFiles.push(index);
    }
  }

  return indexFiles;
}

async function createMainIndex(sourceDir, categorized, categories) {
  const indexPath = path.join(sourceDir, "README.md");

  let content = "# Documentation\n\n";
  content += "Welcome to the Apex Hive documentation.\n\n";
  content += "## Categories\n\n";

  for (const [category, config] of Object.entries(categories)) {
    const docs = categorized[category];
    if (docs.length === 0) continue;

    content += `### [${formatCategoryName(category)}](./${category}/)\n\n`;
    content += `${config.description}\n\n`;
    content += `- ${docs.length} document${docs.length === 1 ? "" : "s"}\n\n`;
  }

  content += "## Quick Links\n\n";

  // Add important docs
  const importantDocs = [
    { name: "Getting Started", path: "./getting-started/README.md" },
    { name: "Architecture", path: "./architecture/README.md" },
    { name: "Components", path: "./architecture/components/README.md" },
    { name: "Scripts", path: "./scripts/README.md" },
    { name: "Operations", path: "./operations/README.md" },
    { name: "Development", path: "./development/README.md" },
    { name: "Reference", path: "./reference/README.md" },
  ];

  for (const doc of importantDocs) {
    if (await fileExists(path.join(sourceDir, doc.path))) {
      content += `- [${doc.name}](${doc.path})\n`;
    }
  }

  content += `\n---\n*Generated by Apex Hive on ${new Date().toISOString()}*\n`;

  await writeFile(indexPath, content);
  return indexPath;
}

async function createCategoryIndex(sourceDir, pathParts, docs, config) {
  const indexPath = path.join(sourceDir, ...pathParts, "README.md");

  let content = `# ${pathParts.map(p => formatCategoryName(p)).join(" / ")}\n\n`;
  content += `${config.description}\n\n`;
  
  // Add subfolder links if present
  if (config.subfolders) {
    content += "## Subcategories\n\n";
    for (const [subName, subConfig] of Object.entries(config.subfolders)) {
      content += `- [${formatCategoryName(subName)}](./${subName}/) - ${subConfig.description}\n`;
    }
    content += "\n";
  }
  
  // For dynamic folders, list all subfolders found
  if (config.dynamicSubfolders) {
    const subfolders = new Set();
    docs.forEach(doc => {
      if (doc.targetPath.length > pathParts.length) {
        subfolders.add(doc.targetPath[pathParts.length]);
      }
    });
    
    if (subfolders.size > 0) {
      content += "## Categories\n\n";
      for (const subfolder of Array.from(subfolders).sort()) {
        content += `- [${formatCategoryName(subfolder)}](./${subfolder}/)\n`;
      }
      content += "\n";
    }
  }
  
  content += "## Documents\n\n";

  // Only show documents at this level, not in subfolders
  const levelDocs = docs.filter(doc => doc.targetPath.length === pathParts.length);
  
  // Sort docs by name
  levelDocs.sort((a, b) => a.name.localeCompare(b.name));

  for (const doc of levelDocs) {
    const title =
      (await getDocTitle(doc.fullPath)) || doc.name.replace(".md", "");
    content += `- [${title}](./${doc.name})\n`;
  }

  if (levelDocs.length > 0) {
    content += `\n## Overview\n\n`;
    content += `This category contains ${levelDocs.length} document${levelDocs.length === 1 ? "" : "s"}.\n\n`;
  }

  // Add navigation
  content += "## Navigation\n\n";
  if (pathParts.length > 1) {
    content += `- [← Back to ${formatCategoryName(pathParts[pathParts.length - 2])}](../)\n`;
  } else {
    content += "- [← Back to Documentation](../)\n";
  }

  await writeFile(indexPath, content);
  return indexPath;
}

async function getDocTitle(filePath) {
  try {
    const content = await readFile(filePath);
    const lines = content.split("\n");

    // Find first heading
    for (const line of lines) {
      const match = line.match(/^#\s+(.+)/);
      if (match) {
        return match[1];
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

function formatCategoryName(category) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function cleanEmptyDirs(dir) {
  try {
    const entries = await listFiles(dir, { withFileTypes: true, includeDirectories: true });

    if (entries.length === 0) {
      await fs.rmdir(dir);
    }
  } catch {
    // Ignore errors
  }
}

async function fileExists(filePath) {
  try {
    const exists = await pathExists(filePath);
    if (!exists) throw new Error("File not found");
    return true;
  } catch {
    return false;
  }
}