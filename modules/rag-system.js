// rag-system.js - Retrieval Augmented Generation system

import { searchContent, searchFiles } from "./search.js";
import { readFile } from "./file-ops.js";
import { logger } from "./logger.js";

export class RAGSystem {
  constructor() {
    this.logger = logger.child("RAG");
  }

  /**
   * Search and retrieve relevant content
   */
  async retrieve(query, options = {}) {
    this.logger.debug("Retrieving content for query:", query);

    // Search for relevant files and content
    const [fileMatches, contentMatches] = await Promise.all([
      searchFiles(`*${query}*`, { ...options, noCache: true }),
      searchContent(query, { ...options, maxCount: 20 }),
    ]);

    // Combine and deduplicate results
    const relevantFiles = new Set([
      ...fileMatches.slice(0, 10),
      ...contentMatches.map((m) => m.file),
    ]);

    // Retrieve content from relevant files
    const contents = await Promise.all(
      Array.from(relevantFiles).map(async (file) => {
        try {
          const content = await readFile(file, { noCache: true });
          return {
            file,
            content: content.slice(0, 5000), // Limit content size
            matches: contentMatches.filter((m) => m.file === file),
          };
        } catch (error) {
          this.logger.warn(`Failed to read ${file}:`, error.message);
          return null;
        }
      }),
    );

    return contents.filter(Boolean);
  }

  /**
   * Generate context from retrieved content
   */
  generateContext(retrieved, options = {}) {
    const maxTokens = options.maxTokens || 8000;
    let currentTokens = 0;
    const context = [];

    // Sort by relevance (files with matches first)
    retrieved.sort((a, b) => b.matches.length - a.matches.length);

    for (const item of retrieved) {
      // Rough token estimation
      const tokens = Math.ceil(item.content.length / 4);

      if (currentTokens + tokens > maxTokens) {
        break;
      }

      context.push({
        file: item.file,
        content: item.content,
        relevance: item.matches.length,
      });

      currentTokens += tokens;
    }

    return {
      context,
      totalTokens: currentTokens,
      filesIncluded: context.length,
      filesTotal: retrieved.length,
    };
  }

  /**
   * Main RAG pipeline
   */
  async process(query, options = {}) {
    try {
      // Retrieve relevant content
      const retrieved = await this.retrieve(query, options);

      if (retrieved.length === 0) {
        return {
          success: false,
          message: "No relevant content found",
          query,
        };
      }

      // Generate context
      const contextData = this.generateContext(retrieved, options);

      return {
        success: true,
        query,
        ...contextData,
      };
    } catch (error) {
      this.logger.error("RAG processing failed:", error);
      return {
        success: false,
        error: error.message,
        query,
      };
    }
  }
}

// Singleton instance
export const ragSystem = new RAGSystem();
