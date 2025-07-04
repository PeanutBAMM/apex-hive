// doc-generate-missing.js - Generate documentation for files without docs
import { readFile, writeFile, listFiles, pathExists } from "../modules/file-ops.js";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";

export async function run(args = {}) {
  const {
    source,  // Legacy single source
    sources = source ? [source] : ["."], // Scan entire project by default
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
      const stats = await fs.stat(file);
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
        const docPath = getDocPath(file.path, source, docsDir);
        const docContent = await generateDocumentation(file.path, {
          format,
          modules,
        });

        if (!dryRun) {
          // Create directory
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
    // Skip test files
    if (file.includes('.test.') || file.includes('.spec.')) return false;
    // Skip config files that are not main configs
    if (file.includes('jest.config') || file.includes('webpack.config')) return false;
    // Skip generated or debug files
    if (file.includes('-debug.') || file.includes('-fixed.')) return false;
    // Skip node_modules, coverage, etc (already handled by find command)
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
      "*/test/*", // Exclude test directories
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

    // Verify files exist
    for (const file of foundFiles) {
      try {
        if (!(await pathExists(file))) throw new Error();
        files.push(file);
      } catch {
        // File doesn't exist
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
  const possibleLocations = [];

  // Determine possible documentation locations based on file type
  if (sourceFile.startsWith('./scripts/') || sourceFile.startsWith('scripts/')) {
    // Script files
    const scriptName = basename;
    const prefix = scriptName.split('-')[0];
    
    const scriptFolders = {
      ci: "scripts/ci-scripts",
      doc: "scripts/documentation-scripts",
      quality: "scripts/quality-scripts",
      git: "scripts/git-scripts",
      cache: "scripts/cache-scripts",
      backlog: "scripts/backlog-scripts",
      detect: "scripts/detection-scripts",
      fix: "scripts/detection-scripts",
      report: "scripts/detection-scripts",
      startup: "scripts/context-scripts",
      test: "scripts/quality-scripts",
      deploy: "scripts/deployment-scripts",
      version: "scripts/deployment-scripts",
      changelog: "scripts/deployment-scripts",
      release: "scripts/deployment-scripts",
      init: "scripts/core-scripts",
      build: "scripts/deployment-scripts",
      search: "scripts/core-scripts",
      save: "scripts/core-scripts",
      code: "scripts/core-scripts",
    };

    const folder = scriptFolders[prefix] || "scripts";
    possibleLocations.push(
      path.join(docsDir, folder, `${basename}.md`),
      path.join(docsDir, folder, `${basename}-overview.md`),
      path.join(docsDir, folder, `${basename}-documentation.md`)
    );
  } else if (sourceFile.startsWith('./modules/') || sourceFile.startsWith('modules/')) {
    // Module files
    possibleLocations.push(
      path.join(docsDir, "architecture/reference/api", `api-${basename}.md`),
      path.join(docsDir, "architecture/components", `modules-${basename}.md`),
      path.join(docsDir, "architecture/features", `${basename}-system.md`),
      path.join(docsDir, "modules", basename, "README.md")
    );
  } else if (sourceFile.startsWith('./config/') || sourceFile.startsWith('config/')) {
    // Config files
    possibleLocations.push(
      path.join(docsDir, "architecture/reference/configuration", `${basename}.md`),
      path.join(docsDir, "configuration", `${basename}.md`)
    );
  } else if (sourceFile === './index.js' || sourceFile === 'index.js') {
    // Main entry point
    possibleLocations.push(
      path.join(docsDir, "getting-started", "index.md"),
      path.join(docsDir, "architecture", "index.md")
    );
  } else {
    // Root level files
    possibleLocations.push(
      path.join(docsDir, "architecture/components", `${basename}.md`),
      path.join(docsDir, "architecture", `${basename}.md`),
      path.join(docsDir, "development", `${basename}.md`)
    );
  }

  // Check each possible location
  for (const docPath of possibleLocations) {
    if (await pathExists(docPath)) {
      // Verify it documents this source file
      try {
        const content = await readFile(docPath);
        // Check if the doc references the source file
        if (content.includes(basename) || 
            content.includes(`**File**: \`${sourceFile}\``) ||
            content.includes(`**Path**: \`${sourceFile}\``)) {
          return docPath;
        }
      } catch {
        // Continue checking
      }
    }
  }

  return null;
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
  
  // Intelligent location based on file type
  if (sourcePath.includes('/scripts/') || sourcePath.startsWith('scripts/')) {
    const prefix = basename.split('-')[0];
    const scriptFolders = {
      ci: "scripts/ci-scripts",
      doc: "scripts/documentation-scripts",
      quality: "scripts/quality-scripts",
      git: "scripts/git-scripts",
      cache: "scripts/cache-scripts",
      backlog: "scripts/backlog-scripts",
      detect: "scripts/detection-scripts",
      fix: "scripts/detection-scripts",
      report: "scripts/detection-scripts",
      startup: "scripts/context-scripts",
      test: "scripts/quality-scripts",
      deploy: "scripts/deployment-scripts",
      version: "scripts/deployment-scripts",
      changelog: "scripts/deployment-scripts",
      release: "scripts/deployment-scripts",
      init: "scripts/core-scripts",
      build: "scripts/deployment-scripts",
      search: "scripts/core-scripts",
      save: "scripts/core-scripts",
      code: "scripts/core-scripts",
    };
    
    const folder = scriptFolders[prefix] || "scripts";
    return path.join(docsDir, folder, `${basename}.md`);
  } else if (sourcePath.includes('/modules/') || sourcePath.startsWith('modules/')) {
    return path.join(docsDir, "architecture/reference/api", `api-${basename}.md`);
  } else if (sourcePath.includes('/config/') || sourcePath.startsWith('config/')) {
    return path.join(docsDir, "architecture/reference/configuration", `${basename}.md`);
  } else {
    // Root files go to architecture/components
    return path.join(docsDir, "architecture/components", `${basename}.md`);
  }
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

  let doc = `# ${basename}\n\n`;

  // File metadata
  doc += `## File Information\n\n`;
  doc += `- **Path**: \`${filepath}\`\n`;
  doc += `- **Language**: ${language}\n`;
  doc += `- **Lines**: ${lines.length}\n`;
  doc += `- **Size**: ${(content.length / 1024).toFixed(1)}KB\n\n`;

  // Extract and add overview
  const overview = extractOverview(content, language);
  if (overview) {
    doc += `## Overview\n\n${overview}\n\n`;
  } else {
    doc += `## Overview\n\n*No overview found. Please add a file-level comment.*\n\n`;
  }

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

  // Usage example
  doc += `## Usage\n\n`;
  doc += "```" + language + "\n";

  if (language === "javascript" || language === "typescript") {
    const mainExport =
      analysis.exports.find((e) => e.name === "default") || analysis.exports[0];
    if (mainExport) {
      doc += `import ${mainExport.name} from '${filepath}';\n\n`;
      doc += `// TODO: Add usage example\n`;
    } else {
      doc += `// TODO: Add usage example\n`;
    }
  } else {
    doc += `// TODO: Add usage example\n`;
  }

  doc += "```\n\n";

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
