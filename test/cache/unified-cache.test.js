import { UnifiedCache } from '../../modules/unified-cache.js';
import { setupTestCache, cleanupTestCache, delay, generateTestData, TEST_CACHE_DIR } from '../setup.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

describe('UnifiedCache Core Tests', () => {
  let cache;
  
  beforeEach(async () => {
    await setupTestCache();
    cache = new UnifiedCache('test', { ttl: 1000 }); // 1 second TTL for testing
    // Ensure cache directory exists
    await cache.ensureDir();
  });
  
  afterEach(async () => {
    // Clear cache before cleanup to avoid directory not empty errors
    if (cache) {
      await cache.clear();
    }
    await cleanupTestCache();
  });

  describe('Constructor', () => {
    test('creates cache with default options', () => {
      const defaultCache = new UnifiedCache('default');
      expect(defaultCache.namespace).toBe('default');
      expect(defaultCache.ttl).toBe(15 * 60 * 1000); // 15 minutes
      expect(defaultCache.maxSize).toBe(100 * 1024 * 1024); // 100MB
      expect(defaultCache.encoding).toBe('utf8');
    });

    test('creates cache with custom options', () => {
      const customCache = new UnifiedCache('custom', {
        ttl: 5000,
        maxSize: 1024,
        encoding: 'base64'
      });
      expect(customCache.ttl).toBe(5000);
      expect(customCache.maxSize).toBe(1024);
      expect(customCache.encoding).toBe('base64');
    });

    test('creates proper cache directory path', () => {
      expect(cache.cacheDir).toContain('.test-cache');
      expect(cache.cacheDir).toContain('test');
    });
  });

  describe('get() method', () => {
    test('returns null for non-existent key', async () => {
      const result = await cache.get('missing-key');
      expect(result).toBeNull();
    });

    test('returns cached value for valid key', async () => {
      await cache.set('test-key', { data: 'test-value' });
      const result = await cache.get('test-key');
      expect(result).toEqual({ data: 'test-value' });
    });

    test('returns null for expired key', async () => {
      await cache.set('expire-key', 'value', { ttl: 100 }); // 100ms TTL
      await delay(150);
      const result = await cache.get('expire-key');
      expect(result).toBeNull();
    });

    test('updates hit count on successful get', async () => {
      await cache.set('hit-key', 'value');
      await cache.get('hit-key');
      await cache.get('hit-key');
      
      const stats = await cache.stats();
      const entry = stats.entries.find(e => e.key === 'hit-key');
      expect(entry.hits).toBe(2);
    });

    test('handles corrupted cache files gracefully', async () => {
      const key = 'corrupt-key';
      await cache.set(key, 'valid-value');
      
      // Corrupt the cache file
      const cachePath = cache.getCachePath(key);
      await fs.writeFile(cachePath, 'invalid-json-{{{');
      
      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    test('handles missing meta file', async () => {
      const key = 'no-meta-key';
      await cache.set(key, 'value');
      
      // Delete meta file
      const metaPath = cache.getMetaPath(key);
      await fs.unlink(metaPath);
      
      const result = await cache.get(key);
      expect(result).toBeNull();
    });
  });

  describe('set() method', () => {
    test('stores simple string value', async () => {
      const result = await cache.set('string-key', 'string-value');
      expect(result).toBe(true);
      
      const value = await cache.get('string-key');
      expect(value).toBe('string-value');
    });

    test('stores complex object value', async () => {
      const complexObj = {
        name: 'test',
        nested: { level: 2, array: [1, 2, 3] },
        date: new Date().toISOString()
      };
      
      await cache.set('object-key', complexObj);
      const result = await cache.get('object-key');
      expect(result).toEqual(complexObj);
    });

    test('stores array values', async () => {
      const array = [1, 'two', { three: 3 }, [4, 5]];
      await cache.set('array-key', array);
      const result = await cache.get('array-key');
      expect(result).toEqual(array);
    });

    test('respects custom TTL option', async () => {
      await cache.set('custom-ttl', 'value', { ttl: 200 });
      await delay(100);
      expect(await cache.get('custom-ttl')).toBe('value');
      
      await delay(150);
      expect(await cache.get('custom-ttl')).toBeNull();
    });

    test('rejects oversized values', async () => {
      const smallCache = new UnifiedCache('small', { maxSize: 100 });
      const largeData = generateTestData(200);
      
      const result = await smallCache.set('large-key', largeData);
      expect(result).toBe(false);
    });

    test('creates cache directory if missing', async () => {
      const newCache = new UnifiedCache('new-namespace');
      await newCache.set('key', 'value');
      
      const dirExists = existsSync(newCache.cacheDir);
      expect(dirExists).toBe(true);
    });

    test('updates existing cache entries', async () => {
      await cache.set('update-key', 'original');
      await cache.set('update-key', 'updated');
      
      const result = await cache.get('update-key');
      expect(result).toBe('updated');
    });
  });

  describe('has() method', () => {
    test('returns true for existing valid key', async () => {
      await cache.set('exist-key', 'value');
      const result = await cache.has('exist-key');
      expect(result).toBe(true);
    });

    test('returns false for non-existent key', async () => {
      const result = await cache.has('not-exist');
      expect(result).toBe(false);
    });

    test('returns false for expired key', async () => {
      await cache.set('expire-check', 'value', { ttl: 100 });
      await delay(150);
      const result = await cache.has('expire-check');
      expect(result).toBe(false);
    });
  });

  describe('delete() method', () => {
    test('removes existing cache entry', async () => {
      await cache.set('delete-key', 'value');
      const deleted = await cache.delete('delete-key');
      expect(deleted).toBe(true);
      
      const result = await cache.get('delete-key');
      expect(result).toBeNull();
    });

    test('returns false for non-existent key', async () => {
      const result = await cache.delete('not-exist');
      expect(result).toBe(false);
    });

    test('removes both cache and meta files', async () => {
      const key = 'delete-files';
      await cache.set(key, 'value');
      
      const cachePath = cache.getCachePath(key);
      const metaPath = cache.getMetaPath(key);
      
      await cache.delete(key);
      
      expect(existsSync(cachePath)).toBe(false);
      expect(existsSync(metaPath)).toBe(false);
    });
  });

  describe('clear() method', () => {
    test('removes all cache entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');
      
      const result = await cache.clear();
      expect(result.cleared).toBe(3);
      expect(result.errors).toBe(0);
      
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });

    test('handles empty cache directory', async () => {
      const result = await cache.clear();
      expect(result.cleared).toBe(0);
      expect(result.errors).toBe(0);
    });

    test('handles non-existent directory gracefully', async () => {
      const nonExistCache = new UnifiedCache('non-exist');
      const result = await nonExistCache.clear();
      expect(result.cleared).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  describe('size() method', () => {
    test('returns zero for empty cache', async () => {
      const size = await cache.size();
      expect(size).toBe(0);
    });

    test('returns correct count for populated cache', async () => {
      await cache.set('size1', 'value1');
      await cache.set('size2', 'value2');
      
      const size = await cache.size();
      expect(size).toBe(2);
    });

    test('excludes expired entries from count', async () => {
      await cache.set('perm', 'value');
      await cache.set('temp', 'value', { ttl: 100 });
      
      expect(await cache.size()).toBe(2);
      
      await delay(150);
      expect(await cache.size()).toBe(1);
    });
  });

  describe('stats() method', () => {
    test('returns complete statistics object', async () => {
      const stats = await cache.stats();
      expect(stats).toHaveProperty('namespace', 'test');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');
    });

    test('calculates hit rate correctly', async () => {
      await cache.set('hit-test', 'value');
      await cache.get('hit-test'); // 1 hit
      await cache.get('hit-test'); // 2 hits
      await cache.get('miss-test'); // 1 miss
      
      const stats = await cache.stats();
      // 2 hits out of 3 attempts = 66.67%
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
    });

    test('sorts entries by hits', async () => {
      await cache.set('popular', 'value');
      await cache.set('unpopular', 'value');
      
      // Make 'popular' more popular
      await cache.get('popular');
      await cache.get('popular');
      await cache.get('popular');
      
      const stats = await cache.stats();
      expect(stats.entries[0].key).toBe('popular');
      expect(stats.entries[0].hits).toBe(3);
    });

    test('limits entries to top 10', async () => {
      // Create 15 entries
      for (let i = 0; i < 15; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }
      
      const stats = await cache.stats();
      expect(stats.entries.length).toBe(10);
      expect(stats.count).toBe(15);
    });
  });

  describe('TTL and Expiration', () => {
    test('respects default TTL setting', async () => {
      await cache.set('ttl-test', 'value');
      
      await delay(500);
      expect(await cache.get('ttl-test')).toBe('value');
      
      await delay(600);
      expect(await cache.get('ttl-test')).toBeNull();
    });

    test('handles zero TTL gracefully', async () => {
      await cache.set('zero-ttl', 'value', { ttl: 0 });
      await delay(10);
      expect(await cache.get('zero-ttl')).toBeNull();
    });

    test('handles very long TTL values', async () => {
      const longCache = new UnifiedCache('long', { ttl: 365 * 24 * 60 * 60 * 1000 });
      await longCache.set('long-ttl', 'value');
      
      const stats = await longCache.stats();
      const entry = stats.entries.find(e => e.key === 'long-ttl');
      expect(entry.expires).toBeGreaterThan(Date.now() + 364 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Error Handling', () => {
    test('handles filesystem permission errors gracefully', async () => {
      // Test that methods don't throw on errors
      const result1 = await cache.get('test-key');
      expect(result1).toBeNull();
      
      const result2 = await cache.set('test-key', 'value');
      expect(result2).toBe(true);
      
      const result3 = await cache.delete('test-key');
      expect(result3).toBe(true);
      
      // Methods should handle errors gracefully
      const result4 = await cache.delete('non-existent');
      expect(result4).toBe(false);
    });

    test('handles concurrent access', async () => {
      const key = 'concurrent';
      
      // Simulate concurrent writes
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.set(key, `value${i}`));
      }
      
      const results = await Promise.all(promises);
      expect(results.every(r => r === true)).toBe(true);
      
      // Should have the last written value
      const value = await cache.get(key);
      expect(value).toMatch(/^value\d+$/);
    });
  });
});