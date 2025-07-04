// doc-search.js - Search within documentation files
import { promises as fs } from "fs";
import path from "path";

export async function run(args) {
  const {
    query,
    q,
    docsPath = "docs",
    includeComments = false,
    modules,
  } = args;

  const searchQuery = query || q || "";

  if (!searchQuery) {
    throw new Error("Search query required. Usage: apex doc:search <query>");
  }

  console.error(`[DOC-SEARCH] Searching documentation for: "${searchQuery}"`);

  try {
    // If RAG module available, use it for better search
    if (modules?.rag) {
      return await searchWithRAG(searchQuery, docsPath, modules.rag);
    }

    // Fallback to simple search
    const results = await searchDocs(searchQuery, docsPath, includeComments);

    return {
      status: "complete",
      query: searchQuery,
      matches: results.matches,
      files: results.files,
      count: results.matches.length,
      message:
        results.matches.length > 0
          ? `Found ${results.matches.length} match(es) in ${results.files.length} file(s)`
          : "No matches found",
    };
  } catch (error) {
    console.error("[DOC-SEARCH] Error:", error.message);
    return {
      status: "error",
      message: "Failed to search documentation",
      error: error.message,
    };
  }
}

async function searchWithRAG(query, docsPath, ragModule) {
  console.error("[DOC-SEARCH] Using RAG for optimized search...");

  const results = await ragModule.search(query, {
    paths: [docsPath],
    include: "*.md",
    limit: 50,
  });

  // Transform RAG results to our format
  const matches = [];
  const files = new Set();

  for (const match of results.matches || []) {
    if (match.file.endsWith(".md")) {
      matches.push({
        file: match.file,
        line: match.line,
        text: match.content || match.text,
        context: match.context,
        score: match.score,
      });
      files.add(match.file);
    }
  }

  return {
    status: "complete",
    query,
    matches,
    files: Array.from(files),
    count: matches.length,
    message:
      matches.length > 0
        ? `Found ${matches.length} match(es) in ${files.size} file(s)`
        : "No matches found",
  };
}

async function searchDocs(query, docsPath, includeComments) {
  const matches = [];
  const files = new Set();

  // Find all markdown files
  const mdFiles = await findMarkdownFiles(docsPath);

  for (const file of mdFiles) {
    const fileMatches = await searchFile(file, query, includeComments);

    if (fileMatches.length > 0) {
      matches.push(...fileMatches);
      files.add(file);
    }
  }

  // Sort by relevance
  matches.sort((a, b) => {
    // Prioritize title matches
    if (a.isTitle && !b.isTitle) return -1;
    if (!a.isTitle && b.isTitle) return 1;

    // Then by score if available
    if (a.score && b.score) return b.score - a.score;

    // Then by line number
    return a.line - b.line;
  });

  return {
    matches: matches.slice(0, 50), // Limit results
    files: Array.from(files),
  };
}

async function searchFile(filePath, query, includeComments) {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split("\n");
  const matches = [];

  const searchRegex = new RegExp(query, "gi");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments unless requested
    if (!includeComments && line.trim().startsWith("<!--")) {
      continue;
    }

    if (searchRegex.test(line)) {
      const match = {
        file: filePath,
        line: i + 1,
        text: line.trim(),
        context: getContext(lines, i),
        isTitle: /^#{1,6}\s/.test(line),
        score: calculateScore(line, query),
      };

      matches.push(match);
    }
  }

  return matches;
}

function getContext(lines, index) {
  const contextLines = 2;
  const start = Math.max(0, index - contextLines);
  const end = Math.min(lines.length, index + contextLines + 1);

  return {
    before: lines
      .slice(start, index)
      .map((l) => l.trim())
      .filter(Boolean),
    after: lines
      .slice(index + 1, end)
      .map((l) => l.trim())
      .filter(Boolean),
  };
}

function calculateScore(line, query) {
  let score = 0;

  // Exact match
  if (line.toLowerCase().includes(query.toLowerCase())) {
    score += 10;
  }

  // Word boundary match
  const wordRegex = new RegExp(`\\b${query}\\b`, "i");
  if (wordRegex.test(line)) {
    score += 5;
  }

  // Title match
  if (/^#{1,6}\s/.test(line)) {
    score += 3;
  }

  // Start of line
  if (line.trim().toLowerCase().startsWith(query.toLowerCase())) {
    score += 2;
  }

  return score;
}

async function findMarkdownFiles(dir) {
  const files = [];

  async function scan(directory) {
    try {
      const entries = await listFiles(directory, {
        withFileTypes: true,
        includeDirectories: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (
          (typeof entry.isDirectory === "function"
            ? entry.isDirectory()
            : entry._isDirectory) &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules"
        ) {
          await scan(fullPath);
        } else if (entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`[DOC-SEARCH] Failed to scan ${directory}:`, error.message);
    }
  }

  await scan(dir);
  return files;
}
