// doc-organize.js - Organize documentation with deterministic rules
import { readFile, writeFile, pathExists, listFiles, getFileStats } from "../modules/file-ops.js";
import { promises as fs } from "fs"; 
import path from "path";

export async function run(args) {
  const { source = "docs", dryRun = false, createIndex = true } = args;

  console.error("[DOC-ORGANIZE] Organizing documentation...");

  try {
    // Define simple documentation structure
    const structure = getDocumentationStructure();

    // Find all markdown files
    const allDocs = await findAllDocs(source);

    if (allDocs.length === 0) {
      return {
        status: "no-docs",
        message: "No documentation files found",
        source,
      };
    }

    // Categorize documents using deterministic rules
    const categorized = await categorizeDocs(allDocs);

    // Plan moves
    const moves = await planMoves(categorized, source);

    if (moves.length === 0) {
      return {
        status: "organized",
        message: "Documentation is already well organized",
        stats: getCategoryStats(categorized),
      };
    }

    // Execute moves
    let executed = 0;
    if (!dryRun) {
      executed = await executeMoves(moves);
    }

    // Create index files
    let indexFiles = [];
    if (createIndex && !dryRun) {
      indexFiles = await createIndexFiles(source, categorized, structure);
    }

    return {
      status: dryRun ? "dry-run" : "organized",
      source,
      moves: moves.length,
      executed,
      indexFiles: indexFiles.length,
      stats: getCategoryStats(categorized),
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

// Simple documentation structure
function getDocumentationStructure() {
  return {
    'getting-started': {
      description: 'Installation and setup guides',
      subfolders: []
    },
    'architecture': {
      description: 'System architecture and design',
      subfolders: ['design', 'features', 'components', 'patterns', 'reference', 'reference/api', 'reference/commands', 'reference/configuration']
    },
    'scripts': {
      description: 'Script documentation',
      subfolders: [
        'ci-scripts',
        'documentation-scripts', 
        'quality-scripts',
        'git-scripts',
        'cache-scripts',
        'backlog-scripts',
        'deployment-scripts',
        'core-scripts',
        'detection-scripts',
        'context-scripts'
      ]
    },
    'development': {
      description: 'Development guides',
      subfolders: ['testing', 'contributing', 'best-practices', 'deployment', 'monitoring']
    },
    'troubleshooting': {
      description: 'Troubleshooting and debugging',
      subfolders: ['known-issues', 'debugging', 'solutions']
    },
    'changes': {
      description: 'Change logs and updates',
      subfolders: []
    },
    'misc': {
      description: 'Other documentation',
      subfolders: ['test-results']
    }
  };
}

// Find all markdown files
async function findAllDocs(sourceDir) {
  const docs = [];

  async function scan(dir, base = "") {
    try {
      const entries = await listFiles(dir, { withFileTypes: true, includeDirectories: true });

      for (const entry of entries) {
        const relativePath = path.join(base, entry.name);
        const fullPath = path.join(dir, entry.name);

        if (isDirectory(entry) && !entry.name.startsWith(".")) {
          await scan(fullPath, relativePath);
        } else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
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

// Extract headers from content (simplified)
function extractHeaders(content) {
  const headers = {
    title: '',
    h2: [],
    h3: []
  };
  
  const lines = content.split('\n').slice(0, 30);
  for (const line of lines) {
    if (line.match(/^#\s+(.+)/) && !headers.title) {
      headers.title = line.substring(2).trim();
    } else if (line.match(/^##\s+(.+)/)) {
      headers.h2.push(line.substring(3).trim());
    } else if (line.match(/^###\s+(.+)/)) {
      headers.h3.push(line.substring(4).trim());
    }
  }
  
  return headers;
}

// Deterministic categorization based on content and headers
async function categorizeDocs(docs) {
  const categorized = {};
  const structure = getDocumentationStructure();
  
  // Initialize categories
  Object.keys(structure).forEach(cat => {
    categorized[cat] = [];
  });

  for (const doc of docs) {
    const content = await readFile(doc.fullPath).catch(() => "");
    const headers = extractHeaders(content);
    const targetPath = determineTargetPath(doc, headers, content);
    
    
    const category = targetPath[0] || 'misc';
    categorized[category].push({
      ...doc,
      targetPath
    });
  }

  return categorized;
}

// Determine target path using deterministic rules
function determineTargetPath(doc, headers, content) {
  const name = doc.name.toLowerCase();
  const title = headers.title || '';
  const path = doc.path.toLowerCase();
  
  // API documentation
  if (name.startsWith('api-')) {
    return ['architecture', 'reference', 'api'];
  }
  
  // Documentation that references source files
  // Support both **File**: and **Path**: formats
  const sourceFileMatch = content.match(/\*\*(File|Path)\*\*:\s*`([^`]+)`/);
  if (sourceFileMatch) {
    const sourcePath = sourceFileMatch[2].replace(/^\.\//, ''); // Strip leading ./ if present
    
    // For scripts
    if (sourcePath.startsWith('scripts/')) {
      const scriptName = sourcePath.split('/').pop().replace('.js', '');
      return ['scripts', detectScriptType(scriptName, headers)];
    }
    
    // For modules (goes to components)
    if (sourcePath.startsWith('modules/')) {
      return ['architecture', 'components'];
    }
    
    // For config files
    if (sourcePath.startsWith('config/')) {
      return ['architecture', 'reference', 'configuration'];
    }
    
    // For root level tools (install-mcp.js etc)
    if (sourcePath.endsWith('.js') && !sourcePath.includes('/')) {
      if (sourcePath.includes('install') || sourcePath.includes('setup')) {
        return ['getting-started'];
      }
      return ['architecture', 'reference', 'configuration'];
    }
  }
  
  // Changes documentation
  if (name.includes('changes-') || path.includes('changes/')) {
    return ['changes'];
  }
  
  // System features (architecture/features)
  if (title.includes('System') && 
      (headers.h2.some(h => h.includes('Architecture') || h.includes('Implementation')) ||
       content.includes('implementation'))) {
    if (name.includes('cache') || title.includes('Cache')) {
      return ['architecture', 'features'];
    }
    if (name.includes('backlog') || title.includes('Backlog')) {
      return ['architecture', 'features'];
    }
    if (name.includes('rag') || title.includes('RAG')) {
      return ['architecture', 'features'];
    }
    if (name.includes('memory') || title.includes('Memory')) {
      return ['architecture', 'features'];
    }
  }
  
  // Architecture documentation
  if (title.includes('Architecture') && !title.includes('System')) {
    return ['architecture', 'design'];
  }
  
  // Components and utilities
  if ((title.includes('Module') || title.includes('Component') || title.includes('Utility')) &&
      !title.includes('System')) {
    return ['architecture', 'components'];
  }
  
  // MCP Integration (part of architecture design)
  if (name.includes('mcp') || title.includes('MCP')) {
    return ['architecture', 'design'];
  }
  
  // Natural Language feature
  if (name.includes('natural-language') || title.includes('Natural Language')) {
    return ['architecture', 'features'];
  }
  
  // Script documentation
  if (name.includes('-scripts') || name.includes('script') || 
      title.includes('Script') || headers.h2.some(h => h.includes('Usage') || h.includes('Command'))) {
    const scriptType = detectScriptType(name, headers);
    return ['scripts', scriptType];
  }
  
  // Recipes and workflows
  if (title.includes('Recipe') || title.includes('Workflow') || 
      headers.h2.some(h => h.includes('Recipe') || h.includes('Workflow'))) {
    return ['architecture', 'reference', 'commands'];
  }
  
  // Troubleshooting
  if (title.includes('Troubleshoot') || title.includes('Debug') || title.includes('Error') ||
      headers.h2.some(h => h.includes('Debug') || h.includes('Error') || h.includes('Issue'))) {
    return ['troubleshooting'];
  }
  
  // Test results, reports, and verification documents
  if (name.includes('test-results') || name.includes('test-plan') || 
      name.includes('verification-results') || name.includes('validation-report') ||
      name.includes('report') || name.includes('results')) {
    return ['misc', 'test-results'];
  }
  
  // Getting started
  if (title.includes('Getting Started') || title.includes('Installation') || 
      title.includes('Setup') || title.includes('Quick Start')) {
    return ['getting-started'];
  }
  
  // Development
  if (title.includes('Development') || title.includes('Contributing') || 
      title.includes('Testing') || title.includes('Best Practice')) {
    if (title.includes('Test') || headers.h2.some(h => h.includes('Test'))) {
      return ['development', 'testing'];
    }
    if (title.includes('Contribut')) {
      return ['development', 'contributing'];
    }
    if (title.includes('Best Practice') || title.includes('Convention')) {
      return ['development', 'best-practices'];
    }
    return ['development'];
  }
  
  // Deployment and monitoring
  if (title.includes('Deploy') || title.includes('Release') || title.includes('Production')) {
    return ['development', 'deployment'];
  }
  if (title.includes('Monitor') || title.includes('Metric')) {
    return ['development', 'monitoring'];
  }
  
  // Reference (catch remaining)
  if (title.includes('Reference') || title.includes('Command') || title.includes('Configuration')) {
    return ['architecture', 'reference'];
  }
  
  // Default
  return ['misc'];
}

// Detect script type from name and headers
function detectScriptType(name, headers) {
  // Remove common prefixes and suffixes
  const clean = name
    .replace(/^scripts-/, '')
    .replace(/-scripts\.md$/, '.md')
    .replace(/\.md$/, '');
  
  // Extract prefix
  const prefix = clean.split('-')[0];
  
  // Map to script categories based on registry.js
  const scriptMap = {
    // CI Scripts
    'ci': 'ci-scripts',
    
    // Documentation Scripts
    'doc': 'documentation-scripts',
    'xml': 'documentation-scripts',
    'organize': 'documentation-scripts',
    'generate': 'documentation-scripts',
    'validate': 'documentation-scripts',
    'update': 'documentation-scripts',
    'sync': 'documentation-scripts',
    
    // Quality Scripts
    'quality': 'quality-scripts',
    'test': 'quality-scripts',
    'lint': 'quality-scripts',
    'format': 'quality-scripts',
    'console': 'quality-scripts',
    
    // Git Scripts
    'git': 'git-scripts',
    'commit': 'git-scripts',
    'push': 'git-scripts',
    'tag': 'git-scripts',
    'branch': 'git-scripts',
    'pull': 'git-scripts',
    
    // Cache Scripts
    'cache': 'cache-scripts',
    'warm': 'cache-scripts',
    'clear': 'cache-scripts',
    
    // Backlog Scripts
    'backlog': 'backlog-scripts',
    
    // Deployment Scripts
    'deploy': 'deployment-scripts',
    'build': 'deployment-scripts',
    'release': 'deployment-scripts',
    'version': 'deployment-scripts',
    'changelog': 'deployment-scripts',
    
    // Detection Scripts
    'detect': 'detection-scripts',
    'fix': 'detection-scripts',
    'report': 'detection-scripts',
    
    // Core Scripts
    'init': 'core-scripts',
    'search': 'core-scripts',
    'save': 'core-scripts',
    'code': 'core-scripts',
    
    // Context Scripts
    'startup': 'context-scripts',
    'context': 'context-scripts'
  };
  
  return scriptMap[prefix] || 'core-scripts';
}

// Plan file moves
async function planMoves(categorized, sourceDir) {
  const moves = [];

  for (const [category, docs] of Object.entries(categorized)) {
    for (const doc of docs) {
      const currentDir = path.dirname(doc.path);
      const targetDir = doc.targetPath.join(path.sep);

      // Skip if already in correct location
      if (currentDir === targetDir) {
        continue;
      }

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

// Execute file moves
async function executeMoves(moves) {
  let executed = 0;

  for (const move of moves) {
    try {
      // Create target directory
      const targetDir = path.dirname(move.to);
      await fs.mkdir(targetDir, { recursive: true });

      // Move file
      await fs.rename(move.from, move.to);

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

// Create index files (only main level - no subfolder READMEs)
async function createIndexFiles(sourceDir, categorized, structure) {
  const indexFiles = [];

  // Create main index
  const mainIndex = await createMainIndex(sourceDir, categorized, structure);
  if (mainIndex) indexFiles.push(mainIndex);

  // Create category indexes (hoofdfolders only)
  for (const [category, docs] of Object.entries(categorized)) {
    if (docs.length === 0) continue;
    
    // Main category README with complete file tree
    const categoryIndex = await createCategoryIndex(
      sourceDir,
      [category],
      docs,
      structure[category],
      true  // Include full tree showing all sub/subsub folders
    );
    if (categoryIndex) indexFiles.push(categoryIndex);
    
    // NO subfolder READMEs - hoofdfolder README shows everything already
  }

  return indexFiles;
}

// Create main README
async function createMainIndex(sourceDir, categorized, structure) {
  const indexPath = path.join(sourceDir, "README.md");

  let content = "# Documentation\n\n";
  content += "Welcome to the Apex Hive documentation.\n\n";
  content += "## Categories\n\n";

  for (const [category, config] of Object.entries(structure)) {
    const docs = categorized[category] || [];
    if (docs.length === 0 && category !== 'misc') continue;

    content += `### [${formatName(category)}](./${category}/)\n\n`;
    content += `${config.description}\n\n`;
    content += `- ${docs.length} document${docs.length === 1 ? "" : "s"}\n\n`;
  }

  content += `\n---\n*Generated by Apex Hive on ${new Date().toISOString()}*\n`;

  await writeFile(indexPath, content);
  return indexPath;
}

// Create category README with file tree
async function createCategoryIndex(sourceDir, pathParts, docs, config, includeTree = false) {
  const indexPath = path.join(sourceDir, ...pathParts, "README.md");

  let content = `# ${pathParts.map(formatName).join(" / ")}\n\n`;
  content += `${config.description}\n\n`;
  
  if (includeTree) {
    // Generate file tree
    content += "## File Structure\n\n";
    content += "```\n";
    content += await generateFileTree(docs, pathParts);
    content += "```\n\n";
  }
  
  // List direct documents
  const directDocs = docs.filter(doc => doc.targetPath.length === pathParts.length);
  if (directDocs.length > 0) {
    content += "## Documents\n\n";
    
    directDocs.sort((a, b) => a.name.localeCompare(b.name));
    for (const doc of directDocs) {
      const title = await getDocTitle(doc.fullPath) || doc.name.replace(".md", "");
      content += `- [${title}](./${doc.name})\n`;
    }
    content += "\n";
  }
  
  // Statistics
  content += "## Overview\n\n";
  const totalDocs = docs.length;
  const subfolderCount = new Set(
    docs.filter(d => d.targetPath.length > pathParts.length)
        .map(d => d.targetPath[pathParts.length])
  ).size;
  
  content += `- Total documents: ${totalDocs}\n`;
  if (subfolderCount > 0) {
    content += `- Subfolders: ${subfolderCount}\n`;
  }
  content += "\n";

  // Navigation
  content += "## Navigation\n\n";
  if (pathParts.length > 1) {
    content += `- [← Back to ${formatName(pathParts[pathParts.length - 2])}](../)\n`;
  }
  content += `- [↑ Back to Main Documentation](${"../".repeat(pathParts.length)})\n`;

  await writeFile(indexPath, content);
  return indexPath;
}

// Generate file tree
async function generateFileTree(docs, basePath) {
  const tree = {};
  
  // Build tree structure
  for (const doc of docs) {
    const relativePath = doc.targetPath.slice(basePath.length);
    
    let current = tree;
    for (const part of relativePath) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[doc.name] = null; // null = file
  }
  
  // Convert to string
  function treeToString(node, prefix = "", isLast = true) {
    let result = "";
    const entries = Object.entries(node).sort(([a], [b]) => {
      const aIsFile = a.endsWith('.md');
      const bIsFile = b.endsWith('.md');
      if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
      return a.localeCompare(b);
    });
    
    entries.forEach(([name, children], index) => {
      const isLastEntry = index === entries.length - 1;
      const connector = isLastEntry ? "└── " : "├── ";
      result += prefix + connector + name + "\n";
      
      if (children !== null) {
        const newPrefix = prefix + (isLastEntry ? "    " : "│   ");
        result += treeToString(children, newPrefix);
      }
    });
    
    return result;
  }
  
  return Object.keys(tree).length === 0 ? "(empty)\n" : treeToString(tree);
}

// Get document title
async function getDocTitle(filePath) {
  try {
    const content = await readFile(filePath);
    const match = content.match(/^#\s+(.+)/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Clean empty directories
async function cleanEmptyDirs(dir) {
  try {
    const entries = await listFiles(dir, { withFileTypes: true, includeDirectories: true });
    if (entries.length === 0 && dir !== "docs") {
      await fs.rmdir(dir);
      console.error(`[DOC-ORGANIZE] Removed empty directory: ${dir}`);
    }
  } catch {
    // Ignore errors
  }
}

// Helper functions
function isDirectory(entry) {
  return typeof entry.isDirectory === "function" 
    ? entry.isDirectory() 
    : entry._isDirectory;
}

function formatName(name) {
  return name
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCategoryStats(categorized) {
  return Object.entries(categorized).map(([name, docs]) => ({
    name,
    count: docs.length,
    description: getDocumentationStructure()[name]?.description || ""
  }));
}