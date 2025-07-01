// cache-warm-conversations.js - Pre-cache recent conversations for fast access
import { promises as fs } from "fs";
import path from "path";
import { conversationCache, formatBytes } from "../modules/unified-cache.js";

export async function run(args = {}) {
  const {
    limit = 5,            // Number of conversations to warm (reduced from 50)
    daysBack = 7,         // How many days back to look
    directory = "conversations", // Directory to read conversations from
    dryRun = false,
    verbose = false,
    modules = {},
  } = args;

  console.error("[CACHE-WARM-CONVERSATIONS] Warming conversation cache...");

  try {
    // Get current cache stats
    const statsBefore = await conversationCache.stats();
    
    if (verbose) {
      console.error(`[CACHE-WARM-CONVERSATIONS] Current cache: ${statsBefore.items} items, ${formatBytes(statsBefore.totalSize)}`);
    }

    // Read conversation index from disk
    const conversations = await readConversationsFromDisk(directory, limit, daysBack);
    
    if (conversations.length === 0) {
      return {
        success: true,
        data: {
          found: 0,
          warmed: 0,
          alreadyCached: 0,
          message: "No conversations found on disk"
        },
        message: "No conversations to warm"
      };
    }

    // Track results
    const results = {
      found: conversations.length,
      warmed: 0,
      alreadyCached: 0,
      totalSize: 0,
      conversations: []
    };

    // Process each conversation
    for (const conv of conversations) {
      try {
        // Generate cache key
        const cacheKey = `conversation-${conv.timestamp.split('T')[0]}-${conv.id}`;
        
        // Check if already in cache
        const existing = await conversationCache.get(cacheKey);
        
        if (existing) {
          results.alreadyCached++;
          results.totalSize += JSON.stringify(existing).length;
          
          if (verbose) {
            console.error(`[CACHE-WARM-CONVERSATIONS] Already cached: ${conv.title}`);
          }
        } else if (!dryRun) {
          // Read full conversation content
          const content = await fs.readFile(path.join(directory, conv.file), 'utf8');
          
          // Parse narrative summary from content
          const narrativeSummary = extractNarrativeSummary(content);
          
          // Create cache entry
          const cacheEntry = {
            id: conv.id,
            title: conv.title,
            timestamp: conv.timestamp,
            tags: conv.tags || [],
            summary: narrativeSummary,
            keywords: extractKeywords(narrativeSummary),
            wordCount: narrativeSummary ? narrativeSummary.split(/\s+/).length : 0,
            characterCount: narrativeSummary ? narrativeSummary.length : 0,
            file: conv.file
          };
          
          // Cache the conversation
          const success = await conversationCache.set(cacheKey, cacheEntry);
          if (success) {
            results.warmed++;
            results.totalSize += JSON.stringify(cacheEntry).length;
            
            if (verbose) {
              console.error(`[CACHE-WARM-CONVERSATIONS] Warmed: ${conv.title}`);
            }
          }
        }

        // Add to results
        results.conversations.push({
          title: conv.title,
          id: conv.id,
          timestamp: conv.timestamp,
          file: conv.file,
          cached: existing ? true : !dryRun
        });

      } catch (error) {
        console.error(`[CACHE-WARM-CONVERSATIONS] Error processing ${conv.title}:`, error.message);
      }
    }

    // Get stats after warming
    const statsAfter = await conversationCache.stats();

    // Build summary message
    let message = dryRun
      ? `Would warm ${results.found} conversations`
      : `Warmed ${results.warmed} conversations, ${results.alreadyCached} already cached`;

    return {
      success: true,
      dryRun,
      data: {
        ...results,
        totalSize: formatBytes(results.totalSize),
        cacheStatsBefore: {
          items: statsBefore.items,
          size: formatBytes(statsBefore.totalSize),
          hits: statsBefore.totalHits
        },
        cacheStatsAfter: {
          items: statsAfter.items,
          size: formatBytes(statsAfter.totalSize),
          hits: statsAfter.totalHits
        },
        topConversations: results.conversations
          .sort((a, b) => b.hits - a.hits)
          .slice(0, 10)
      },
      message
    };
  } catch (error) {
    console.error("[CACHE-WARM-CONVERSATIONS] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to warm conversation cache"
    };
  }
}

// Helper to read conversations from disk
async function readConversationsFromDisk(directory, limit, daysBack) {
  try {
    // Read index file
    const indexPath = path.join(directory, 'index.json');
    const indexContent = await fs.readFile(indexPath, 'utf8');
    const index = JSON.parse(indexContent);
    
    // Filter by date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const recentConversations = index
      .filter(conv => new Date(conv.timestamp) >= cutoffDate)
      .slice(0, limit);
    
    // Add ID to each conversation
    return recentConversations.map(conv => ({
      ...conv,
      id: conv.file.replace(/\.(md|json)$/, '').substring(20) // Extract ID from filename
    }));
  } catch (error) {
    console.error("[CACHE-WARM-CONVERSATIONS] Error reading index:", error.message);
    
    // Fallback: read directory directly
    try {
      const files = await fs.readdir(directory);
      const mdFiles = files
        .filter(f => f.endsWith('.md') && f !== 'README.md')
        .sort((a, b) => b.localeCompare(a)) // Sort by date (newest first)
        .slice(0, limit);
      
      const conversations = [];
      for (const file of mdFiles) {
        try {
          const content = await fs.readFile(path.join(directory, file), 'utf8');
          const title = content.match(/^# (.+)$/m)?.[1] || file;
          const timestamp = content.match(/\*\*Date\*\*: (.+)$/m)?.[1] || new Date().toISOString();
          const tags = content.match(/\*\*Tags\*\*: (.+)$/m)?.[1]
            ?.split(', ')
            .map(t => t.replace(/`/g, '')) || [];
          
          conversations.push({
            file,
            title,
            timestamp,
            tags,
            id: file.replace(/\.(md|json)$/, '').substring(20)
          });
        } catch (err) {
          console.error(`[CACHE-WARM-CONVERSATIONS] Error reading ${file}:`, err.message);
        }
      }
      
      return conversations;
    } catch (fallbackError) {
      console.error("[CACHE-WARM-CONVERSATIONS] Fallback error:", fallbackError.message);
      return [];
    }
  }
}

// Helper to extract narrative summary from markdown content
function extractNarrativeSummary(content) {
  // Look for the conversation summary section
  const summaryMatch = content.match(/## Conversation Summary[\s\S]*?(?=\n---|\n## |$)/);
  if (summaryMatch) {
    return summaryMatch[0].trim();
  }
  
  // Fallback: look for any summary section
  const anySummaryMatch = content.match(/### Summary[\s\S]*?(?=\n## |\n### |$)/);
  if (anySummaryMatch) {
    return anySummaryMatch[0].trim();
  }
  
  // Last resort: extract first few paragraphs after metadata
  const lines = content.split('\n');
  const contentStart = lines.findIndex(line => line.trim() === '') + 1;
  const contentLines = lines.slice(contentStart, contentStart + 20)
    .filter(line => line.trim() && !line.startsWith('#'));
  
  return contentLines.join('\n').trim() || "No summary available.";
}

// Helper to extract keywords from text
function extractKeywords(text, count = 10) {
  if (!text) return [];
  
  // Simple keyword extraction based on frequency
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !commonWords.includes(word));

  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Return top N most frequent words
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

// Common words to exclude from keywords
const commonWords = ['about', 'above', 'after', 'again', 'against', 'being', 'below', 'between', 
  'both', 'could', 'during', 'each', 'from', 'further', 'having', 'here', 'into', 
  'more', 'most', 'other', 'over', 'same', 'should', 'some', 'such', 'than', 
  'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 
  'through', 'under', 'until', 'very', 'what', 'when', 'where', 'which', 'while', 
  'with', 'would', 'your', 'today', 'session', 'development', 'changes', 'files'];