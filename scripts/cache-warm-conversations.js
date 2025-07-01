// cache-warm-conversations.js - Pre-cache recent conversations for fast access
import { conversationCache, formatBytes } from "../modules/unified-cache.js";
import { getRecentConversations } from "./save-conversation.js";

export async function run(args = {}) {
  const {
    limit = 50,           // Number of conversations to warm
    daysBack = 7,         // How many days back to look
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

    // Get recent conversations from cache
    const recentConversations = await getRecentConversations(limit);
    
    if (recentConversations.length === 0) {
      return {
        success: true,
        data: {
          found: 0,
          warmed: 0,
          alreadyCached: 0,
          message: "No conversations found in cache"
        },
        message: "No conversations to warm"
      };
    }

    // Track results
    const results = {
      found: recentConversations.length,
      warmed: 0,
      alreadyCached: 0,
      totalSize: 0,
      conversations: []
    };

    // Process each conversation
    for (const conv of recentConversations) {
      try {
        // Check if already in cache and warm
        const cacheKey = conv.cacheKey || `conversation-${conv.timestamp.split('T')[0]}-${conv.id}`;
        const existing = await conversationCache.get(cacheKey);
        
        if (existing) {
          results.alreadyCached++;
          results.totalSize += JSON.stringify(existing).length;
          
          if (verbose) {
            console.error(`[CACHE-WARM-CONVERSATIONS] Already cached: ${conv.title} (hits: ${conv.hits || 0})`);
          }
        } else if (!dryRun) {
          // Re-cache if missing
          const success = await conversationCache.set(cacheKey, conv);
          if (success) {
            results.warmed++;
            results.totalSize += JSON.stringify(conv).length;
            
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
          wordCount: conv.wordCount,
          hits: conv.hits || 0,
          keywords: (conv.keywords || []).slice(0, 5)
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

// Helper to find conversation patterns
export async function findConversationPatterns() {
  try {
    const conversations = await getRecentConversations(100);
    
    // Analyze patterns
    const patterns = {
      keywords: {},
      timesOfDay: {},
      daysOfWeek: {},
      topics: {}
    };

    for (const conv of conversations) {
      // Keywords frequency
      (conv.keywords || []).forEach(keyword => {
        patterns.keywords[keyword] = (patterns.keywords[keyword] || 0) + 1;
      });

      // Time patterns
      const date = new Date(conv.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      patterns.timesOfDay[timeSlot] = (patterns.timesOfDay[timeSlot] || 0) + 1;

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      patterns.daysOfWeek[dayNames[day]] = (patterns.daysOfWeek[dayNames[day]] || 0) + 1;
    }

    // Sort patterns
    const topKeywords = Object.entries(patterns.keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return {
      totalConversations: conversations.length,
      topKeywords,
      timesOfDay: patterns.timesOfDay,
      daysOfWeek: patterns.daysOfWeek
    };
  } catch (error) {
    console.error("[CACHE-WARM-CONVERSATIONS] Pattern analysis error:", error.message);
    return null;
  }
}