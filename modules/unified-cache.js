// unified-cache.js - Unified file-based cache for persistence across MCP calls

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

export class UnifiedCache {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    // Allow override for testing
    const baseDir =
      process.env.APEX_CACHE_DIR || path.join(os.homedir(), ".apex-cache");
    this.cacheDir = path.join(baseDir, namespace);
    this.ttl = options.ttl || 15 * 60 * 1000; // 15 minutes default
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
    this.encoding = options.encoding || "utf8";
    // Runtime hit tracking - not useful in MCP context where each call creates new process
    // TODO: Consider removing _attempts as we rely on persistent meta.hits instead
    this._attempts = { hits: 0, misses: 0 };
  }

  getCachePath(key) {
    // Create safe filename from key
    const hash = crypto.createHash("md5").update(key).digest("hex");
    return path.join(this.cacheDir, hash + ".cache");
  }

  getMetaPath(key) {
    return this.getCachePath(key) + ".meta";
  }

  async ensureDir() {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async get(key) {
    try {
      const metaPath = this.getMetaPath(key);
      const metaContent = await fs.readFile(metaPath, "utf8");
      const meta = JSON.parse(metaContent);

      // Check if expired
      if (Date.now() > meta.expires) {
        await this.delete(key);
        return null;
      }

      // Read cached value
      const cachePath = this.getCachePath(key);
      const content = await fs.readFile(cachePath, this.encoding);

      // Update access time and track successful hit
      meta.lastAccess = Date.now();
      meta.hits = (meta.hits || 0) + 1;
      meta.attempts = (meta.attempts || 0) + 1;
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

      // this._attempts.hits++; // Deprecated - using meta.hits instead
      return JSON.parse(content);
    } catch (error) {
      // this._attempts.misses++; // Deprecated - calculated from total attempts
      if (error.code === "ENOENT") {
        return null; // Not in cache
      }
      console.error(`[CACHE] Error reading ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, options = {}) {
    try {
      await this.ensureDir();

      const cachePath = this.getCachePath(key);
      const metaPath = this.getMetaPath(key);

      const content = JSON.stringify(value);
      const ttl = options.ttl !== undefined ? options.ttl : this.ttl;

      // Check size limit
      const size = Buffer.byteLength(content, this.encoding);
      if (size > this.maxSize) {
        console.error(`[CACHE] Value too large for ${key}: ${size} bytes`);
        return false;
      }

      // Write metadata
      const meta = {
        key,
        namespace: this.namespace,
        created: Date.now(),
        expires: Date.now() + ttl,
        lastAccess: Date.now(),
        size,
        hits: 0,
        attempts: 0,
      };

      // Write files atomically with unique temp names
      const tempId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempCachePath = `${cachePath}.${tempId}.tmp`;
      const tempMetaPath = `${metaPath}.${tempId}.tmp`;

      await fs.writeFile(tempCachePath, content, this.encoding);
      await fs.writeFile(tempMetaPath, JSON.stringify(meta, null, 2));

      // Rename atomically
      await fs.rename(tempCachePath, cachePath);
      await fs.rename(tempMetaPath, metaPath);

      return true;
    } catch (error) {
      console.error(`[CACHE] Error writing ${key}:`, error.message);
      return false;
    }
  }

  async trackAttempt(key) {
    // Track a cache attempt (miss) by incrementing attempts counter
    try {
      const metaPath = this.getMetaPath(key);
      const metaContent = await fs.readFile(metaPath, "utf8");
      const meta = JSON.parse(metaContent);
      
      // Only track if not expired
      if (Date.now() <= meta.expires) {
        meta.attempts = (meta.attempts || 0) + 1;
        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
      }
    } catch (error) {
      // Key doesn't exist in cache, which is fine for a miss
    }
  }

  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  async delete(key) {
    try {
      const cachePath = this.getCachePath(key);
      const metaPath = this.getMetaPath(key);

      // Check if files exist first
      try {
        await fs.access(cachePath);
        await fs.access(metaPath);
      } catch {
        return false; // Files don't exist
      }

      await fs.unlink(cachePath);
      await fs.unlink(metaPath);

      return true;
    } catch (error) {
      return false;
    }
  }

  async clear() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let cleared = 0;
      let errors = 0;
      let totalSize = 0;

      // Count cache entries (not individual files)
      const cacheEntries = files.filter((f) => f.endsWith(".cache")).length;

      for (const file of files) {
        if (file.endsWith(".cache") || file.endsWith(".meta")) {
          try {
            const filePath = path.join(this.cacheDir, file);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
            await fs.unlink(filePath);
          } catch (e) {
            errors++;
          }
        }
      }

      return { cleared: cacheEntries, errors, totalSize };
    } catch (error) {
      if (error.code === "ENOENT") {
        return { cleared: 0, errors: 0, totalSize: 0 }; // Directory doesn't exist
      }
      throw error;
    }
  }

  async getAllKeys() {
    try {
      await this.ensureDir();
      const files = await fs.readdir(this.cacheDir);
      const keys = [];
      const now = Date.now();

      // Get all valid keys from meta files
      for (const file of files) {
        if (file.endsWith(".meta")) {
          try {
            const metaPath = path.join(this.cacheDir, file);
            const metaContent = await fs.readFile(metaPath, "utf8");
            const meta = JSON.parse(metaContent);

            if (now <= meta.expires) {
              keys.push(meta.key);
            }
          } catch (e) {
            // Skip invalid meta files
          }
        }
      }

      return keys;
    } catch (error) {
      if (error.code === "ENOENT") {
        return []; // Directory doesn't exist
      }
      throw error;
    }
  }

  async size() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let count = 0;
      const now = Date.now();

      // Only count non-expired entries
      for (const file of files) {
        if (file.endsWith(".meta")) {
          try {
            const metaPath = path.join(this.cacheDir, file);
            const metaContent = await fs.readFile(metaPath, "utf8");
            const meta = JSON.parse(metaContent);

            if (now <= meta.expires) {
              count++;
            }
          } catch (e) {
            // Skip invalid meta files
          }
        }
      }

      return count;
    } catch (error) {
      return 0;
    }
  }

  async stats() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      let totalHits = 0;
      let items = 0;
      const expired = [];
      const active = [];

      for (const file of files) {
        if (file.endsWith(".meta")) {
          try {
            const metaPath = path.join(this.cacheDir, file);
            const metaContent = await fs.readFile(metaPath, "utf8");
            const meta = JSON.parse(metaContent);

            if (Date.now() > meta.expires) {
              expired.push(meta.key);
            } else {
              active.push({
                key: meta.key,
                size: meta.size,
                hits: meta.hits || 0,
                attempts: meta.attempts || 0,
                age: Date.now() - meta.created,
                lastAccess: Date.now() - meta.lastAccess,
                created: meta.created,
                expires: meta.expires,
              });
              totalSize += meta.size;
              totalHits += meta.hits || 0;
              items++;
            }
          } catch (e) {
            // Skip invalid meta files
          }
        }
      }

      // Clean up expired items
      for (const key of expired) {
        await this.delete(key);
      }

      // Sort by hits and get newest/oldest
      const sortedByHits = active.sort((a, b) => b.hits - a.hits);
      const sortedByAge = [...active].sort((a, b) => a.created - b.created);

      // Calculate hit rate from persistent meta hits and attempts
      // Each entry tracks both hits (successful cache retrievals) and attempts (all get calls)
      // Hit rate = total hits / total attempts across all entries
      const totalAttempts = active.reduce((sum, entry) => sum + (entry.attempts || 0), 0);
      const hitRate = totalAttempts > 0 ? totalHits / totalAttempts : 0;

      return {
        namespace: this.namespace,
        totalSize,
        entries: sortedByHits.slice(0, 10), // Top 10 by hits
        count: items,
        hitRate: parseFloat(hitRate.toFixed(2)),
        totalAttempts,
        oldestEntry: sortedByAge[0] || null,
        newestEntry: sortedByAge[sortedByAge.length - 1] || null,
        // Legacy properties for backward compatibility
        items,
        totalHits,
        expired: expired.length,
        active: sortedByHits.slice(0, 10),
      };
    } catch (error) {
      return {
        namespace: this.namespace,
        totalSize: 0,
        entries: [],
        count: 0,
        hitRate: 0,
        oldestEntry: null,
        newestEntry: null,
        // Legacy properties
        items: 0,
        totalHits: 0,
        expired: 0,
        active: [],
      };
    }
  }
}

// Export singleton instances for each cache type
export const commandCache = new UnifiedCache("commands", {
  ttl: 6 * 60 * 60 * 1000, // 6 hours
});
export const fileCache = new UnifiedCache("files", { ttl: 6 * 60 * 60 * 1000 }); // 6 hours
export const searchCache = new UnifiedCache("search", { ttl: 6 * 60 * 60 * 1000 }); // 6 hours
export const conversationCache = new UnifiedCache("conversations", {
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxSize: 10 * 1024 * 1024, // 10MB
});

// Helper to format bytes
export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
