// quality-console-clean.js - Remove console.log statements from code
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

export async function run(args = {}) {
  const {
    pattern = "**/*.js",
    exclude = ["node_modules", "test", "tests", ".test.js"],
    dryRun = false,
    modules = {},
  } = args;

  console.error("[QUALITY-CONSOLE-CLEAN] Cleaning console.log statements...");

  try {
    // Find all JavaScript files
    const files = execSync(
      `find . -name "*.js" -type f -not -path "./node_modules/*" -not -path "./test/*" -not -path "./tests/*" | grep -v ".test.js"`,
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n")
      .filter((f) => f);

    const results = {
      scanned: 0,
      removed: 0,
      files: [],
    };

    for (const file of files) {
      if (!file || file.includes("node_modules")) continue;

      results.scanned++;

      try {
        const content = await fs.readFile(file, "utf8");
        const lines = content.split("\n");
        let modified = false;
        let removedInFile = 0;

        const newLines = lines.map((line, index) => {
          // Skip if it's a comment
          if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
            return line;
          }

          // Check for console.log statements
          const consoleLogPattern = /console\s*\.\s*log\s*\([^)]*\)\s*;?/g;
          if (consoleLogPattern.test(line)) {
            // Special cases to keep
            if (
              line.includes("console.log = console.error") || // Stdout redirect
              line.includes("// console.log") || // Already commented
              file.includes("test") || // Test files
              file.includes("debug") // Debug files
            ) {
              return line;
            }

            if (dryRun) {
              results.files.push({
                file,
                line: index + 1,
                content: line.trim(),
              });
              removedInFile++;
              return line; // Don't actually remove in dry run
            }

            // Comment out instead of removing
            modified = true;
            removedInFile++;
            return line.replace(consoleLogPattern, "// $&");
          }

          return line;
        });

        if (modified && !dryRun) {
          await fs.writeFile(file, newLines.join("\n"));
          results.removed += removedInFile;
          results.files.push({
            file,
            removed: removedInFile,
          });
        } else if (removedInFile > 0 && dryRun) {
          results.removed += removedInFile;
        }
      } catch (error) {
        console.error(
          `[QUALITY-CONSOLE-CLEAN] Error processing ${file}:`,
          error.message,
        );
      }
    }

    return {
      success: true,
      dryRun,
      data: results,
      message: dryRun
        ? `Would remove ${results.removed} console.log statements from ${results.files.length} files`
        : `Removed ${results.removed} console.log statements from ${results.files.length} files`,
    };
  } catch (error) {
    console.error("[QUALITY-CONSOLE-CLEAN] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to clean console.log statements",
    };
  }
}
