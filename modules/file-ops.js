// file-ops.js - File operations module

import { promises as fs } from "fs";
import path from "path";
import { fileCache } from "./unified-cache.js";

/**
 * Read file with caching
 */
export async function readFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);

  // Check cache first
  if (!options.noCache) {
    const cached = await fileCache.get(absolutePath);
    if (cached !== null) {
      // Handle both direct content and structured cache data
      if (typeof cached === 'string') {
        return cached;
      } else if (cached.content) {
        return cached.content;
      }
      return cached;
    }
  }

  try {
    const content = await fs.readFile(absolutePath, "utf8");

    // Cache the content
    if (!options.noCache) {
      await fileCache.set(absolutePath, content);
    }

    return content;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Write file and update cache
 */
export async function writeFile(filePath, content) {
  const absolutePath = path.resolve(filePath);

  // Ensure directory exists
  const dir = path.dirname(absolutePath);
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(absolutePath, content, "utf8");

  // Update cache
  await fileCache.set(absolutePath, content);

  return absolutePath;
}

/**
 * List files in directory
 */
export async function listFiles(dirPath, options = {}) {
  const absolutePath = path.resolve(dirPath);

  try {
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });

    let files = entries
      .filter((entry) => options.includeDirectories || entry.isFile())
      .map((entry) => ({
        name: entry.name,
        path: path.join(absolutePath, entry.name),
        isDirectory: entry.isDirectory(),
      }));

    // Apply pattern filter if provided
    if (options.pattern) {
      const regex = new RegExp(options.pattern);
      files = files.filter((file) => regex.test(file.name));
    }

    return files;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    throw error;
  }
}

/**
 * Check if path exists
 */
export async function pathExists(filePath) {
  try {
    await fs.access(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath) {
  const absolutePath = path.resolve(filePath);

  try {
    const stats = await fs.stat(absolutePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.ctime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Path not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Copy file
 */
export async function copyFile(source, destination) {
  const srcPath = path.resolve(source);
  const destPath = path.resolve(destination);

  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  await fs.mkdir(destDir, { recursive: true });

  // Copy file
  await fs.copyFile(srcPath, destPath);

  return destPath;
}

/**
 * Move/rename file
 */
export async function moveFile(source, destination) {
  const srcPath = path.resolve(source);
  const destPath = path.resolve(destination);

  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  await fs.mkdir(destDir, { recursive: true });

  // Move file
  await fs.rename(srcPath, destPath);

  // Clear cache for old path
  await fileCache.delete(srcPath);

  return destPath;
}

/**
 * Delete file
 */
export async function deleteFile(filePath) {
  const absolutePath = path.resolve(filePath);

  await fs.unlink(absolutePath);

  // Clear from cache
  await fileCache.delete(absolutePath);

  return true;
}
