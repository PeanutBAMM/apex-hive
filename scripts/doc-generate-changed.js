// doc-generate-changed.js - Generate documentation for changed files
import { execSync } from "child_process";
import { readFile, writeFile, batchRead, batchWrite, pathExists } from "../modules/file-ops.js";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    since = "HEAD~1",
    branch,
    format = "markdown",
    output = "docs/changes",
    includeTests = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[DOC-GENERATE-CHANGED] Generating docs for changed files...");

  try {
    // Get changed files
    const changedFiles = await getChangedFiles({ since, branch });

    if (changedFiles.length === 0) {
      return {
        success: true,
        data: {
          files: 0,
          generated: [],
        },
        message: "No changed files found",
      };
    }

    // Filter files
    const filesToDocument = changedFiles.filter((file) => {
      // Skip non-code files
      if (!file.match(/\.(js|ts|jsx|tsx|py|java|go|rb)$/)) return false;

      // Skip test files unless included
      if (!includeTests && file.match(/\.(test|spec)\./)) return false;

      // Skip node_modules and build directories
      if (
        file.includes("node_modules") ||
        file.includes("dist") ||
        file.includes("build")
      ) {
        return false;
      }

      return true;
    });

    console.error(
      `[DOC-GENERATE-CHANGED] Found ${filesToDocument.length} files to document`,
    );

    const generated = [];
    const failed = [];
    const docsToWrite = {};

    // Generate documentation for each file
    for (const file of filesToDocument) {
      try {
        const docResult = await generateFileDoc(file, { format, modules });

        if (docResult.success) {
          const docPath = getDocPath(file, output);

          if (!dryRun) {
            // Create directory
            await fs.mkdir(path.dirname(docPath), { recursive: true });
            
            // Queue for batch write
            docsToWrite[docPath] = docResult.content;
          }

          generated.push({
            source: file,
            doc: docPath,
            size: docResult.content.length,
          });
        } else {
          failed.push({
            file,
            error: docResult.error,
          });
        }
      } catch (error) {
        failed.push({
          file,
          error: error.message,
        });
      }
    }

    // Generate index if multiple files
    if (generated.length > 1 && !dryRun) {
      const indexPath = path.join(output, "index.md");
      const indexContent = generateIndex(generated, { since, branch });
      docsToWrite[indexPath] = indexContent;
    }
    
    // Batch write all documentation files
    if (!dryRun && Object.keys(docsToWrite).length > 0) {
      const { errors: writeErrors } = await batchWrite(docsToWrite);
      
      // Report write errors
      for (const [file, error] of Object.entries(writeErrors)) {
        console.error(`[DOC-GENERATE-CHANGED] Error writing ${file}:`, error);
        failed.push({ file, error });
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        files: filesToDocument.length,
        generated: generated.map((g) => g.doc),
        failed: failed.length,
        index: generated.length > 1 ? path.join(output, "index.md") : null,
      },
      message: dryRun
        ? `Would generate docs for ${generated.length} changed files`
        : `Generated docs for ${generated.length} changed files`,
    };
  } catch (error) {
    console.error("[DOC-GENERATE-CHANGED] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to generate documentation for changed files",
    };
  }
}

async function getChangedFiles(options) {
  const files = [];

  try {
    let command;

    if (options.branch) {
      // Compare with specific branch
      const baseBranch = options.branch;
      command = `git diff --name-only ${baseBranch}...HEAD`;
    } else {
      // Compare with commit/tag
      command = `git diff --name-only ${options.since}`;
    }

    const output = execSync(command, { encoding: "utf8" });
    const changedFiles = output
      .trim()
      .split("\n")
      .filter((f) => f);

    // Check if files still exist in parallel
    const existChecks = await Promise.all(
      changedFiles.map(async (file) => ({
        file,
        exists: await pathExists(file)
      }))
    );
    
    files.push(...existChecks.filter(check => check.exists).map(check => check.file));
  } catch (error) {
    console.error(
      "[DOC-GENERATE-CHANGED] Error getting changed files:",
      error.message,
    );
  }

  return files;
}

async function generateFileDoc(filepath, options) {
  try {
    const content = await readFile(filepath);
    const ext = path.extname(filepath);
    const basename = path.basename(filepath);
    const language = getLanguage(ext);

    let docContent = "";

    switch (options.format) {
      case "markdown":
        docContent = generateMarkdownDoc(filepath, content, language);
        break;

      case "jsdoc":
        docContent = generateJSDoc(filepath, content);
        break;

      case "html":
        docContent = generateHTMLDoc(filepath, content, language);
        break;

      default:
        docContent = generateMarkdownDoc(filepath, content, language);
    }

    // Try to use doc-generate module if available
    if (options.modules["doc:generate"]) {
      try {
        const result = await options.modules["doc:generate"].run({
          files: [filepath],
          format: options.format,
          dryRun: true,
        });

        if (result.success && result.data.generated) {
          docContent = result.data.generated[0].content || docContent;
        }
      } catch {
        // Use our generated content
      }
    }

    return {
      success: true,
      content: docContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function generateMarkdownDoc(filepath, content, language) {
  const lines = content.split("\n");
  const basename = path.basename(filepath);

  let doc = `# ${basename}\n\n`;

  // Add file info
  doc += `**File**: \`${filepath}\`\n`;
  doc += `**Language**: ${language}\n`;
  doc += `**Lines**: ${lines.length}\n`;
  doc += `**Last Modified**: ${new Date().toISOString()}\n\n`;

  // Extract overview from comments
  const overview = extractOverview(content, language);
  if (overview) {
    doc += `## Overview\n\n${overview}\n\n`;
  }

  // Extract functions/classes
  const symbols = extractSymbols(content, language);

  if (symbols.functions.length > 0) {
    doc += `## Functions\n\n`;
    for (const func of symbols.functions) {
      doc += `### ${func.name}\n\n`;
      if (func.description) {
        doc += `${func.description}\n\n`;
      }
      if (func.params.length > 0) {
        doc += `**Parameters:**\n`;
        for (const param of func.params) {
          doc += `- \`${param.name}\`${param.type ? ` (${param.type})` : ""}: ${param.description || "No description"}\n`;
        }
        doc += "\n";
      }
      if (func.returns) {
        doc += `**Returns:** ${func.returns}\n\n`;
      }

      // Add signature
      doc += "```" + language + "\n";
      doc += func.signature + "\n";
      doc += "```\n\n";
    }
  }

  if (symbols.classes.length > 0) {
    doc += `## Classes\n\n`;
    for (const cls of symbols.classes) {
      doc += `### ${cls.name}\n\n`;
      if (cls.description) {
        doc += `${cls.description}\n\n`;
      }

      if (cls.methods.length > 0) {
        doc += `#### Methods\n\n`;
        for (const method of cls.methods) {
          doc += `- **${method.name}**: ${method.description || "No description"}\n`;
        }
        doc += "\n";
      }
    }
  }

  // Add source code reference
  doc += `## Source Code\n\n`;
  doc += `View the full source code: [${basename}](${filepath})\n`;

  return doc;
}

function generateJSDoc(filepath, content) {
  // Extract JSDoc comments
  const jsdocComments = [];
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
  let match;

  while ((match = jsdocRegex.exec(content)) !== null) {
    jsdocComments.push(match[1]);
  }

  if (jsdocComments.length === 0) {
    return `// No JSDoc comments found in ${filepath}`;
  }

  let doc = `/**\n * Documentation for ${filepath}\n */\n\n`;

  for (const comment of jsdocComments) {
    doc += `/**${comment}*/\n\n`;
  }

  return doc;
}

function generateHTMLDoc(filepath, content, language) {
  const markdown = generateMarkdownDoc(filepath, content, language);

  // Simple markdown to HTML conversion
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Documentation: ${path.basename(filepath)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
  </style>
</head>
<body>
`;

  // Convert markdown to HTML (basic)
  html += markdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /```(\w+)\n([\s\S]+?)```/g,
      '<pre><code class="language-$1">$2</code></pre>',
    )
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");

  html += "</body></html>";

  return html;
}

function extractOverview(content, language) {
  // Look for file-level comments
  let overview = "";

  if (["javascript", "typescript", "java", "go"].includes(language)) {
    // Look for /** */ at the start
    const match = content.match(/^\/\*\*([\s\S]*?)\*\//);
    if (match) {
      overview = match[1]
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, ""))
        .join("\n")
        .trim();
    }
  } else if (language === "python") {
    // Look for docstring
    const match = content.match(/^"""([\s\S]*?)"""/m);
    if (match) {
      overview = match[1].trim();
    }
  }

  return overview;
}

function extractSymbols(content, language) {
  const symbols = {
    functions: [],
    classes: [],
  };

  if (["javascript", "typescript"].includes(language)) {
    // Extract functions
    const funcRegex =
      /(?:\/\*\*([\s\S]*?)\*\/\s*)?(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      const jsdoc = match[1] || "";
      const name = match[2];
      const params = match[3];

      const func = {
        name,
        signature: match[0].replace(/\/\*\*[\s\S]*?\*\/\s*/, ""),
        params: parseParams(params, jsdoc),
        description: extractDescription(jsdoc),
        returns: extractReturns(jsdoc),
      };

      symbols.functions.push(func);
    }

    // Extract arrow functions with const
    const arrowRegex =
      /(?:\/\*\*([\s\S]*?)\*\/\s*)?(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g;

    while ((match = arrowRegex.exec(content)) !== null) {
      const jsdoc = match[1] || "";
      const name = match[2];
      const params = match[3];

      const func = {
        name,
        signature: match[0].replace(/\/\*\*[\s\S]*?\*\/\s*/, ""),
        params: parseParams(params, jsdoc),
        description: extractDescription(jsdoc),
        returns: extractReturns(jsdoc),
      };

      symbols.functions.push(func);
    }

    // Extract classes
    const classRegex =
      /(?:\/\*\*([\s\S]*?)\*\/\s*)?(?:export\s+)?class\s+(\w+)/g;

    while ((match = classRegex.exec(content)) !== null) {
      const jsdoc = match[1] || "";
      const name = match[2];

      const cls = {
        name,
        description: extractDescription(jsdoc),
        methods: extractClassMethods(content, name),
      };

      symbols.classes.push(cls);
    }
  }

  return symbols;
}

function parseParams(paramString, jsdoc) {
  const params = [];

  if (paramString.trim()) {
    // Parse parameter names from signature
    const paramNames = paramString
      .split(",")
      .map((p) => {
        const match = p.trim().match(/(\w+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    // Extract param descriptions from JSDoc
    const paramRegex = /@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.+)/g;
    const jsdocParams = {};
    let match;

    while ((match = paramRegex.exec(jsdoc)) !== null) {
      jsdocParams[match[2]] = {
        type: match[1],
        description: match[3],
      };
    }

    // Combine
    for (const name of paramNames) {
      params.push({
        name,
        type: jsdocParams[name]?.type || null,
        description: jsdocParams[name]?.description || null,
      });
    }
  }

  return params;
}

function extractDescription(jsdoc) {
  if (!jsdoc) return null;

  // Remove @tags and get first paragraph
  const lines = jsdoc
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .filter((line) => !line.startsWith("@"));

  // Find first non-empty line
  for (const line of lines) {
    if (line.trim()) {
      return line.trim();
    }
  }

  return null;
}

function extractReturns(jsdoc) {
  if (!jsdoc) return null;

  const match = jsdoc.match(/@returns?\s+(?:\{([^}]+)\}\s+)?(.+)/);
  if (match) {
    return match[2].trim();
  }

  return null;
}

function extractClassMethods(content, className) {
  const methods = [];

  // Look for methods after class declaration
  const classStart = content.indexOf(`class ${className}`);
  if (classStart === -1) return methods;

  const afterClass = content.substring(classStart);
  const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g;
  let match;

  while ((match = methodRegex.exec(afterClass)) !== null) {
    const name = match[1];
    if (name !== "constructor") {
      methods.push({
        name,
        description: null, // Would need more parsing for descriptions
      });
    }
  }

  return methods;
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
  };

  return languages[ext] || "text";
}

function getDocPath(sourcePath, outputDir) {
  // Convert source path to doc path
  const ext = path.extname(sourcePath);
  const relativePath = sourcePath.replace(/^\.\//, "");
  const docName = relativePath.replace(ext, ".md");

  return path.join(outputDir, docName);
}

function generateIndex(generated, options) {
  let index = "# Changed Files Documentation\n\n";

  index += `**Generated**: ${new Date().toISOString()}\n`;

  if (options.since) {
    index += `**Changes Since**: ${options.since}\n`;
  }
  if (options.branch) {
    index += `**Compared With**: ${options.branch}\n`;
  }

  index += `\n**Total Files**: ${generated.length}\n\n`;

  // Group by directory
  const byDir = {};
  for (const item of generated) {
    const dir = path.dirname(item.source);
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(item);
  }

  // Generate TOC
  index += "## Table of Contents\n\n";

  for (const [dir, items] of Object.entries(byDir)) {
    index += `### ${dir || "."}\n\n`;
    for (const item of items) {
      const basename = path.basename(item.source);
      const docBasename = path.basename(item.doc);
      index += `- [${basename}](./${path.relative(path.dirname(item.doc), item.doc)}) - ${(item.size / 1024).toFixed(1)}KB\n`;
    }
    index += "\n";
  }

  return index;
}
