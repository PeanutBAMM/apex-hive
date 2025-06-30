// quality-format.js - Format code using prettier or similar
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function run(args = {}) {
  const {
    pattern = "**/*.js",
    write = true,
    check = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[QUALITY-FORMAT] Formatting code...");

  try {
    // Check if prettier is available
    let formatter = null;
    try {
      execSync("npx prettier --version", { stdio: "ignore" });
      formatter = "prettier";
    } catch {
      // Prettier not available, try standard
      try {
        execSync("npx standard --version", { stdio: "ignore" });
        formatter = "standard";
      } catch {
        // No formatter available
      }
    }

    if (!formatter) {
      return {
        success: false,
        error: "No formatter available",
        message: "Install prettier or standard to format code",
      };
    }

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        formatter,
        wouldFormat: pattern,
        message: `Would format files with ${formatter}`,
      };
    }

    let command = "";
    let output = "";

    if (formatter === "prettier") {
      // Build prettier command
      const args = [];

      if (check) {
        args.push("--check");
      } else if (write) {
        args.push("--write");
      } else {
        args.push("--list-different");
      }

      args.push(pattern);

      command = `npx prettier ${args.join(" ")}`;
    } else {
      // Standard formatter
      command = check ? "npx standard" : "npx standard --fix";
    }

    // Run formatter
    try {
      output = execSync(command, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (error) {
      if (check && error.status === 1) {
        // Files need formatting
        output = error.stdout || "";
      } else if (!check && formatter === "standard" && error.status === 1) {
        // Standard fixed some issues
        output = error.stdout || "";
      } else {
        throw error;
      }
    }

    // Parse results
    let filesFormatted = 0;
    let filesChecked = 0;
    const files = [];

    if (formatter === "prettier") {
      if (check || !write) {
        // Count files that need formatting
        const needFormatting = output
          .trim()
          .split("\n")
          .filter((f) => f);
        filesChecked = needFormatting.length;
        files.push(...needFormatting);
      } else {
        // Count formatted files by checking git status
        try {
          const gitStatus = execSync("git status --porcelain", {
            encoding: "utf8",
          });
          const modifiedFiles = gitStatus
            .split("\n")
            .filter((line) => line.startsWith(" M "))
            .map((line) => line.substring(3))
            .filter((file) => file.endsWith(".js"));

          filesFormatted = modifiedFiles.length;
          files.push(...modifiedFiles);
        } catch {
          // Can't determine, but command succeeded
          filesFormatted = 1; // At least some files
        }
      }
    } else {
      // Standard output parsing
      if (output.includes("fixed")) {
        const match = output.match(/(\d+) errors? fixed/);
        filesFormatted = match ? parseInt(match[1]) : 0;
      }
    }

    const needsFormatting = check && filesChecked > 0;

    return {
      success: true,
      data: {
        formatter,
        formatted: filesFormatted,
        checked: filesChecked,
        needsFormatting,
        files: files.slice(0, 10), // Limit to first 10
      },
      message: check
        ? needsFormatting
          ? `${filesChecked} files need formatting`
          : "All files are properly formatted"
        : filesFormatted > 0
          ? `Formatted ${filesFormatted} files`
          : "No files needed formatting",
    };
  } catch (error) {
    console.error("[QUALITY-FORMAT] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to format code",
    };
  }
}
