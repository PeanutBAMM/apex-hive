// doc-cleanup-prefixes.js - Remove numbered prefixes from documentation files
import { promises as fs } from "fs";
import path from "path";

export async function run(args) {
  const { source = "docs", dryRun = false } = args;

  console.error("[DOC-CLEANUP] Cleaning up numbered prefixes...");

  try {
    const renamedFiles = [];
    
    // Scan all directories in docs
    await scanAndRename(source, renamedFiles, dryRun);

    if (renamedFiles.length === 0) {
      return {
        status: "clean",
        message: "No files with numbered prefixes found",
      };
    }

    return {
      status: dryRun ? "dry-run" : "cleaned",
      renamed: renamedFiles.length,
      files: renamedFiles,
      message: dryRun
        ? `Would rename ${renamedFiles.length} file(s)`
        : `Renamed ${renamedFiles.length} file(s)`,
    };
  } catch (error) {
    console.error("[DOC-CLEANUP] Error:", error.message);
    return {
      status: "error",
      message: "Failed to cleanup prefixes",
      error: error.message,
    };
  }
}

async function scanAndRename(dir, renamedFiles, dryRun) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        // Check if directory has numbered prefix
        const cleanDirName = entry.name.replace(/^\d{2}-/, '');
        if (cleanDirName !== entry.name) {
          const newPath = path.join(path.dirname(fullPath), cleanDirName);
          
          if (!dryRun) {
            try {
              await fs.rename(fullPath, newPath);
              console.error(`[DOC-CLEANUP] Renamed directory: ${entry.name} → ${cleanDirName}`);
              renamedFiles.push({
                type: "directory",
                from: entry.name,
                to: cleanDirName,
                path: dir,
              });
            } catch (error) {
              console.error(`[DOC-CLEANUP] Failed to rename directory ${entry.name}:`, error.message);
            }
          } else {
            renamedFiles.push({
              type: "directory",
              from: entry.name,
              to: cleanDirName,
              path: dir,
            });
          }
          
          // Continue scanning with new directory name
          await scanAndRename(dryRun ? fullPath : newPath, renamedFiles, dryRun);
        } else {
          // Scan subdirectory
          await scanAndRename(fullPath, renamedFiles, dryRun);
        }
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        // Check for multiple prefix patterns:
        // - "99-misc-api-logger.md" → "api-logger.md"
        // - "03-reference-cache-test.md" → "cache-test.md"
        // - "restructuring-README.md" → "README.md"
        let cleanFileName = entry.name;
        
        // Remove numbered category prefixes (e.g., "99-misc-", "03-reference-")
        cleanFileName = cleanFileName.replace(/^\d{2}-[^-]+-/, '');
        
        // Remove restructuring prefix
        cleanFileName = cleanFileName.replace(/^restructuring-/, '');
        
        if (cleanFileName !== entry.name) {
          const newPath = path.join(dir, cleanFileName);
          
          if (!dryRun) {
            try {
              await fs.rename(fullPath, newPath);
              console.error(`[DOC-CLEANUP] Renamed file: ${entry.name} → ${cleanFileName}`);
              renamedFiles.push({
                type: "file",
                from: entry.name,
                to: cleanFileName,
                path: dir,
              });
            } catch (error) {
              console.error(`[DOC-CLEANUP] Failed to rename file ${entry.name}:`, error.message);
            }
          } else {
            renamedFiles.push({
              type: "file",
              from: entry.name,
              to: cleanFileName,
              path: dir,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`[DOC-CLEANUP] Failed to scan ${dir}:`, error.message);
  }
}