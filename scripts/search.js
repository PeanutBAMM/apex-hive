// search.js - Smart search wrapper with cache-first approach
import { execSync } from "child_process";
import path from "path";
import { cachedGrep } from "../modules/file-ops.js";

export async function run(args) {
  const {
    query,
    q,
    type = "content",
    paths = ["."],
    limit = 20,
    includeContent = true,
    modules,
  } = args;

  const searchQuery = query || q || "";

  if (!searchQuery) {
    throw new Error("Search query required. Usage: apex search <query>");
  }

  console.error(`[SEARCH] Searching for: "${searchQuery}"`);

  try {
    let results;

    // Use cache-first search for content searches
    if (type === "content") {
      console.error("[SEARCH] Using cache-first content search...");
      const grepResults = await cachedGrep(searchQuery, {
        paths,
        maxMatches: limit,
        ignoreCase: true
      });
      
      // Convert grep results to expected format
      results = {
        matches: grepResults.matches.map(m => ({
          file: m.file,
          line: m.matches?.[0]?.line || m.line || 1,
          column: m.matches?.[0]?.column || 1,
          match: m.matches?.[0]?.match || searchQuery,
          content: m.matches?.[0]?.text || m.text || '',
          cached: m.cached
        })),
        stats: grepResults.stats
      };
      
      console.error(`[SEARCH] Cache hits: ${grepResults.stats.cacheHits || 0}, Disk hits: ${grepResults.stats.diskHits || 0}`);
    } else {
      // Use direct search for other types
      console.error("[SEARCH] Using direct search...");
      results = await directSearch(searchQuery, { type, paths, limit });
    }

    // Post-process results
    const processed = await processSearchResults(results, searchQuery);

    return {
      query: searchQuery,
      type,
      matches: processed.matches,
      files: processed.files,
      stats: {
        filesSearched: processed.filesSearched,
        matchCount: processed.matches.length,
        uniqueFiles: processed.files.length,
        searchTime: processed.duration,
      },
      topMatch: processed.matches[0],
      message:
        processed.matches.length > 0
          ? `Found ${processed.matches.length} matches in ${processed.files.length} files`
          : "No matches found",
    };
  } catch (error) {
    console.error("[SEARCH] Error:", error.message);
    return {
      status: "error",
      query: searchQuery,
      message: "Search failed",
      error: error.message,
    };
  }
}

async function directSearch(query, options) {
  const { type, paths, limit } = options;
  const searchPaths = Array.isArray(paths) ? paths : [paths];

  try {
    // Check if ripgrep is available
    const hasRipgrep = await checkCommand("rg --version");

    if (hasRipgrep) {
      return await searchWithRipgrep(query, type, searchPaths, limit);
    } else {
      return await searchWithGrep(query, type, searchPaths, limit);
    }
  } catch (error) {
    throw new Error(`Direct search failed: ${error.message}`);
  }
}

async function searchWithRipgrep(query, type, paths, limit) {
  console.error("[SEARCH] Using ripgrep for fast search...");

  const startTime = Date.now();
  let command;

  switch (type) {
    case "file":
      // Search for filenames
      command = `rg --files ${paths.join(" ")} | rg -i "${query}" | head -${limit}`;
      break;

    case "function":
      // Search for function definitions
      command = `rg -t js -t ts "\\b(function|const|let|var|class)\\s+${query}\\b" ${paths.join(" ")} --max-count 1 -n | head -${limit}`;
      break;

    case "import":
      // Search for imports
      command = `rg -t js -t ts "(import|require).*${query}" ${paths.join(" ")} --max-count 1 -n | head -${limit}`;
      break;

    default:
      // Content search
      command = `rg -i "${query}" ${paths.join(" ")} -n --max-count 3 | head -${limit * 3}`;
  }

  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const duration = Date.now() - startTime;

    return {
      raw: output,
      duration,
      tool: "ripgrep",
      type,
    };
  } catch (error) {
    if (error.status === 1 && !error.stdout) {
      // No matches found
      return {
        raw: "",
        duration: Date.now() - startTime,
        tool: "ripgrep",
        type,
      };
    }
    throw error;
  }
}

async function searchWithGrep(query, type, paths, limit) {
  console.error("[SEARCH] Using grep (slower fallback)...");

  const startTime = Date.now();
  let command;

  switch (type) {
    case "file":
      command = `find ${paths.join(" ")} -type f -name "*${query}*" 2>/dev/null | head -${limit}`;
      break;

    default:
      command = `grep -r -i -n "${query}" ${paths.join(" ")} 2>/dev/null | head -${limit}`;
  }

  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      raw: output,
      duration: Date.now() - startTime,
      tool: "grep",
      type,
    };
  } catch (error) {
    return {
      raw: "",
      duration: Date.now() - startTime,
      tool: "grep",
      type,
    };
  }
}

async function processSearchResults(results, query) {
  const matches = [];
  const files = new Set();
  const processed = {
    matches: [],
    files: [],
    filesSearched: 0,
    duration: results.duration || 0,
  };

  if (!results.raw) {
    return processed;
  }

  const lines = results.raw.split("\n").filter(Boolean);

  for (const line of lines) {
    let match;

    if (results.tool === "ripgrep") {
      // Parse ripgrep output format: file:line:content
      const parts = line.split(":");
      if (parts.length >= 3) {
        const file = parts[0];
        const lineNum = parseInt(parts[1]);
        const content = parts.slice(2).join(":").trim();

        match = {
          file,
          line: lineNum,
          content,
          preview: highlightMatch(content, query),
        };
      }
    } else {
      // Parse grep output
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const file = line.substring(0, colonIndex);
        const content = line.substring(colonIndex + 1);

        match = {
          file,
          line: 0,
          content,
          preview: highlightMatch(content, query),
        };
      }
    }

    if (match) {
      matches.push(match);
      files.add(match.file);
    }
  }

  // Sort matches by relevance
  matches.sort((a, b) => {
    // Exact matches first
    const aExact = a.content.toLowerCase().includes(query.toLowerCase());
    const bExact = b.content.toLowerCase().includes(query.toLowerCase());
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Then by filename
    return a.file.localeCompare(b.file);
  });

  processed.matches = matches;
  processed.files = Array.from(files).sort();
  processed.filesSearched = files.size;

  return processed;
}

function highlightMatch(content, query) {
  // Simple highlight by uppercase
  const regex = new RegExp(`(${query})`, "gi");
  return content.replace(regex, "**$1**");
}

async function checkCommand(command) {
  try {
    execSync(command, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
