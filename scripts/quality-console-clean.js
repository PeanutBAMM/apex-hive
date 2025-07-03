// quality-console-clean.js - Remove console.log statements from code
import {
  readFile,
  writeFile,
  batchRead,
  batchWrite,
} from "../modules/file-ops.js";
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

    // Filter valid files
    const validFiles = files.filter((f) => f && !f.includes("node_modules"));
    results.scanned = validFiles.length;

    // Batch read all files
    const { results: fileContents, errors: readErrors } =
      await batchRead(validFiles);

    // Report read errors
    for (const [file, error] of Object.entries(readErrors)) {
      console.error(`[QUALITY-CONSOLE-CLEAN] Error reading ${file}:`, error);
    }

    const filesToWrite = {};

    for (const file of validFiles) {
      if (!fileContents[file]) continue;

      try {
        const content = fileContents[file];
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
          filesToWrite[file] = newLines.join("\n");
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

    // Batch write all modified files
    if (!dryRun && Object.keys(filesToWrite).length > 0) {
      const { errors: writeErrors } = await batchWrite(filesToWrite);

      // Report write errors
      for (const [file, error] of Object.entries(writeErrors)) {
        console.error(`[QUALITY-CONSOLE-CLEAN] Error writing ${file}:`, error);
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
