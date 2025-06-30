// unified-cache.js - Unified file-based cache for persistence across MCP calls

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export class UnifiedCache {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.cacheDir = path.join(os.homedir(), '.apex-cache', namespace);
    this.ttl = options.ttl || 15 * 60 * 1000; // 15 minutes default
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
    this.encoding = options.encoding || 'utf8';
  }

  getCachePath(key) {
    // Create safe filename from key
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.cacheDir, hash + '.cache');
  }

  getMetaPath(key) {
    return this.getCachePath(key) + '.meta';
  }

  async ensureDir() {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async get(key) {
    try {
      const metaPath = this.getMetaPath(key);
      const metaContent = await fs.readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaContent);

      // Check if expired
      if (Date.now() > meta.expires) {
        await this.delete(key);
        return null;
      }

      // Read cached value
      const cachePath = this.getCachePath(key);
      const content = await fs.readFile(cachePath, this.encoding);

      // Update access time
      meta.lastAccess = Date.now();
      meta.hits = (meta.hits || 0) + 1;
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
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
      const ttl = options.ttl || this.ttl;
      
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
        hits: 0
      };

      // Write files atomically
      await fs.writeFile(cachePath + '.tmp', content, this.encoding);
      await fs.writeFile(metaPath + '.tmp', JSON.stringify(meta, null, 2));
      
      // Rename atomically
      await fs.rename(cachePath + '.tmp', cachePath);
      await fs.rename(metaPath + '.tmp', metaPath);

      return true;
    } catch (error) {
      console.error(`[CACHE] Error writing ${key}:`, error.message);
      return false;
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
      
      await fs.unlink(cachePath).catch(() => {});
      await fs.unlink(metaPath).catch(() => {});
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let cleared = 0;
      
      for (const file of files) {
        if (file.endsWith('.cache') || file.endsWith('.meta')) {
          await fs.unlink(path.join(this.cacheDir, file));
          cleared++;
        }
      }
      
      return cleared;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return 0; // Directory doesn't exist
      }
      throw error;
    }
  }

  async size() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let count = 0;
      
      for (const file of files) {
        if (file.endsWith('.cache')) {
          count++;
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
        if (file.endsWith('.meta')) {
          try {
            const metaPath = path.join(this.cacheDir, file);
            const metaContent = await fs.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaContent);
            
            if (Date.now() > meta.expires) {
              expired.push(meta.key);
            } else {
              active.push({
                key: meta.key,
                size: meta.size,
                hits: meta.hits || 0,
                age: Date.now() - meta.created,
                lastAccess: Date.now() - meta.lastAccess
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

      return {
        namespace: this.namespace,
        items,
        totalSize,
        totalHits,
        hitRate: items > 0 ? (totalHits / items).toFixed(2) : 0,
        expired: expired.length,
        active: active.sort((a, b) => b.hits - a.hits).slice(0, 10) // Top 10 by hits
      };
    } catch (error) {
      return {
        namespace: this.namespace,
        items: 0,
        totalSize: 0,
        totalHits: 0,
        hitRate: 0,
        expired: 0,
        active: []
      };
    }
  }
}

// Export singleton instances for each cache type
export const commandCache = new UnifiedCache('commands', { ttl: 5 * 60 * 1000 });
export const fileCache = new UnifiedCache('files', { ttl: 10 * 60 * 1000 });
export const searchCache = new UnifiedCache('search', { ttl: 30 * 60 * 1000 });

// Helper to format bytes
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}