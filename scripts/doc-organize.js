// doc-organize.js - Organize documentation with dynamic folder support
import { readFile, writeFile, pathExists, listFiles, getFileStats } from "../modules/file-ops.js";
import { promises as fs } from "fs"; // Still need for mkdir
import path from "path";

export async function run(args) {
  const { source = "docs", dryRun = false, createIndex = true, modules } = args;

  console.error("[DOC-ORGANIZE] Organizing documentation...");

  try {
    // Define documentation categories with header-based scoring
    const categories = getDocumentationStructure();

    // Validate no duplicate folder names across all levels
    validateNoDuplicateFolders(categories);

    // Find all markdown files
    const allDocs = await findAllDocs(source);

    if (allDocs.length === 0) {
      return {
        status: "no-docs",
        message: "No documentation files found",
        source,
      };
    }

    // Categorize documents with subfolder support
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


// Extract headers from document (H1, H2, H3)
function extractHeaders(content) {
  const headers = {
    title: null,      // H1 - weight 10
    h2: [],          // H2 - weight 5
    h3: []           // H3 - weight 3
  };
  
  const lines = content.split('\n').slice(0, 30); // Check first 30 lines
  
  for (const line of lines) {
    // H1: # Title (usually just one)
    if (line.match(/^#\s+(.+)/) && !headers.title) {
      headers.title = line.substring(2).trim();
    }
    // H2: ## Subtitle
    else if (line.match(/^##\s+(.+)/)) {
      headers.h2.push(line.substring(3).trim());
    }
    // H3: ### Subsubtitle  
    else if (line.match(/^###\s+(.+)/)) {
      headers.h3.push(line.substring(4).trim());
    }
  }
  
  return headers;
}

// Score category based on headers
function scoreCategory(headers, categoryConfig) {
  let score = 0;
  const keywords = categoryConfig.keywords || [];
  
  // Check title (weight 10)
  if (headers.title) {
    for (const keyword of keywords) {
      if (headers.title.toLowerCase().includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
  }
  
  // Check H2s (weight 5)
  for (const h2 of headers.h2) {
    for (const keyword of keywords) {
      if (h2.toLowerCase().includes(keyword.toLowerCase())) {
        score += 5;
      }
    }
  }
  
  // Check H3s (weight 3)
  for (const h3 of headers.h3) {
    for (const keyword of keywords) {
      if (h3.toLowerCase().includes(keyword.toLowerCase())) {
        score += 3;
      }
    }
  }
  
  return score;
}

// Get script subcategory from filename and headers
function getScriptSubcategory(fileName, headers) {
  // Clean filename first
  const clean = fileName.replace(/\.md$/, '');
  
  // Extract from filename (ci-monitor → ci)
  const match = clean.match(/^([^-]+)-/);
  if (match) {
    const prefix = match[1];
    
    // Simple mappings
    const scriptMap = {
      'ci': 'ci',
      'doc': 'doc', 
      'quality': 'quality',
      'git': 'git',
      'backlog': 'backlog',
      'cache': 'cache',
      'deploy': 'deploy',
      'build': 'deploy',
      'release': 'deploy',
      'version': 'deploy',
      'changelog': 'deploy',
      'test': 'quality',
      'lint': 'quality',
      'format': 'quality',
      'xml': 'doc'
    };
    
    if (scriptMap[prefix]) {
      return scriptMap[prefix];
    }
  }
  
  // Check headers as fallback
  const headerText = headers.title + ' ' + headers.h2.join(' ');
  if (headerText.toLowerCase().includes('cache')) return 'cache';
  if (headerText.toLowerCase().includes('ci') || headerText.toLowerCase().includes('continuous')) return 'ci';
  if (headerText.toLowerCase().includes('git')) return 'git';
  if (headerText.toLowerCase().includes('deploy')) return 'deploy';
  if (headerText.toLowerCase().includes('doc')) return 'doc';
  if (headerText.toLowerCase().includes('quality') || headerText.toLowerCase().includes('test')) return 'quality';
  
  return 'utilities';
}

// Define folder structure with keywords for scoring
function getDocumentationStructure() {
  return {
    'getting-started': {
      keywords: ['Getting Started', 'Installation', 'Setup', 'Quick Start', 'Prerequisites', 'Install'],
      description: 'Installation and setup guides',
      subfolders: {}
    },
    
    'architecture': {
      keywords: ['Architecture', 'Design', 'System', 'Overview', 'Structure'],
      description: 'System architecture and components',
      subfolders: {
        'components': {
          keywords: ['Component', 'Module', 'Utility', 'Service', 'Logger', 'Utils'],
          description: 'System components'
        },
        'integrations': {
          keywords: ['Integration', 'MCP', 'Gateway', 'API Integration', 'Connect'],
          description: 'External integrations'
        },
        'patterns': {
          keywords: ['Pattern', 'Best Practice', 'Convention', 'Standard'],
          description: 'Design patterns'
        }
      }
    },
    
    'reference': {
      keywords: ['Reference', 'API', 'Interface', 'Schema', 'Methods'],
      description: 'API and command reference',
      subfolders: {
        'api': {
          keywords: ['API', 'Endpoint', 'Method', 'Interface', 'REST'],
          description: 'API documentation'
        },
        'commands': {
          keywords: ['Command', 'CLI', 'Usage', 'Arguments'],
          description: 'Command reference'
        },
        'configuration': {
          keywords: ['Config', 'Settings', 'Options', 'Environment'],
          description: 'Configuration options'
        }
      }
    },
    
    'scripts': {
      keywords: ['Script', 'Automation', 'Command', 'Tool'],
      description: 'Script documentation',
      // Simple subfolder structure - only 1 level deep
      subfolders: {
        'ci': {
          keywords: ['CI', 'Continuous', 'Pipeline', 'GitHub Actions', 'Monitor', 'Parse'],
          description: 'CI/CD scripts'
        },
        'doc': {
          keywords: ['Doc', 'Generate', 'Validate', 'Organize', 'XML', 'Documentation'],
          description: 'Documentation scripts'
        },
        'quality': {
          keywords: ['Quality', 'Lint', 'Test', 'Console', 'Fix', 'Format'],
          description: 'Code quality scripts'
        },
        'git': {
          keywords: ['Git', 'Commit', 'Branch', 'Tag', 'Push', 'Pull'],
          description: 'Git operations'
        },
        'cache': {
          keywords: ['Cache', 'Warm', 'Clear', 'Unified', 'Status'],
          description: 'Cache management'
        },
        'backlog': {
          keywords: ['Backlog', 'Score', 'Analyze', 'Display'],
          description: 'Backlog management'
        },
        'deploy': {
          keywords: ['Deploy', 'Release', 'Build', 'Changelog', 'Version'],
          description: 'Deployment scripts'
        },
        'utilities': {
          keywords: ['Search', 'Report', 'Init', 'Save', 'Detect', 'Code', 'Startup'],
          description: 'Utility scripts'
        }
      }
    },
    
    'guides': {
      keywords: ['Guide', 'How to', 'Tutorial', 'Walkthrough', 'Example', 'Learn'],
      description: 'How-to guides and tutorials',
      subfolders: {}
    },
    
    'development': {
      keywords: ['Development', 'Contributing', 'Developer', 'Workflow'],
      description: 'Development guides',
      subfolders: {
        'testing': {
          keywords: ['Test', 'Unit', 'Integration', 'Coverage', 'Jest', 'Testing'],
          description: 'Testing documentation'
        },
        'contributing': {
          keywords: ['Contribute', 'PR', 'Pull Request', 'Guidelines', 'Standards'],
          description: 'Contribution guidelines'
        },
        'best-practices': {
          keywords: ['Best Practice', 'Convention', 'Standard', 'Style Guide', 'Pattern'],
          description: 'Development best practices'
        }
      }
    },
    
    'troubleshooting': {
      keywords: ['Troubleshoot', 'Debug', 'Fix', 'Error', 'Problem', 'Issue', 'Solution'],
      description: 'Troubleshooting guides',
      subfolders: {
        'known-issues': {
          keywords: ['Known Issue', 'Common Problem', 'FAQ', 'Limitation', 'Workaround'],
          description: 'Known issues and limitations'
        },
        'debugging': {
          keywords: ['Debug', 'Diagnose', 'Investigate', 'Trace', 'Debugging'],
          description: 'Debugging guides'
        },
        'solutions': {
          keywords: ['Solution', 'Fix', 'Resolution', 'Solved', 'Answer'],
          description: 'Problem solutions'
        }
      }
    },
    
    'operations': {
      keywords: ['Operations', 'Production', 'Monitoring', 'Performance'],
      description: 'Operations and deployment',
      subfolders: {
        'deployment': {
          keywords: ['Deploy', 'Release', 'Production', 'Rollout', 'Publish'],
          description: 'Deployment processes'
        },
        'monitoring': {
          keywords: ['Monitor', 'Log', 'Metric', 'Alert', 'Dashboard', 'Status'],
          description: 'Monitoring and metrics'
        }
      }
    },
    
    'changes': {
      keywords: ['Changes', 'Changelog', 'Update', 'Migration', 'Release Notes'],
      description: 'Change logs and updates',
      subfolders: {}
    },
    
    'misc': {
      keywords: [],
      description: 'Other documentation',
      subfolders: {}
    }
  };
}

// Determine target path based on headers
function determineTargetPath(doc, headers, categories) {
  // Special handling for obvious patterns
  if (doc.name.startsWith('api-')) {
    return ['reference', 'api'];
  }
  if (doc.name.includes('changes-')) {
    return ['changes'];
  }
  
  // Score all categories
  const scores = {};
  
  for (const [category, config] of Object.entries(categories)) {
    scores[category] = scoreCategory(headers, config);
    
    // Check subfolders too
    if (config.subfolders) {
      for (const [sub, subConfig] of Object.entries(config.subfolders)) {
        const subScore = scoreCategory(headers, subConfig);
        if (subScore > 0) {
          const fullPath = `${category}/${sub}`;
          scores[fullPath] = scores[category] + subScore;
        }
      }
    }
  }
  
  // Special handling for scripts - use filename analysis
  if (doc.name.includes('-scripts') || doc.name.includes('script')) {
    const subcat = getScriptSubcategory(doc.name, headers);
    const scriptPath = `scripts/${subcat}`;
    scores[scriptPath] = (scores['scripts'] || 0) + 15; // Boost script categorization
  }
  
  // Find best match
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort(([,a], [,b]) => b - a);
  
  if (sorted.length > 0 && sorted[0][1] >= 5) {
    return sorted[0][0].split('/');
  }
  
  return ['misc'];
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

    // Read content and extract headers for scoring
    const content = await readFile(doc.fullPath).catch(() => "");
    const headers = extractHeaders(content);
    
    // Priority 1: Check if already in correct path
    const currentDir = path.dirname(doc.path);
    if (currentDir !== "." && currentDir !== "") {
      // Check if current directory matches a category
      const pathParts = currentDir.split(path.sep);
      const topLevel = pathParts[0];
      
      // If already in a valid category, keep it there unless scoring suggests otherwise
      if (categories[topLevel]) {
        category = topLevel;
        targetPath = pathParts;
        
        // But still calculate where it SHOULD go
        const suggestedPath = determineTargetPath(doc, headers, categories);
        
        // If suggested path has a much higher score, use that instead
        if (suggestedPath[0] !== category && suggestedPath[0] !== 'misc') {
          const currentScore = scoreCategory(headers, categories[category]);
          const suggestedScore = scoreCategory(headers, categories[suggestedPath[0]]);
          
          if (suggestedScore > currentScore + 10) { // Need significant difference
            category = suggestedPath[0];
            targetPath = suggestedPath;
          }
        }
      }
    }
    
    // Priority 2: Use header-based scoring for uncategorized docs
    if (category === "misc" || currentDir === "." || currentDir === "") {
      targetPath = determineTargetPath(doc, headers, categories);
      category = targetPath[0];
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

// Create index files - only at main level and 1 level deep
async function createIndexFiles(sourceDir, categorized, categories) {
  const indexFiles = [];

  // Create main index
  const mainIndex = await createMainIndex(sourceDir, categorized, categories);
  if (mainIndex) indexFiles.push(mainIndex);

  // Create category indexes (main level)
  for (const [category, docs] of Object.entries(categorized)) {
    if (docs.length === 0) continue;
    
    // Create main category README
    const categoryPath = [category];
    const categoryIndex = await createCategoryIndex(
      sourceDir,
      categoryPath,
      docs, // Pass all docs for full tree
      categories[category],
      true // Include full tree
    );
    if (categoryIndex) indexFiles.push(categoryIndex);
    
    // Create subfolder READMEs (only 1 level deep)
    if (categories[category].subfolders) {
      const subfolderDocs = {};
      
      // Group docs by first-level subfolder
      for (const doc of docs) {
        if (doc.targetPath.length > 1) {
          const subfolder = doc.targetPath[1];
          if (!subfolderDocs[subfolder]) {
            subfolderDocs[subfolder] = [];
          }
          subfolderDocs[subfolder].push(doc);
        }
      }
      
      // Create README for each subfolder
      for (const [subfolder, subDocs] of Object.entries(subfolderDocs)) {
        if (categories[category].subfolders[subfolder]) {
          const subPath = [category, subfolder];
          const subIndex = await createCategoryIndex(
            sourceDir,
            subPath,
            subDocs,
            categories[category].subfolders[subfolder],
            true // Include full tree
          );
          if (subIndex) indexFiles.push(subIndex);
        }
      }
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

async function createCategoryIndex(sourceDir, pathParts, docs, config, includeFullTree = false) {
  const indexPath = path.join(sourceDir, ...pathParts, "README.md");

  let content = `# ${pathParts.map(p => formatCategoryName(p)).join(" / ")}\n\n`;
  content += `${config.description}\n\n`;
  
  if (includeFullTree) {
    // Generate full file tree
    content += "## File Structure\n\n";
    content += "```\n";
    content += await generateFileTree(docs, pathParts);
    content += "```\n\n";
  }
  
  // Add subfolder links if at main category level
  if (pathParts.length === 1 && config.subfolders) {
    content += "## Subcategories\n\n";
    for (const [subName, subConfig] of Object.entries(config.subfolders)) {
      const subDocs = docs.filter(d => d.targetPath[1] === subName);
      if (subDocs.length > 0) {
        content += `- [${formatCategoryName(subName)}](./${subName}/) - ${subConfig.description} (${subDocs.length} files)\n`;
      }
    }
    content += "\n";
  }
  
  // List documents at current level
  const levelDocs = docs.filter(doc => doc.targetPath.length === pathParts.length);
  
  if (levelDocs.length > 0) {
    content += "## Documents in this folder\n\n";
    
    // Sort docs by name
    levelDocs.sort((a, b) => a.name.localeCompare(b.name));

    for (const doc of levelDocs) {
      const title = (await getDocTitle(doc.fullPath)) || doc.name.replace(".md", "");
      content += `- [${title}](./${doc.name})\n`;
    }
    content += "\n";
  }

  // Statistics
  content += "## Overview\n\n";
  const totalDocs = docs.length;
  const subfolderCount = new Set(docs.filter(d => d.targetPath.length > pathParts.length)
    .map(d => d.targetPath[pathParts.length])).size;
  
  content += `- Total documents: ${totalDocs}\n`;
  if (subfolderCount > 0) {
    content += `- Subfolders: ${subfolderCount}\n`;
  }
  content += "\n";

  // Add navigation
  content += "## Navigation\n\n";
  if (pathParts.length > 1) {
    content += `- [← Back to ${formatCategoryName(pathParts[pathParts.length - 2])}](../)\n`;
  } else {
    content += "- [← Back to Documentation](../)\n";
  }
  content += "- [↑ Back to Main Documentation](/${"../".repeat(pathParts.length - 1)})\n";

  await writeFile(indexPath, content);
  return indexPath;
}

// Generate a file tree representation
async function generateFileTree(docs, basePath) {
  const tree = {};
  
  // Build tree structure
  for (const doc of docs) {
    // Get relative path from basePath
    const relativePath = doc.targetPath.slice(basePath.length);
    
    // Build nested structure
    let current = tree;
    for (let i = 0; i < relativePath.length; i++) {
      const part = relativePath[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Add the file
    current[doc.name] = null; // null indicates it's a file
  }
  
  // Convert to string representation
  function treeToString(node, prefix = "", isLast = true) {
    let result = "";
    const entries = Object.entries(node).sort(([a], [b]) => {
      // Folders first, then files
      const aIsFile = a.endsWith('.md');
      const bIsFile = b.endsWith('.md');
      if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
      return a.localeCompare(b);
    });
    
    entries.forEach(([name, children], index) => {
      const isLastEntry = index === entries.length - 1;
      const connector = isLastEntry ? "└── " : "├── ";
      const extension = prefix + connector + name;
      
      result += extension + "\n";
      
      if (children !== null) {
        const newPrefix = prefix + (isLastEntry ? "    " : "│   ");
        result += treeToString(children, newPrefix, isLastEntry);
      }
    });
    
    return result;
  }
  
  // Handle empty tree
  if (Object.keys(tree).length === 0) {
    return "(empty)\n";
  }
  
  return treeToString(tree);
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

// Validate that no folder names are duplicated across all levels
function validateNoDuplicateFolders(categories) {
  const allFolderNames = new Map(); // name -> paths[]
  const duplicates = [];

  function collectFolderNames(obj, path = []) {
    for (const [name, config] of Object.entries(obj)) {
      const fullPath = [...path, name].join('/');
      
      // Track all paths where this name appears
      if (!allFolderNames.has(name)) {
        allFolderNames.set(name, []);
      }
      allFolderNames.get(name).push(fullPath);
      
      // Recursively check subfolders
      if (config.subfolders) {
        collectFolderNames(config.subfolders, [...path, name]);
      }
    }
  }

  // Start collecting from root categories
  collectFolderNames(categories);

  // Find duplicates
  for (const [name, paths] of allFolderNames.entries()) {
    if (paths.length > 1) {
      duplicates.push({
        name,
        paths,
        message: `Folder name "${name}" appears in ${paths.length} locations`
      });
    }
  }

  // If duplicates found, log warnings and auto-fix
  if (duplicates.length > 0) {
    console.error("\n[DOC-ORGANIZE] WARNING: Duplicate folder names detected:");
    duplicates.forEach(dup => {
      console.error(`  - "${dup.name}" appears in:`);
      dup.paths.forEach(p => console.error(`    • ${p}`));
    });
    console.error("\nAuto-fixing duplicate folder names...\n");
    
    // Auto-fix the structure by renaming duplicates
    fixDuplicateFolders(categories);
  }
}

// Fix duplicate folder names by making them unique
function fixDuplicateFolders(categories) {
  const usedNames = new Set();

  function fixFolders(obj, parentPath = [], parentObj = null, parentKey = null) {
    const entries = Object.entries(obj);
    
    for (const [name, config] of entries) {
      let uniqueName = name;
      
      // If name already used, create unique name based on context
      if (usedNames.has(name)) {
        if (parentPath.length > 0) {
          // For deep subfolders, use parent context
          const parentName = parentPath[parentPath.length - 1];
          uniqueName = `${parentName}-${name}`;
        } else {
          // For top-level duplicates, use a suffix
          uniqueName = `${name}-alt`;
        }
        
        // Keep trying until we find a unique name
        let counter = 2;
        while (usedNames.has(uniqueName)) {
          uniqueName = `${name}-${counter}`;
          counter++;
        }
        
        // Update the object with new name
        obj[uniqueName] = obj[name];
        delete obj[name];
        
        console.error(`[DOC-ORGANIZE] Renamed: "${name}" → "${uniqueName}" (in ${parentPath.join('/') || 'root'})`);
      }
      
      usedNames.add(uniqueName);
      
      // Recursively fix subfolders with updated name
      if (obj[uniqueName].subfolders) {
        fixFolders(obj[uniqueName].subfolders, [...parentPath, uniqueName], obj[uniqueName], 'subfolders');
      }
    }
  }

  fixFolders(categories);
}