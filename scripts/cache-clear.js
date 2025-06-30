// cache-clear.js - Clear the apex cache
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export async function run(args = {}) {
  const {
    all = false,
    patterns = false,
    sessions = false,
    temp = false,
    force = false,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[CACHE-CLEAR] Clearing cache...");

  try {
    const cleared = {
      files: [],
      patterns: [],
      sessions: [],
      temp: [],
      size: 0,
    };

    // Define cache locations
    const cacheBase = path.join(os.homedir(), ".apex-cache");
    const cacheLocations = {
      files: path.join(cacheBase, "files"),
      patterns: path.join(cacheBase, "patterns"),
      sessions: path.join(cacheBase, "sessions"),
      temp: path.join(os.tmpdir(), "apex-temp"),
    };

    // Clear file cache
    if (all || (!patterns && !sessions && !temp)) {
      console.error("[CACHE-CLEAR] Clearing file cache...");
      const result = await clearDirectory(cacheLocations.files, {
        force,
        dryRun,
      });
      cleared.files = result.files;
      cleared.size += result.size;
    }

    // Clear pattern cache
    if (all || patterns) {
      console.error("[CACHE-CLEAR] Clearing pattern cache...");
      const result = await clearDirectory(cacheLocations.patterns, {
        force,
        dryRun,
      });
      cleared.patterns = result.files;
      cleared.size += result.size;
    }

    // Clear session cache
    if (all || sessions) {
      console.error("[CACHE-CLEAR] Clearing session cache...");
      const result = await clearDirectory(cacheLocations.sessions, {
        force,
        dryRun,
      });
      cleared.sessions = result.files;
      cleared.size += result.size;
    }

    // Clear temp files
    if (all || temp) {
      console.error("[CACHE-CLEAR] Clearing temp files...");
      const result = await clearDirectory(cacheLocations.temp, {
        force,
        dryRun,
      });
      cleared.temp = result.files;
      cleared.size += result.size;
    }

    // Calculate totals
    const totalFiles =
      cleared.files.length +
      cleared.patterns.length +
      cleared.sessions.length +
      cleared.temp.length;

    return {
      success: true,
      dryRun,
      data: {
        cleared: {
          files: cleared.files.length,
          patterns: cleared.patterns.length,
          sessions: cleared.sessions.length,
          temp: cleared.temp.length,
          total: totalFiles,
        },
        size: formatSize(cleared.size),
        locations: Object.keys(cacheLocations)
          .filter((key) => cleared[key].length > 0)
          .map((key) => cacheLocations[key]),
      },
      message: dryRun
        ? `Would clear ${totalFiles} cache entries (${formatSize(cleared.size)})`
        : `Cleared ${totalFiles} cache entries (${formatSize(cleared.size)})`,
    };
  } catch (error) {
    console.error("[CACHE-CLEAR] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to clear cache",
    };
  }
}

async function clearDirectory(dirPath, options = {}) {
  const result = {
    files: [],
    size: 0,
  };

  try {
    // Check if directory exists
    await fs.access(dirPath);
  } catch {
    // Directory doesn't exist
    return result;
  }

  try {
    // Get all files in directory
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively clear subdirectory
        const subResult = await clearDirectory(fullPath, options);
        result.files.push(...subResult.files);
        result.size += subResult.size;

        // Remove empty directory
        if (!options.dryRun) {
          try {
            await fs.rmdir(fullPath);
          } catch {
            // Directory not empty or other error
          }
        }
      } else {
        // Get file size
        try {
          const stats = await fs.stat(fullPath);
          result.size += stats.size;
          result.files.push(fullPath);

          // Delete file
          if (!options.dryRun) {
            await fs.unlink(fullPath);
          }
        } catch (error) {
          if (!options.force) {
            throw error;
          }
          // Continue on error if force is true
        }
      }
    }

    // Try to remove the directory itself (if empty)
    if (!options.dryRun && result.files.length > 0) {
      try {
        await fs.rmdir(dirPath);
      } catch {
        // Directory not empty or is a root cache dir
      }
    }
  } catch (error) {
    if (!options.force) {
      throw error;
    }
    // Continue on error if force is true
  }

  return result;
}

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
