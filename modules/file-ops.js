// file-ops.js - File operations module

import { promises as fs } from "fs";
import path from "path";
import { fileCache } from "./unified-cache.js";
import { cachedSearch } from "./cached-search.js";

// File locking mechanism
const activeLocks = new Map();
const MAX_WAIT_TIME = 5000; // 5 seconds

/**
 * Acquire a lock for a file path
 */
async function acquireLock(filePath) {
  const startTime = Date.now();

  while (activeLocks.has(filePath)) {
    if (Date.now() - startTime > MAX_WAIT_TIME) {
      throw new Error(`Lock timeout for ${filePath}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  activeLocks.set(filePath, Date.now());
}

/**
 * Release a lock for a file path
 */
function releaseLock(filePath) {
  activeLocks.delete(filePath);
}

/**
 * Read file with caching
 */
export async function readFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);

  // Check cache first
  if (!options.noCache) {
    let cached = null;
    try {
      cached = await fileCache.get(absolutePath);
    } catch (cacheError) {
      // If cache fails, continue without cache
      console.error(
        `[FILE-OPS] Cache get failed for ${filePath}:`,
        cacheError.message,
      );
    }
    if (cached !== null) {
      // Check if file was modified since cache
      try {
        const stats = await fs.stat(absolutePath);
        const cacheTime = cached.timestamp || 0;

        // If file is newer than cache, invalidate
        if (stats.mtime.getTime() > cacheTime) {
          try {
            await fileCache.delete(absolutePath);
          } catch (deleteError) {
            // If delete fails, just continue
            console.error(
              `[FILE-OPS] Cache delete failed for ${filePath}:`,
              deleteError.message,
            );
          }
        } else {
          // Handle both direct content and structured cache data
          let content;
          if (typeof cached === "string") {
            content = cached;
          } else if (cached.content) {
            content = cached.content;
          } else {
            content = cached;
          }
          return { content, cached: true };
        }
      } catch (statError) {
        // If we can't stat the file, assume cache is valid
        let content;
        if (typeof cached === "string") {
          content = cached;
        } else if (cached.content) {
          content = cached.content;
        } else {
          content = cached;
        }
        return { content, cached: true };
      }
    }
  }

  try {
    const content = await fs.readFile(absolutePath, "utf8");

    // Cache the content with timestamp
    if (!options.noCache) {
      try {
        const stats = await fs.stat(absolutePath);
        await fileCache.set(absolutePath, {
          content,
          timestamp: stats.mtime.getTime(),
        });
      } catch (cacheError) {
        // If cache fails, just log and continue
        console.error(
          `[FILE-OPS] Cache set failed for ${filePath}:`,
          cacheError.message,
        );
      }
    }

    return { content, cached: false };
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

  // Acquire lock before writing
  await acquireLock(absolutePath);

  try {
    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(absolutePath, content, "utf8");

    // Update cache with timestamp
    try {
      const stats = await fs.stat(absolutePath);
      await fileCache.set(absolutePath, {
        content,
        timestamp: stats.mtime.getTime(),
      });
    } catch (cacheError) {
      // If cache fails, just log and continue
      console.error(
        `[FILE-OPS] Cache set failed for ${filePath}:`,
        cacheError.message,
      );
    }

    return absolutePath;
  } finally {
    // Always release lock
    releaseLock(absolutePath);
  }
}

/**
 * List files in directory
 */
export async function listFiles(dirPath, options = {}) {
  const absolutePath = path.resolve(dirPath);

  try {
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });

    // If withFileTypes option is true, convert to serializable format
    if (options.withFileTypes) {
      return entries.map((entry) => ({
        name: entry.name,
        path: entry.path || entry.parentPath,
        isFile: () => entry.isFile(),
        isDirectory: () => entry.isDirectory(),
        // Store the actual values for MCP serialization
        _isFile: entry.isFile(),
        _isDirectory: entry.isDirectory(),
      }));
    }

    let files = entries
      .filter((entry) => options.includeDirectories || entry.isFile())
      .map((entry) => ({
        name: entry.name,
        path: path.join(absolutePath, entry.name),
        isFile: () => entry.isFile(),
        isDirectory: () => entry.isDirectory(),
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

/**
 * Batch read multiple files with caching
 * @param {string[]} filePaths - Array of file paths to read
 * @param {Object} options - Read options
 * @returns {Object} Object with results and errors
 */
export async function batchRead(filePaths, options = {}) {
  const results = {};
  const errors = {};
  let cacheHits = 0;
  let diskReads = 0;

  // Process files in parallel for better performance
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const result = await readFile(filePath, options);
        results[filePath] = result.content;
        if (result.cached) {
          cacheHits++;
        } else {
          diskReads++;
        }
      } catch (error) {
        errors[filePath] = error.message;
      }
    }),
  );

  return { results, errors, stats: { cacheHits, diskReads } };
}

/**
 * Batch write multiple files with caching
 * @param {Object} fileMap - Object mapping file paths to content
 * @param {Object} options - Write options
 * @returns {Object} Object with successful writes and errors
 */
export async function batchWrite(fileMap, options = {}) {
  const results = [];
  const errors = {};

  // Process files sequentially to avoid lock contention
  for (const [filePath, content] of Object.entries(fileMap)) {
    try {
      await writeFile(filePath, content);
      results.push(filePath);
    } catch (error) {
      errors[filePath] = error.message;
    }
  }

  return { results, errors };
}

/**
 * Chunk array into smaller arrays
 * @private
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Batch read with memory protection for large file sets
 * @param {string[]} filePaths - Array of file paths to read
 * @param {Object} options - Read options including chunkSize
 * @returns {Object} Object with results and errors
 */
export async function batchReadSafe(filePaths, options = {}) {
  const { chunkSize = 50, ...readOptions } = options;

  if (filePaths.length <= chunkSize) {
    return batchRead(filePaths, readOptions);
  }

  // Process in chunks to avoid memory issues
  const chunks = chunkArray(filePaths, chunkSize);
  const allResults = {};
  const allErrors = {};

  for (const chunk of chunks) {
    const { results, errors } = await batchRead(chunk, readOptions);
    Object.assign(allResults, results);
    Object.assign(allErrors, errors);
  }

  return { results: allResults, errors: allErrors };
}

/**
 * Cache-first grep search (content search)
 * Searches in cached files first, then falls back to disk
 */
export async function cachedGrep(pattern, options = {}) {
  const {
    paths = ['.'],
    ignoreCase = true,
    maxMatches = 20,
    maxDiskResults = 500,
    includeLineNumbers = true
  } = options;
  
  // Use cachedSearch with content search enabled
  const results = await cachedSearch(pattern, {
    ...options,
    contentSearch: true,
    paths,
    maxDiskResults
  });
  
  return {
    matches: results.results,
    stats: {
      ...results.stats,
      pattern,
      type: 'content'
    }
  };
}

/**
 * Cache-first find search (filename search)
 * Searches filenames in cache first, then falls back to disk
 */
export async function cachedFind(pattern, options = {}) {
  const {
    paths = ['.'],
    ignoreCase = true
  } = options;
  
  // Use cachedSearch with content search disabled
  const results = await cachedSearch(pattern, {
    ...options,
    contentSearch: false,
    paths
  });
  
  return {
    files: results.results.map(r => r.file),
    stats: {
      ...results.stats,
      pattern,
      type: 'filename'
    }
  };
}
