// cached-search.js - Cache-first search implementation for blazing fast searches

import { fileCache } from "./unified-cache.js";
import { promises as fs } from "fs";
import path from "path";

/**
 * Search for pattern in cached files (in-memory, super fast)
 * @param {string} pattern - Search pattern (string or regex)
 * @param {Object} options - Search options
 * @returns {Array} Search results from cache
 */
export async function searchInCache(pattern, options = {}) {
  const {
    isRegex = false,
    ignoreCase = true,
    contentSearch = true,
    maxMatches = 5,
    maxCacheResults = Infinity  // Unlimited cache results (free!)
  } = options;

  const results = [];
  const startTime = Date.now();
  let totalMatches = 0;
  
  // Create regex for searching
  const searchRegex = isRegex 
    ? new RegExp(pattern, ignoreCase ? 'gi' : 'g')
    : new RegExp(escapeRegex(pattern), ignoreCase ? 'gi' : 'g');

  // Get all cached entries
  const cacheEntries = await fileCache.getAllKeys();
  
  for (const key of cacheEntries) {
    try {
      const cachedData = await fileCache.get(key);
      if (!cachedData) continue;
      
      // Skip non-file entries - accept paths that look like files
      if (!isFileKey(key)) continue;
      
      if (contentSearch) {
        // Search in file content - extract from cached data structure
        const content = extractFileContent(cachedData);
          
        const matches = findMatchesInContent(content, searchRegex, maxMatches);
        
        if (matches.length > 0) {
          results.push({
            file: key,
            matches,
            cached: true,
            type: 'content'
            // DON'T include full content - just the matches!
          });
          
          totalMatches += matches.length;
          
          // No limit for cache results - they're free!
          // (Cache results come from memory, cost no extra tokens)
        }
      } else {
        // Search in filename
        const filename = path.basename(key);
        if (searchRegex.test(filename)) {
          results.push({
            file: key,
            cached: true,
            type: 'filename'
          });
        }
      }
    } catch (error) {
      // Skip entries that fail to parse
      continue;
    }
  }
  
  const searchTime = Date.now() - startTime;
  
  return {
    results,
    stats: {
      filesSearched: cacheEntries.length,
      matchCount: results.length,
      searchTime,
      source: 'cache'
    }
  };
}

/**
 * Search for files on disk (fallback for non-cached files)
 * @param {string} pattern - Search pattern
 * @param {Array} excludePaths - Paths to exclude (already searched in cache)
 * @param {Object} options - Search options
 */
export async function searchOnDisk(pattern, excludePaths = [], options = {}) {
  const {
    searchPath = '.',
    contentSearch = true,
    ignoreCase = true,
    maxDiskResults = 500  // Limit disk results to save tokens
  } = options;
  
  const startTime = Date.now();
  const results = [];
  
  // Use ripgrep for content search, find for filename search
  if (contentSearch) {
    // Use ripgrep for fast content search
    const { execSync } = await import('child_process');
    try {
      const flags = ignoreCase ? '-i' : '';
      const excludeArgs = excludePaths.map(p => `--glob '!${p}'`).join(' ');
      const cmd = `rg ${flags} "${pattern}" ${searchPath} --json ${excludeArgs}`;
      
      // Debug: log exclusion info
      if (excludePaths.length > 0) {
        console.log(`[RIPGREP DEBUG] Excluding ${excludePaths.length} paths`);
        console.log(`[RIPGREP DEBUG] Sample excludes: ${excludePaths.slice(0, 3).join(', ')}`);
        console.log(`[RIPGREP DEBUG] Command: ${cmd}`);
      }
      
      const output = execSync(cmd, { encoding: 'utf8' });
      const lines = output.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const match = JSON.parse(line);
          if (match.type === 'match') {
            results.push({
              file: match.data.path.text,
              line: match.data.line_number,
              column: match.data.submatches[0]?.start || 0,
              text: match.data.lines.text,
              cached: false,
              type: 'content'
            });
            
            // Limit disk results to save tokens
            if (results.length >= maxDiskResults) {
              break;
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    } catch (error) {
      // Ripgrep not available or no matches
    }
  } else {
    // Use find for filename search
    await searchFilenames(searchPath, pattern, excludePaths, results);
  }
  
  const searchTime = Date.now() - startTime;
  
  return {
    results,
    stats: {
      filesSearched: 'unknown',
      matchCount: results.length,
      searchTime,
      source: 'disk'
    }
  };
}

/**
 * Combined cache-first search
 */
export async function cachedSearch(pattern, options = {}) {
  const {
    paths = ['.'],
    contentSearch = true,
    includeNonCached = true,
    maxDiskResults = 500
  } = options;
  
  const totalStartTime = Date.now();
  
  // Step 1: Search in cache (unlimited - it's free!)
  const cacheResults = await searchInCache(pattern, { ...options, contentSearch });
  
  let diskResults = { results: [], stats: {} };
  
  // Step 2: Search non-cached files (limited to save tokens)
  if (includeNonCached) {
    // Convert cache paths to relative format for proper ripgrep exclusion
    const cachedPaths = cacheResults.results.map(r => {
      const filePath = r.file;
      // Convert absolute paths to relative for ripgrep compatibility
      if (filePath.includes('/apex-hive/')) {
        // Ripgrep glob patterns work without ./ prefix
        return filePath.split('/apex-hive/')[1];
      }
      // Convert ./path to path (remove ./ prefix)
      if (filePath.startsWith('./')) {
        return filePath.substring(2);
      }
      return filePath;
    });
    
    diskResults = await searchOnDisk(pattern, cachedPaths, { 
      ...options, 
      contentSearch, 
      maxDiskResults 
    });
  }
  
  // Combine results
  const allResults = [...cacheResults.results, ...diskResults.results];
  
  return {
    results: allResults,
    stats: {
      totalTime: Date.now() - totalStartTime,
      cacheHits: cacheResults.results.length,
      diskHits: diskResults.results.length,
      cacheTime: cacheResults.stats.searchTime,
      diskTime: diskResults.stats.searchTime || 0,
      totalMatches: allResults.length
    }
  };
}

// Helper functions

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatchesInContent(content, regex, maxMatches) {
  const matches = [];
  
  // If content looks like JSON with a 'content' field, extract it
  let actualContent = content;
  try {
    const parsed = JSON.parse(content);
    if (parsed.content && typeof parsed.content === 'string') {
      actualContent = parsed.content;
    }
  } catch (e) {
    // Not JSON, use as-is
  }
  
  const lines = actualContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineMatches = Array.from(line.matchAll(regex));
    
    for (const match of lineMatches) {
      matches.push({
        line: i + 1,
        column: match.index + 1,
        text: line.trim(),  // Only the actual line, not JSON
        match: match[0]
      });
      
      if (matches.length >= maxMatches) {
        return matches;
      }
    }
  }
  
  return matches;
}

async function searchFilenames(dir, pattern, excludePaths, results) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded paths
      if (excludePaths.includes(fullPath)) continue;
      
      // Skip common ignore patterns
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      // Check if filename matches
      const regex = new RegExp(pattern, 'i');
      if (regex.test(entry.name)) {
        results.push({
          file: fullPath,
          cached: false,
          type: 'filename'
        });
      }
      
      // Recurse into directories
      if (entry.isDirectory()) {
        await searchFilenames(fullPath, pattern, excludePaths, results);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
}

/**
 * Check if a cache key represents a file
 * @param {string} key - Cache key to check
 * @returns {boolean} - True if key looks like a file
 */
function isFileKey(key) {
  // Accept absolute paths (Linux/WSL)
  if (key.startsWith('/')) return true;
  
  // Accept Windows paths
  if (key.includes(':\\')) return true;
  
  // Accept relative paths that look like files
  if (key.includes('./') || key.includes('../')) return true;
  
  // Accept paths with file extensions
  if (/\.[a-zA-Z0-9]{1,10}$/.test(key)) return true;
  
  // Accept specific prefixed keys that contain file paths
  if (key.startsWith('script:')) return true;
  if (key.startsWith('docs/') || key.includes('/docs/')) return true;
  
  // Accept any key that contains a path separator (likely a file)
  if (key.includes('/') || key.includes('\\')) return true;
  
  // For now, be very liberal - only skip obvious non-file keys
  if (key === 'config:recipes' || key.startsWith('config:') && !key.includes('/')) return false;
  
  // Default: accept (better to have false positives than miss cache hits)
  return true;
}

/**
 * Extract file content from cached data structure
 * @param {any} cachedData - Raw cached data
 * @returns {string} - Extracted file content
 */
function extractFileContent(cachedData) {
  // If it's already a string, use as-is
  if (typeof cachedData === 'string') {
    return cachedData;
  }
  
  // If it's an object with 'content' property, use that
  if (cachedData && typeof cachedData === 'object' && 'content' in cachedData) {
    return typeof cachedData.content === 'string' ? cachedData.content : '';
  }
  
  // Fallback: stringify the whole object
  return JSON.stringify(cachedData);
}