// doc-generate-missing.js - Generate documentation for files without docs
import { readFile, writeFile, listFiles, pathExists, batchRead, getFileStats } from "../modules/file-ops.js";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";

export async function run(args = {}) {
  const {
    sources = ["."], // Scan entire project by default
    docsDir = "docs",
    extensions = [".js", ".ts", ".jsx", ".tsx"],
    format = "markdown",
    threshold = 10, // Lower threshold to catch more files
    dryRun = false,
    modules = {},
  } = args;

  console.error(
    "[DOC-GENERATE-MISSING] Finding files without documentation...",
  );
  console.error(`[DOC-GENERATE-MISSING] Searching in: ${sources.join(", ")}`);

  try {
    // Find all source files from multiple sources
    const sourceFiles = await findAllSourceFiles(sources, extensions);
    console.error(`[DOC-GENERATE-MISSING] Total files found: ${sourceFiles.length}`);

    if (sourceFiles.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          missing: 0,
          generated: [],
        },
        message: "No source files found",
      };
    }

    console.error(
      `[DOC-GENERATE-MISSING] Found ${sourceFiles.length} source files`,
    );

    // Find corresponding docs with intelligent location mapping
    const missingDocs = await findMissingDocsIntelligent(sourceFiles, docsDir);

    if (missingDocs.length === 0) {
      return {
        success: true,
        data: {
          total: sourceFiles.length,
          missing: 0,
          generated: [],
        },
        message: "All files have documentation",
      };
    }

    console.error(
      `[DOC-GENERATE-MISSING] Found ${missingDocs.length} files without docs`,
    );

    // Filter by size threshold
    const filesToDocument = [];
    for (const file of missingDocs) {
      const stats = await getFileStats(file);
      const lines = await countLines(file);

      if (lines >= threshold) {
        filesToDocument.push({
          path: file,
          size: stats.size,
          lines,
        });
      }
    }

    if (filesToDocument.length === 0) {
      return {
        success: true,
        data: {
          total: sourceFiles.length,
          missing: missingDocs.length,
          generated: [],
          belowThreshold: missingDocs.length,
        },
        message: `All ${missingDocs.length} undocumented files are below ${threshold} lines threshold`,
      };
    }

    // Generate documentation
    const generated = [];
    const failed = [];

    for (const file of filesToDocument) {
      try {
        const docPath = getDocPath(file.path, "", docsDir);
        const docContent = await generateDocumentation(file.path, {
          format,
          modules,
        });

        if (!dryRun) {
          // Create directory - still need fs for mkdir
          await fs.mkdir(path.dirname(docPath), { recursive: true });

          // Write documentation
          await writeFile(docPath, docContent);
        }

        generated.push({
          source: file.path,
          doc: docPath,
          lines: file.lines,
          size: docContent.length,
        });
      } catch (error) {
        failed.push({
          file: file.path,
          error: error.message,
        });
      }
    }

    // Generate summary report
    if (generated.length > 0 && !dryRun) {
      const reportPath = path.join(docsDir, "missing-docs-report.md");
      const report = generateReport({
        total: sourceFiles.length,
        missing: missingDocs.length,
        generated,
        failed,
        threshold,
      });

      await writeFile(reportPath, report);
    }

    return {
      success: true,
      dryRun,
      data: {
        total: sourceFiles.length,
        missing: missingDocs.length,
        generated: generated.map((g) => g.doc),
        failed: failed.length,
        report:
          generated.length > 0 && !dryRun
            ? path.join(docsDir, "missing-docs-report.md")
            : null,
      },
      message: dryRun
        ? `Would generate ${generated.length} missing documentation files`
        : `Generated ${generated.length} missing documentation files`,
    };
  } catch (error) {
    console.error("[DOC-GENERATE-MISSING] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to generate missing documentation",
    };
  }
}

async function findAllSourceFiles(sources, extensions) {
  const allFiles = new Set();

  for (const sourceDir of sources) {
    const files = await findSourceFiles(sourceDir, extensions);
    files.forEach(f => allFiles.add(f));
  }

  // Filter out files we don't want to document
  const filteredFiles = Array.from(allFiles).filter(file => {
    // Skip test files (but not test runners)
    if ((file.includes('.test.') || file.includes('.spec.')) && !file.includes('test-runner')) return false;
    // Skip debug and fixed versions
    if (file.includes('-debug.') || file.includes('-fixed.')) return false;
    // Skip README.js files if any
    if (file.toLowerCase().includes('readme.js')) return false;
    // Keep all other JS files including configs, modules, scripts, etc.
    return true;
  });

  return filteredFiles;
}

async function findSourceFiles(sourceDir, extensions) {
  const files = [];

  try {
    // Build find command with more exclusions
    const extPatterns = extensions.map((ext) => `-name "*${ext}"`).join(" -o ");
    const excludePaths = [
      "*/node_modules/*",
      "*/dist/*", 
      "*/build/*",
      "*/coverage/*",
      "*/.git/*",
      // Note: NOT excluding test/ to catch test runners and setup files
      "*/.cache/*",
      "*/tmp/*"
    ].map(p => `-not -path "${p}"`).join(" ");
    
    const command = `find ${sourceDir} -type f \\( ${extPatterns} \\) ${excludePaths}`;

    const output = execSync(command, { encoding: "utf8" });
    const foundFiles = output
      .trim()
      .split("\n")
      .filter((f) => f);
    
    console.error(`[DOC-GENERATE-MISSING] Find command found ${foundFiles.length} files in ${sourceDir}`);

    // Verify files exist using cached pathExists
    for (const file of foundFiles) {
      if (await pathExists(file)) {
        files.push(file);
      }
    }
  } catch (error) {
    console.error("[DOC-GENERATE-MISSING] Error finding files:", error.message);
  }

  return files;
}

async function findMissingDocsIntelligent(sourceFiles, docsDir) {
  const missing = [];

  for (const sourceFile of sourceFiles) {
    const existingDoc = await findExistingDocForFile(sourceFile, docsDir);
    
    if (!existingDoc) {
      missing.push(sourceFile);
    }
  }

  return missing;
}

async function findExistingDocForFile(sourceFile, docsDir) {
  const basename = path.basename(sourceFile, path.extname(sourceFile));
  
  try {
    // Search the entire docs directory for any markdown file that documents this source file
    const command = `find ${docsDir} -name "*.md" -type f`;
    const output = execSync(command, { encoding: "utf8" });
    const docFiles = output.trim().split("\n").filter(f => f);
    
    // Normalize the source file path for comparison
    const normalizedSource = sourceFile.replace(/^\.\//, '');
    
    // Check each doc file to see if it documents this source file
    for (const docFile of docFiles) {
      // Skip report files and lists
      if (docFile.includes('report') || docFile.includes('missing-docs')) {
        continue;
      }
      
      try {
        const content = await readFile(docFile);
        const lines = content.split('\n');
        
        // Check multiple patterns that indicate this doc is for the source file
        if (
          // Direct path references
          content.includes(`**File**: \`${sourceFile}\``) ||
          content.includes(`**Path**: \`${sourceFile}\``) ||
          content.includes(`**File**: \`${normalizedSource}\``) ||
          content.includes(`**Path**: \`${normalizedSource}\``) ||
          // File name in main header (first few lines only)
          lines.slice(0, 5).some(line => 
            line === `# ${basename}` || 
            line === `# ${basename}.js` ||
            line === `# ${basename.replace(/-/g, ' ')}`
          ) ||
          // Check if it's an API doc for this module
          (docFile.includes('api-') && docFile.includes(basename) && 
           lines.slice(0, 5).some(line => line.includes(basename)))
        ) {
          console.error(`[DOC-GENERATE-MISSING] Found existing doc for ${sourceFile} at ${docFile}`);
          return docFile;
        }
      } catch {
        // Continue if file can't be read
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[DOC-GENERATE-MISSING] Error searching for existing docs: ${error.message}`);
    return null;
  }
}

async function countLines(filepath) {
  try {
    const content = await readFile(filepath);
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

function getDocPath(sourcePath, sourceRoot, docsDir) {
  const basename = path.basename(sourcePath, path.extname(sourcePath));
  // Simple: all docs go to root of docs folder for doc:organize to sort later
  return path.join(docsDir, `${basename}.md`);
}

async function generateDocumentation(filepath, options) {
  try {
    const content = await readFile(filepath);
    const ext = path.extname(filepath);
    const basename = path.basename(filepath);
    const language = getLanguage(ext);

    // Try to use doc-generate module if available
    if (options.modules["doc:generate"]) {
      try {
        const result = await options.modules["doc:generate"].run({
          files: [filepath],
          format: options.format,
          dryRun: true,
        });

        if (
          result.success &&
          result.data.generated &&
          result.data.generated[0]
        ) {
          return result.data.generated[0].content;
        }
      } catch {
        // Fall back to our generator
      }
    }

    // Generate documentation based on format
    switch (options.format) {
      case "markdown":
        return generateMarkdownDoc(filepath, content, language);

      case "jsdoc":
        return (
          extractJSDocComments(content) ||
          generateMarkdownDoc(filepath, content, language)
        );

      case "html":
        return generateHTMLDoc(filepath, content, language);

      default:
        return generateMarkdownDoc(filepath, content, language);
    }
  } catch (error) {
    throw new Error(`Failed to generate doc for ${filepath}: ${error.message}`);
  }
}

function generateMarkdownDoc(filepath, content, language) {
  const lines = content.split("\n");
  const basename = path.basename(filepath);
  const dirname = path.dirname(filepath);
  const fileType = detectFileType(filepath, content);

  let doc = `# ${basename}\n\n`;

  // File metadata
  doc += `## File Information\n\n`;
  doc += `- **Path**: \`${filepath}\`\n`;
  doc += `- **Language**: ${language}\n`;
  doc += `- **Lines**: ${lines.length}\n`;
  doc += `- **Size**: ${(content.length / 1024).toFixed(1)}KB\n`;
  doc += `- **Type**: ${fileType}\n`;
  doc += `- **Last Modified**: ${new Date().toISOString()}\n\n`;

  // Extract and add overview
  const overview = extractOverview(content, language) || generateAutoOverview(filepath, content, fileType);
  doc += `## Overview\n\n${overview}\n\n`;

  // Analyze code structure
  const analysis = analyzeCode(content, language);

  // Dependencies/Imports
  if (analysis.imports.length > 0) {
    doc += `## Dependencies\n\n`;
    for (const imp of analysis.imports) {
      doc += `- \`${imp}\`\n`;
    }
    doc += "\n";
  }

  // Exports
  if (analysis.exports.length > 0) {
    doc += `## Exports\n\n`;
    for (const exp of analysis.exports) {
      doc += `- \`${exp.name}\`${exp.type ? ` (${exp.type})` : ""}\n`;
    }
    doc += "\n";
  }

  // Functions
  if (analysis.functions.length > 0) {
    doc += `## Functions\n\n`;
    for (const func of analysis.functions) {
      doc += `### ${func.name}\n\n`;

      if (func.description) {
        doc += `${func.description}\n\n`;
      }

      doc += `**Signature:**\n`;
      doc += "```" + language + "\n";
      doc += func.signature + "\n";
      doc += "```\n\n";

      if (func.params.length > 0) {
        doc += `**Parameters:**\n`;
        for (const param of func.params) {
          doc += `- \`${param}\`\n`;
        }
        doc += "\n";
      }
    }
  }

  // Classes
  if (analysis.classes.length > 0) {
    doc += `## Classes\n\n`;
    for (const cls of analysis.classes) {
      doc += `### ${cls.name}\n\n`;

      if (cls.extends) {
        doc += `**Extends:** \`${cls.extends}\`\n\n`;
      }

      if (cls.methods.length > 0) {
        doc += `**Methods:**\n`;
        for (const method of cls.methods) {
          doc += `- \`${method}\`\n`;
        }
        doc += "\n";
      }
    }
  }

  // TODO comments
  if (analysis.todos.length > 0) {
    doc += `## TODO\n\n`;
    for (const todo of analysis.todos) {
      doc += `- ${todo}\n`;
    }
    doc += "\n";
  }

  // Add type-specific sections
  if (fileType === "Script") {
    doc += generateScriptSection(basename, content, analysis);
  } else if (fileType === "Module") {
    doc += generateModuleSection(basename, content, analysis);
  } else if (fileType === "Configuration") {
    doc += generateConfigSection(basename, content, analysis);
  } else if (fileType === "Test") {
    doc += generateTestSection(basename, content, analysis);
  }

  // Usage example
  doc += `## Usage\n\n`;
  doc += generateUsageExample(filepath, fileType, analysis, language);

  // Related Documentation
  doc += `## Related Documentation\n\n`;
  doc += generateRelatedDocs(filepath, fileType, basename);

  // See also section
  doc += `## See Also\n\n`;
  doc += `- [Source Code](${filepath})\n`;

  // Try to find related files
  const relatedFiles = findRelatedFiles(filepath, dirname);
  for (const related of relatedFiles) {
    doc += `- [${path.basename(related)}](${related})\n`;
  }

  return doc;
}

function generateHTMLDoc(filepath, content, language) {
  const markdown = generateMarkdownDoc(filepath, content, language);

  // Convert markdown to HTML
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${path.basename(filepath)} - Documentation</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 { color: #2c3e50; }
    h1 { border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { margin-top: 30px; }
    code { 
      background: #f4f4f4; 
      padding: 2px 6px; 
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
    }
    pre { 
      background: #282c34; 
      color: #abb2bf;
      padding: 15px; 
      border-radius: 5px; 
      overflow-x: auto;
    }
    pre code { 
      background: none; 
      padding: 0;
      color: inherit;
    }
    ul { padding-left: 30px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
`;

  // Basic markdown to HTML conversion
  html += markdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /```(\w+)\n([\s\S]+?)```/g,
      '<pre><code class="language-$1">$2</code></pre>',
    )
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^<p>/, "")
    .replace(/<\/p>$/, "");

  html += `
  <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
    Generated on ${new Date().toISOString()}
  </footer>
</body>
</html>`;

  return html;
}

function extractJSDocComments(content) {
  const comments = [];
  const regex = /\/\*\*([\s\S]*?)\*\//g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    comments.push(match[0]);
  }

  return comments.length > 0 ? comments.join("\n\n") : null;
}

function extractOverview(content, language) {
  // Look for file-level documentation
  if (["javascript", "typescript"].includes(language)) {
    // Check for /** */ comment at start
    const match = content.match(/^\/\*\*([\s\S]*?)\*\//);
    if (match) {
      return match[1]
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, ""))
        .join("\n")
        .trim();
    }

    // Check for // comments at start
    const lines = content.split("\n");
    const comments = [];
    for (const line of lines) {
      if (line.trim().startsWith("//")) {
        comments.push(line.replace(/^\/\/\s?/, "").trim());
      } else if (line.trim()) {
        break;
      }
    }
    if (comments.length > 0) {
      return comments.join("\n");
    }
  } else if (language === "python") {
    // Check for module docstring
    const match = content.match(/^"""([\s\S]*?)"""/);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function analyzeCode(content, language) {
  const analysis = {
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    todos: [],
  };

  if (["javascript", "typescript"].includes(language)) {
    // Extract imports
    const importRegex =
      /import\s+(?:(?:\{[^}]+\}|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      analysis.imports.push(match[1]);
    }

    // Extract exports
    const exportRegex =
      /export\s+(?:(default)\s+)?(?:(function|class|const|let|var)\s+)?(\w+)?/g;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[3]) {
        analysis.exports.push({
          name: match[1] === "default" ? "default" : match[3],
          type: match[2] || "value",
        });
      }
    }

    // Extract functions
    const funcRegex =
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    while ((match = funcRegex.exec(content)) !== null) {
      const params = match[2]
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      analysis.functions.push({
        name: match[1],
        signature: match[0],
        params,
      });
    }

    // Extract arrow functions
    const arrowRegex =
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      const params = match[2]
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      analysis.functions.push({
        name: match[1],
        signature: match[0],
        params,
      });
    }

    // Extract classes
    const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const methods = [];

      // Find methods
      const methodRegex = new RegExp(
        `class\\s+${className}[\\s\\S]*?\\{([\\s\\S]*?)\\}`,
        "g",
      );
      const classMatch = methodRegex.exec(content);
      if (classMatch) {
        const classBody = classMatch[1];
        const methodNameRegex = /(?:async\s+)?(\w+)\s*\(/g;
        let methodMatch;
        while ((methodMatch = methodNameRegex.exec(classBody)) !== null) {
          methods.push(methodMatch[1]);
        }
      }

      analysis.classes.push({
        name: className,
        extends: match[2] || null,
        methods,
      });
    }
  }

  // Extract TODOs (language agnostic)
  const todoRegex = /(?:\/\/|#|\/\*)\s*TODO\s*:?\s*(.+?)(?:\*\/|$)/gi;
  let match;
  while ((match = todoRegex.exec(content)) !== null) {
    analysis.todos.push(match[1].trim());
  }

  return analysis;
}

function getLanguage(ext) {
  const languages = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".py": "python",
    ".java": "java",
    ".go": "go",
    ".rb": "ruby",
    ".php": "php",
    ".c": "c",
    ".cpp": "cpp",
    ".cs": "csharp",
    ".rs": "rust",
    ".swift": "swift",
    ".kt": "kotlin",
  };

  return languages[ext] || "text";
}

function findRelatedFiles(filepath, dirname) {
  const related = [];
  const basename = path.basename(filepath, path.extname(filepath));

  // Common related file patterns
  const patterns = [
    `${basename}.test`,
    `${basename}.spec`,
    `${basename}.d.ts`,
    `${basename}.types`,
    `${basename}.interface`,
    `${basename}.model`,
    `${basename}.service`,
    `${basename}.controller`,
  ];

  // Would need actual file system check
  // This is just for demonstration

  return related;
}

function generateReport(data) {
  let report = "# Missing Documentation Report\n\n";

  report += `**Generated**: ${new Date().toISOString()}\n\n`;

  // Summary
  report += "## Summary\n\n";
  report += `- **Total Source Files**: ${data.total}\n`;
  report += `- **Files Without Docs**: ${data.missing}\n`;
  report += `- **Documentation Coverage**: ${((1 - data.missing / data.total) * 100).toFixed(1)}%\n`;
  report += `- **Files Below Threshold**: ${data.missing - data.generated.length - data.failed}\n`;
  report += `- **Documentation Generated**: ${data.generated.length}\n`;
  report += `- **Failed**: ${data.failed}\n\n`;

  // Generated documentation
  if (data.generated.length > 0) {
    report += "## Generated Documentation\n\n";

    // Sort by lines (largest first)
    const sorted = [...data.generated].sort((a, b) => b.lines - a.lines);

    for (const item of sorted) {
      report += `### ${path.basename(item.source)}\n`;
      report += `- **Source**: \`${item.source}\`\n`;
      report += `- **Documentation**: \`${item.doc}\`\n`;
      report += `- **Lines**: ${item.lines}\n`;
      report += `- **Doc Size**: ${(item.size / 1024).toFixed(1)}KB\n\n`;
    }
  }

  // Failed files
  if (data.failed > 0) {
    report += "## Failed Documentation\n\n";
    for (const fail of data.failed) {
      report += `- \`${fail.file}\`: ${fail.error}\n`;
    }
    report += "\n";
  }

  // Recommendations
  report += "## Recommendations\n\n";
  report += "1. Review generated documentation for accuracy\n";
  report += "2. Add file-level comments to source files\n";
  report += "3. Use JSDoc comments for better documentation\n";
  report += "4. Consider lowering threshold if many small files lack docs\n";

  return report;
}

// Helper functions for enhanced documentation

function detectFileType(filepath, content) {
  const basename = path.basename(filepath);
  
  if (filepath.includes('/scripts/') || filepath.startsWith('scripts/')) return 'Script';
  if (filepath.includes('/modules/') || filepath.startsWith('modules/')) return 'Module';
  if (filepath.includes('/config/') || filepath.startsWith('config/')) return 'Configuration';
  if (filepath.includes('/test/') || basename.includes('.test.') || basename.includes('.spec.')) return 'Test';
  if (basename.includes('index.js')) return 'Entry Point';
  if (basename.includes('server')) return 'Server Component';
  if (basename.includes('router')) return 'Router';
  if (basename.includes('formatter')) return 'Formatter';
  if (basename.includes('install') || basename.includes('setup')) return 'Installation Script';
  
  return 'Component';
}

function generateAutoOverview(filepath, content, fileType) {
  const basename = path.basename(filepath, path.extname(filepath));
  
  switch (fileType) {
    case 'Script':
      return `This script provides functionality for ${basename.replace(/-/g, ' ')}. It is part of the Apex Hive automation system.`;
    case 'Module':
      return `The ${basename} module provides reusable functionality that can be imported by other parts of the system.`;
    case 'Configuration':
      return `Configuration file that defines settings and patterns for ${basename.replace(/-/g, ' ')}.`;
    case 'Test':
      return `Test suite for ${basename.replace('.test', '').replace('.spec', '')} functionality.`;
    case 'Entry Point':
      return `Main entry point for the application. This file initializes and coordinates the system components.`;
    case 'Server Component':
      return `Server component that handles ${basename.includes('mcp') ? 'MCP (Model Context Protocol)' : 'server'} functionality.`;
    case 'Router':
      return `Routing component that handles command dispatch and natural language processing.`;
    case 'Installation Script':
      return `Installation and setup script for ${basename.replace(/-/g, ' ')}.`;
    default:
      return `Component that provides ${basename.replace(/-/g, ' ')} functionality.`;
  }
}

function generateScriptSection(basename, content, analysis) {
  let section = `## Script Details\n\n`;
  
  // Extract command name if it's an apex script
  const commandName = basename.replace('.js', '');
  section += `- **Command**: \`apex ${commandName}\`\n`;
  
  // Check if it accepts arguments
  if (content.includes('args.') || content.includes('const {')) {
    section += `- **Accepts Arguments**: Yes\n`;
  }
  
  // Check for dry-run support
  if (content.includes('dryRun')) {
    section += `- **Supports Dry Run**: Yes\n`;
  }
  
  section += `\n`;
  return section;
}

function generateModuleSection(basename, content, analysis) {
  let section = `## Module Details\n\n`;
  
  if (analysis.exports.length > 0) {
    section += `This module exports ${analysis.exports.length} function(s)/class(es) for use by other components.\n\n`;
  }
  
  // Check for singleton pattern
  if (content.includes('instance') && content.includes('getInstance')) {
    section += `- **Pattern**: Singleton\n`;
  }
  
  // Check for caching
  if (content.includes('cache') || content.includes('Cache')) {
    section += `- **Features**: Caching support\n`;
  }
  
  section += `\n`;
  return section;
}

function generateConfigSection(basename, content, analysis) {
  let section = `## Configuration Details\n\n`;
  
  // Count configuration entries
  const configMatches = content.match(/['"][\w-]+['"]\s*:/g);
  if (configMatches) {
    section += `- **Configuration Entries**: ${configMatches.length}\n`;
  }
  
  // Check for patterns
  if (content.includes('pattern') || content.includes('regex')) {
    section += `- **Type**: Pattern/Regex Configuration\n`;
  }
  
  section += `\n`;
  return section;
}

function generateTestSection(basename, content, analysis) {
  let section = `## Test Details\n\n`;
  
  // Count test cases
  const testMatches = content.match(/\b(it|test|describe)\s*\(/g);
  if (testMatches) {
    section += `- **Test Cases**: ${testMatches.filter(m => m.includes('it') || m.includes('test')).length}\n`;
    section += `- **Test Suites**: ${testMatches.filter(m => m.includes('describe')).length}\n`;
  }
  
  section += `\n`;
  return section;
}

function generateUsageExample(filepath, fileType, analysis, language) {
  let example = "```" + language + "\n";
  
  switch (fileType) {
    case 'Script':
      const scriptName = path.basename(filepath, '.js');
      example += `// Run this script via the apex command\n`;
      example += `apex ${scriptName}\n\n`;
      example += `// With arguments\n`;
      example += `apex ${scriptName} --arg value\n`;
      break;
      
    case 'Module':
      if (analysis.exports.length > 0) {
        const mainExport = analysis.exports.find(e => e.name === 'default') || analysis.exports[0];
        example += `import { ${mainExport.name} } from '${filepath}';\n\n`;
        example += `// Use the module\n`;
        example += `const result = await ${mainExport.name}();\n`;
      }
      break;
      
    case 'Configuration':
      example += `import config from '${filepath}';\n\n`;
      example += `// Access configuration\n`;
      example += `const setting = config.someSetting;\n`;
      break;
      
    default:
      example += `// Import and use this component\n`;
      example += `import Component from '${filepath}';\n`;
  }
  
  example += "```\n\n";
  return example;
}

function generateRelatedDocs(filepath, fileType, basename) {
  let docs = "";
  
  if (fileType === 'Script') {
    docs += `- [Apex Hive Commands Reference](../architecture/reference/commands/)\n`;
    docs += `- [Script Development Guide](../development/scripts/)\n`;
  } else if (fileType === 'Module') {
    docs += `- [API Reference](../architecture/reference/api/)\n`;
    docs += `- [Module Architecture](../architecture/components/)\n`;
  } else if (fileType === 'Configuration') {
    docs += `- [Configuration Guide](../architecture/reference/configuration/)\n`;
  }
  
  docs += `\n`;
  return docs;
}
