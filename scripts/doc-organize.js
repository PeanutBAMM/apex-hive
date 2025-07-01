// doc-organize.js - Organize documentation into structured categories
import { readFile, writeFile, pathExists, listFiles, getFileStats } from "../modules/file-ops.js";
import { promises as fs } from "fs"; // Still need for mkdir
import path from "path";

export async function run(args) {
  const { source = "docs", dryRun = false, createIndex = true, modules } = args;

  console.error("[DOC-ORGANIZE] Organizing documentation...");

  try {
    // Define documentation categories
    const categories = {
      "getting-started": {
        patterns: [/README/i, /INSTALL/i, /SETUP/i, /QUICKSTART/i, /TUTORIAL/i],
        description: "Installation and setup guides",
      },
      guides: {
        patterns: [/GUIDE/i, /HOWTO/i, /EXAMPLE/i, /USAGE/i],
        description: "How-to guides and examples",
      },
      reference: {
        patterns: [/API/i, /REFERENCE/i, /CONFIG/i, /SCHEMA/i],
        description: "API and configuration reference",
      },
      concepts: {
        patterns: [/CONCEPT/i, /ARCHITECTURE/i, /DESIGN/i, /OVERVIEW/i],
        description: "Conceptual documentation",
      },
      development: {
        patterns: [/DEVELOPMENT/i, /CONTRIBUTING/i, /BUILD/i, /TEST/i],
        description: "Development and contribution guides",
      },
      deployment: {
        patterns: [/DEPLOY/i, /RELEASE/i, /PRODUCTION/i, /HOSTING/i],
        description: "Deployment and operations",
      },
      troubleshooting: {
        patterns: [/TROUBLESHOOT/i, /FAQ/i, /ERROR/i, /DEBUG/i, /ISSUE/i],
        description: "Troubleshooting and FAQs",
      },
      misc: {
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

    // Categorize documents
    const categorized = await categorizeDocs(allDocs, categories);

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
      const fileList = await listFiles(dir, { includeDirectories: true });
      const entries = fileList;

      for (const entry of entries) {
        const relativePath = path.join(base, entry.name);
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith(".")) {
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

async function categorizeDocs(docs, categories) {
  const categorized = {};

  // Initialize categories
  for (const cat of Object.keys(categories)) {
    categorized[cat] = [];
  }

  for (const doc of docs) {
    let category = "misc";

    // Try to categorize by filename and content
    const content = await readFile(doc.fullPath).catch(() => "");
    const firstLine = content.split("\n")[0] || "";
    const combinedText = `${doc.name} ${firstLine}`;

    // Check each category's patterns
    for (const [cat, config] of Object.entries(categories)) {
      if (cat === "misc") continue;

      for (const pattern of config.patterns) {
        if (pattern.test(combinedText)) {
          category = cat;
          break;
        }
      }

      if (category !== "misc") break;
    }

    // Special case: README in subdirectories
    if (doc.name.toLowerCase() === "readme.md" && doc.path.includes("/")) {
      // Categorize based on parent directory
      const parentDir = path.dirname(doc.path).toLowerCase();
      for (const [cat, config] of Object.entries(categories)) {
        if (cat === "misc") continue;
        if (config.patterns.some((p) => p.test(parentDir))) {
          category = cat;
          break;
        }
      }
    }

    categorized[category].push(doc);
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

    const categoryDir = getCategoryDir(category);

    for (const doc of docs) {
      // Check if already in correct location
      const currentDir = path.dirname(doc.path);

      if (currentDir === "." || currentDir === "") {
        // File is in root, should be moved
        moves.push({
          from: doc.fullPath,
          to: path.join(sourceDir, categoryDir, doc.name),
          category,
        });
      } else if (
        currentDir !== categoryDir &&
        !currentDir.startsWith(categoryDir)
      ) {
        // File is in wrong category
        const newName =
          currentDir === category
            ? doc.name
            : `${currentDir.replace(/\//g, "-")}-${doc.name}`;
        moves.push({
          from: doc.fullPath,
          to: path.join(sourceDir, categoryDir, newName),
          category,
        });
      }
    }
  }

  return moves;
}

function getCategoryDir(category) {
  // Convert category to directory name
  const dirNames = {
    "getting-started": "01-getting-started",
    guides: "02-guides",
    reference: "03-reference",
    concepts: "04-concepts",
    development: "05-development",
    deployment: "06-deployment",
    troubleshooting: "07-troubleshooting",
    misc: "99-misc",
  };

  return dirNames[category] || category;
}

async function executeMoves(moves, modules) {
  let executed = 0;
  const fileOps = modules?.fileOps;

  for (const move of moves) {
    try {
      // Create target directory
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
        `[DOC-ORGANIZE] Moved ${path.basename(move.from)} to ${move.category}`,
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

async function createIndexFiles(sourceDir, categorized, categories) {
  const indexFiles = [];

  // Create main index
  const mainIndex = await createMainIndex(sourceDir, categorized, categories);
  if (mainIndex) indexFiles.push(mainIndex);

  // Create category indexes
  for (const [category, docs] of Object.entries(categorized)) {
    if (docs.length === 0) continue;

    const categoryIndex = await createCategoryIndex(
      sourceDir,
      category,
      docs,
      categories[category],
    );
    if (categoryIndex) indexFiles.push(categoryIndex);
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

    const categoryDir = getCategoryDir(category);
    content += `### [${formatCategoryName(category)}](./${categoryDir}/)\n\n`;
    content += `${config.description}\n\n`;
    content += `- ${docs.length} document${docs.length === 1 ? "" : "s"}\n\n`;
  }

  content += "## Quick Links\n\n";

  // Add important docs
  const importantDocs = [
    { name: "Getting Started", path: "./01-getting-started/README.md" },
    { name: "API Reference", path: "./03-reference/README.md" },
    { name: "Troubleshooting", path: "./07-troubleshooting/README.md" },
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

async function createCategoryIndex(sourceDir, category, docs, config) {
  const categoryDir = getCategoryDir(category);
  const indexPath = path.join(sourceDir, categoryDir, "README.md");

  let content = `# ${formatCategoryName(category)}\n\n`;
  content += `${config.description}\n\n`;
  content += "## Documents\n\n";

  // Sort docs by name
  docs.sort((a, b) => a.name.localeCompare(b.name));

  for (const doc of docs) {
    const title =
      (await getDocTitle(doc.fullPath)) || doc.name.replace(".md", "");
    content += `- [${title}](./${doc.name})\n`;
  }

  content += `\n## Overview\n\n`;
  content += `This category contains ${docs.length} document${docs.length === 1 ? "" : "s"}.\n\n`;

  // Add navigation
  content += "## Navigation\n\n";
  content += "- [← Back to Documentation](../)\n";

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
    const fileList = await listFiles(dir);
    const entries = fileList;

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
