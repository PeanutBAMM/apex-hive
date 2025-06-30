// doc-generate.js - Generate documentation for project files
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

export async function run(args) {
  const {
    target = "all",
    format = "markdown",
    output = "docs",
    dryRun = false,
    modules,
  } = args;

  console.error("[DOC-GENERATE] Generating documentation...");

  // Handle dry run mode
  if (dryRun) {
    const wouldGenerate = [];
    switch (target) {
      case "all":
        wouldGenerate.push(
          "API documentation",
          "Script documentation",
          "README.md",
        );
        break;
      case "api":
        wouldGenerate.push("API documentation");
        break;
      case "scripts":
        wouldGenerate.push("Script documentation");
        break;
      case "readme":
        wouldGenerate.push("README.md");
        break;
      default:
        wouldGenerate.push(`Documentation for ${target}`);
    }

    return {
      success: true,
      dryRun: true,
      wouldGenerate,
      message: `Would generate ${wouldGenerate.length} documentation file(s)`,
    };
  }

  try {
    const generatedDocs = [];

    // Determine what to generate
    switch (target) {
      case "all":
        generatedDocs.push(...(await generateAPIDocs(output, modules)));
        generatedDocs.push(...(await generateScriptDocs(output, modules)));
        generatedDocs.push(await generateReadme(modules));
        break;

      case "api":
        generatedDocs.push(...(await generateAPIDocs(output, modules)));
        break;

      case "scripts":
        generatedDocs.push(...(await generateScriptDocs(output, modules)));
        break;

      case "readme":
        generatedDocs.push(await generateReadme(modules));
        break;

      default:
        // Generate for specific file/directory
        generatedDocs.push(...(await generateForPath(target, output, modules)));
    }

    // Generate index if multiple docs
    if (generatedDocs.length > 1) {
      const indexPath = await generateIndex(generatedDocs, output);
      generatedDocs.push(indexPath);
    }

    return {
      status: "generated",
      target,
      format,
      files: generatedDocs,
      count: generatedDocs.length,
      message: `Generated ${generatedDocs.length} documentation file(s)`,
    };
  } catch (error) {
    console.error("[DOC-GENERATE] Error:", error.message);
    return {
      status: "error",
      message: "Failed to generate documentation",
      error: error.message,
    };
  }
}

async function generateAPIDocs(outputDir, modules) {
  console.error("[DOC-GENERATE] Generating API documentation...");

  const docs = [];
  const apiDir = path.join(outputDir, "api");
  await fs.mkdir(apiDir, { recursive: true });

  // Generate docs for modules
  const moduleFiles = await fs.readdir("./modules");
  for (const file of moduleFiles) {
    if (file.endsWith(".js")) {
      const docPath = path.join(apiDir, file.replace(".js", ".md"));
      const content = await generateModuleDoc(`./modules/${file}`);
      await fs.writeFile(docPath, content);
      docs.push(docPath);
    }
  }

  return docs;
}

async function generateScriptDocs(outputDir, modules) {
  console.error("[DOC-GENERATE] Generating script documentation...");

  const docs = [];
  const scriptsDir = path.join(outputDir, "scripts");
  await fs.mkdir(scriptsDir, { recursive: true });

  // Get all scripts from registry
  const registry = (await import("../config/registry.js")).default;

  // Group scripts by category
  const categories = {};
  for (const [command, scriptPath] of Object.entries(registry)) {
    if (!scriptPath) continue;

    const category = command.split(":")[0];
    if (!categories[category]) categories[category] = [];
    categories[category].push({ command, scriptPath });
  }

  // Generate category docs
  for (const [category, scripts] of Object.entries(categories)) {
    const docPath = path.join(scriptsDir, `${category}-scripts.md`);
    const content = await generateCategoryDoc(category, scripts);
    await fs.writeFile(docPath, content);
    docs.push(docPath);
  }

  return docs;
}

async function generateModuleDoc(modulePath) {
  const moduleName = path.basename(modulePath, ".js");
  const source = await fs.readFile(modulePath, "utf8");

  let doc = `# ${moduleName} Module\n\n`;

  // Extract class/function documentation
  const classMatch = source.match(/export\s+default\s+class\s+(\w+)/);
  if (classMatch) {
    doc += `## Class: ${classMatch[1]}\n\n`;

    // Extract methods
    const methodRegex = /^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*{/gm;
    let match;
    const methods = [];

    while ((match = methodRegex.exec(source)) !== null) {
      const methodName = match[2];
      if (methodName !== "constructor") {
        methods.push(methodName);
      }
    }

    if (methods.length > 0) {
      doc += "### Methods\n\n";
      for (const method of methods) {
        doc += `- \`${method}()\`\n`;
      }
      doc += "\n";
    }
  }

  // Extract exports
  const exportMatches = source.matchAll(
    /export\s+(async\s+)?function\s+(\w+)/g,
  );
  const exports = Array.from(exportMatches).map((m) => m[2]);

  if (exports.length > 0) {
    doc += "### Exported Functions\n\n";
    for (const exp of exports) {
      doc += `- \`${exp}()\`\n`;
    }
  }

  return doc;
}

async function generateCategoryDoc(category, scripts) {
  let doc = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Scripts\n\n`;
  doc += `This category contains ${scripts.length} scripts.\n\n`;

  doc += "## Available Commands\n\n";
  doc += "| Command | Description | Script |\n";
  doc += "|---------|-------------|--------|\n";

  for (const { command, scriptPath } of scripts) {
    const description = await getScriptDescription(scriptPath);
    const scriptName = path.basename(scriptPath);
    doc += `| \`${command}\` | ${description} | ${scriptName} |\n`;
  }

  doc += "\n## Usage Examples\n\n";

  // Add examples for main commands
  const mainCommands = scripts.slice(0, 3);
  for (const { command } of mainCommands) {
    doc += `### ${command}\n\n`;
    doc += "```bash\n";
    doc += `apex ${command}\n`;
    doc += "```\n\n";
  }

  return doc;
}

async function getScriptDescription(scriptPath) {
  try {
    const fullPath = path.join(process.cwd(), scriptPath);
    const source = await fs.readFile(fullPath, "utf8");

    // Look for description in comments
    const descMatch = source.match(/\/\/\s*(.+?)\s*-\s*(.+)/);
    if (descMatch) {
      return descMatch[2];
    }

    // Extract from function
    const fnMatch = source.match(
      /export\s+async\s+function\s+run.*?{[\s\S]*?console\.error\(['"`]\[.+?\]\s+(.+?)['"`]\)/,
    );
    if (fnMatch) {
      return fnMatch[1];
    }

    return "Script documentation";
  } catch {
    return "Documentation pending";
  }
}

async function generateReadme(modules) {
  console.error("[DOC-GENERATE] Generating README...");

  const readme = `# Apex Hive

Smart command system with natural language support.

## Installation

\`\`\`bash
npm install @apex-hive/core
apex init
\`\`\`

## Quick Start

\`\`\`bash
# Search for code
apex search "function authenticate"

# Check CI status
apex ci:monitor

# Run tests
apex test

# Get help
apex help
\`\`\`

## Features

- 🚀 60 built-in scripts for common tasks
- 🌍 Natural language support (English & Dutch)
- 🔍 Fast search with ripgrep integration
- 🤖 CI/CD automation with self-healing
- 📚 Smart documentation generation
- 🔧 Extensible recipe system

## Available Commands

### CI Commands
- \`ci:monitor\` - Monitor CI status
- \`ci:parse\` - Parse CI logs
- \`ci:fix\` - Fix CI issues
- \`ci:heal\` - Self-healing CI
- \`ci:watch\` - Watch CI progress
- \`ci:smart-push\` - Smart push with monitoring

### Documentation Commands
- \`doc:generate\` - Generate documentation
- \`doc:update\` - Update existing docs
- \`doc:validate\` - Validate documentation
- \`doc:sync\` - Sync documentation

### Core Commands
- \`search\` - Search codebase
- \`test\` - Run tests
- \`init\` - Initialize project
- \`help\` - Show help

## Configuration

Configuration is stored in \`.apex-hive/config.json\`.

## License

MIT

---
*Generated by Apex Hive on ${new Date().toISOString()}*
`;

  await fs.writeFile("README.md", readme);
  return "README.md";
}

async function generateForPath(targetPath, outputDir, modules) {
  const docs = [];

  try {
    const stat = await fs.stat(targetPath);

    if (stat.isDirectory()) {
      // Generate docs for all files in directory
      const files = await fs.readdir(targetPath);
      for (const file of files) {
        if (file.endsWith(".js")) {
          const docPath = path.join(outputDir, file.replace(".js", ".md"));
          const content = await generateModuleDoc(path.join(targetPath, file));
          await fs.writeFile(docPath, content);
          docs.push(docPath);
        }
      }
    } else if (targetPath.endsWith(".js")) {
      // Generate doc for single file
      const docPath = path.join(
        outputDir,
        path.basename(targetPath).replace(".js", ".md"),
      );
      const content = await generateModuleDoc(targetPath);
      await fs.writeFile(docPath, content);
      docs.push(docPath);
    }
  } catch (error) {
    console.error(
      `[DOC-GENERATE] Failed to generate docs for ${targetPath}:`,
      error.message,
    );
  }

  return docs;
}

async function generateIndex(docs, outputDir) {
  const indexPath = path.join(outputDir, "index.md");

  let content = "# Documentation Index\n\n";
  content += `Generated on ${new Date().toISOString()}\n\n`;
  content += "## Contents\n\n";

  // Group by directory
  const grouped = {};
  for (const doc of docs) {
    const dir = path.dirname(doc);
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(doc);
  }

  for (const [dir, files] of Object.entries(grouped)) {
    content += `### ${path.basename(dir)}\n\n`;
    for (const file of files) {
      const name = path.basename(file, ".md");
      const relPath = path.relative(outputDir, file);
      content += `- [${name}](./${relPath})\n`;
    }
    content += "\n";
  }

  await fs.writeFile(indexPath, content);
  return indexPath;
}
