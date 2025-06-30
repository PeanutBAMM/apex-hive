// search.js - Fast search module using ripgrep

import { exec } from "./utils.js";
import { searchCache } from "./unified-cache.js";
import path from "path";

/**
 * Search for files matching a pattern
 */
export async function searchFiles(pattern, options = {}) {
  const cacheKey = `files:${pattern}:${JSON.stringify(options)}`;

  // Check cache
  if (!options.noCache) {
    const cached = await searchCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Build rg command
  const args = ["--files", "--glob", pattern];

  if (options.type) {
    args.push("--type", options.type);
  }

  if (options.path) {
    args.push(options.path);
  }

  const result = await exec(`rg ${args.join(" ")}`);

  if (result.success) {
    const files = result.output
      .split("\n")
      .filter(Boolean)
      .map((f) => f.trim());

    // Cache result
    await searchCache.set(cacheKey, files);
    return files;
  }

  return [];
}

/**
 * Search for content in files
 */
export async function searchContent(query, options = {}) {
  const cacheKey = `content:${query}:${JSON.stringify(options)}`;

  // Check cache
  if (!options.noCache) {
    const cached = await searchCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Build rg command
  const args = ["--json", "--max-count", options.maxCount || "10"];

  if (options.ignoreCase) {
    args.push("-i");
  }

  if (options.type) {
    args.push("--type", options.type);
  }

  if (options.glob) {
    args.push("--glob", options.glob);
  }

  // Escape query for shell
  const escapedQuery = query.replace(/'/g, "'\\''");
  args.push(`'${escapedQuery}'`);

  if (options.path) {
    args.push(options.path);
  }

  const result = await exec(`rg ${args.join(" ")}`);

  if (result.success) {
    const matches = [];
    const lines = result.output.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === "match") {
          matches.push({
            file: data.data.path.text,
            line: data.data.line_number,
            text: data.data.lines.text,
            match: data.data.submatches[0]?.match.text || query,
          });
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    // Cache result
    await searchCache.set(cacheKey, matches);
    return matches;
  }

  return [];
}

/**
 * Search with scoring and ranking
 */
export async function searchWithScore(query, options = {}) {
  const matches = await searchContent(query, options);

  // Score matches based on relevance
  const scored = matches.map((match) => {
    let score = 0;

    // Exact match gets highest score
    if (match.text.toLowerCase().includes(query.toLowerCase())) {
      score += 10;
    }

    // File name match
    const fileName = path.basename(match.file);
    if (fileName.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }

    // Directory match
    const dirName = path.dirname(match.file);
    if (dirName.toLowerCase().includes(query.toLowerCase())) {
      score += 3;
    }

    // Line number (prefer earlier matches)
    score -= Math.log(match.line) * 0.1;

    return { ...match, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  return scored;
}
