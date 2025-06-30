// cache.js - Simple LRU cache for Apex Hive

import { LRUCache } from "lru-cache";

export class Cache {
  constructor(options = {}) {
    this.cache = new LRUCache({
      max: options.max || 500,
      ttl: options.ttl || 1000 * 60 * 15, // 15 minutes default
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    return this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    return this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return [...this.cache.keys()];
  }
}

// Shared cache instances
export const commandCache = new Cache({ max: 100, ttl: 1000 * 60 * 5 }); // 5 min
export const fileCache = new Cache({ max: 200, ttl: 1000 * 60 * 10 }); // 10 min
export const searchCache = new Cache({ max: 50, ttl: 1000 * 60 * 30 }); // 30 min
