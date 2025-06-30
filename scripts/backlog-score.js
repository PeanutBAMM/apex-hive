// backlog-score.js - Score and prioritize backlog items
import { promises as fs } from "fs";

export async function run(args = {}) {
  const {
    criteria = "value-effort",
    weight = {},
    threshold = 0,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[BACKLOG-SCORE] Scoring backlog items...");

  try {
    // Load backlog items
    const analyzeModule = await import("./backlog-analyze.js");
    const analyzeResult = await analyzeModule.run({ modules });

    if (!analyzeResult.success || analyzeResult.data.items === 0) {
      return {
        success: false,
        message: "No backlog items to score",
      };
    }

    // Get detailed items (need to reload with actual item data)
    const items = await loadDetailedItems(modules);

    // Score each item
    const scoredItems = [];
    for (const item of items) {
      const score = calculateScore(item, criteria, weight);
      scoredItems.push({
        ...item,
        score,
        scoreDetails: score.details,
      });
    }

    // Sort by score
    scoredItems.sort((a, b) => b.score.total - a.score.total);

    // Apply threshold
    const qualified = scoredItems.filter(
      (item) => item.score.total >= threshold,
    );

    // Generate recommendations
    const recommendations = generateRecommendations(scoredItems, criteria);

    // Format output
    const output = {
      scored: scoredItems.length,
      qualified: qualified.length,
      topItems: scoredItems.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        score: item.score.total,
        reason: item.score.primary,
      })),
      recommendations,
    };

    // Save scores if not dry run
    if (!dryRun) {
      const scoreData = {
        timestamp: new Date().toISOString(),
        criteria,
        items: scoredItems.map((item) => ({
          id: item.id,
          title: item.title,
          score: item.score.total,
          details: item.scoreDetails,
        })),
      };

      await fs.writeFile(
        "backlog-scores.json",
        JSON.stringify(scoreData, null, 2),
      );
    }

    return {
      success: true,
      data: output,
      message: `Scored ${scoredItems.length} items, ${qualified.length} above threshold`,
    };
  } catch (error) {
    console.error("[BACKLOG-SCORE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to score backlog items",
    };
  }
}

async function loadDetailedItems(modules) {
  // For now, return sample items with more details
  return [
    {
      id: "1",
      title: "Implement user authentication",
      priority: "high",
      status: "pending",
      category: "feature",
      effort: 8,
      value: 9,
      risk: 3,
      dependencies: [],
      tags: ["security", "core"],
    },
    {
      id: "2",
      title: "Fix memory leak in worker",
      priority: "critical",
      status: "in-progress",
      category: "bug",
      effort: 5,
      value: 8,
      risk: 2,
      dependencies: [],
      tags: ["performance"],
    },
    {
      id: "3",
      title: "Add dark mode",
      priority: "low",
      status: "pending",
      category: "feature",
      effort: 3,
      value: 4,
      risk: 1,
      dependencies: ["1"],
      tags: ["ui", "enhancement"],
    },
    {
      id: "4",
      title: "Optimize database queries",
      priority: "medium",
      status: "pending",
      category: "performance",
      effort: 6,
      value: 7,
      risk: 4,
      dependencies: [],
      tags: ["backend", "performance"],
    },
    {
      id: "5",
      title: "Write API documentation",
      priority: "medium",
      status: "pending",
      category: "docs",
      effort: 4,
      value: 6,
      risk: 1,
      dependencies: ["1"],
      tags: ["documentation"],
    },
  ];
}

function calculateScore(item, criteria, customWeight) {
  const scores = {
    total: 0,
    details: {},
    primary: "",
  };

  // Default weights
  const defaultWeights = {
    value: 0.3,
    effort: 0.2,
    priority: 0.2,
    risk: 0.15,
    dependencies: 0.15,
  };

  const weights = { ...defaultWeights, ...customWeight };

  switch (criteria) {
    case "value-effort":
      // High value, low effort = high score
      const valueScore = (item.value || 5) * 10;
      const effortScore = (10 - (item.effort || 5)) * 10;
      const ratioScore = effortScore > 0 ? (valueScore / effortScore) * 50 : 0;

      scores.details.value = valueScore * weights.value;
      scores.details.effort = effortScore * weights.effort;
      scores.details.ratio = ratioScore;
      scores.total = scores.details.value + scores.details.effort + ratioScore;
      scores.primary = `Value: ${item.value}, Effort: ${item.effort}`;
      break;

    case "priority-based":
      // Priority drives scoring
      const priorityMap = {
        critical: 100,
        high: 80,
        medium: 50,
        low: 20,
      };

      scores.details.priority = priorityMap[item.priority] || 50;
      scores.details.age = item.created
        ? Math.min(
            30,
            Math.floor(
              (Date.now() - new Date(item.created).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;
      scores.total = scores.details.priority + scores.details.age;
      scores.primary = `Priority: ${item.priority}`;
      break;

    case "risk-adjusted":
      // Factor in risk and dependencies
      const baseScore = ((item.value || 5) - (item.effort || 5)) * 10 + 50;
      const riskPenalty = (item.risk || 0) * 10;
      const depPenalty = (item.dependencies?.length || 0) * 5;

      scores.details.base = baseScore;
      scores.details.risk = -riskPenalty;
      scores.details.dependencies = -depPenalty;
      scores.total = Math.max(0, baseScore - riskPenalty - depPenalty);
      scores.primary = `Risk: ${item.risk}, Deps: ${item.dependencies?.length || 0}`;
      break;

    case "weighted":
      // Use custom weights
      scores.details.value = (item.value || 5) * 10 * weights.value;
      scores.details.effort = (10 - (item.effort || 5)) * 10 * weights.effort;
      scores.details.priority =
        (item.priority === "critical"
          ? 10
          : item.priority === "high"
            ? 8
            : item.priority === "medium"
              ? 5
              : 2) *
        10 *
        weights.priority;
      scores.details.risk = (10 - (item.risk || 0)) * 10 * weights.risk;
      scores.details.dependencies =
        (5 - Math.min(5, item.dependencies?.length || 0)) *
        10 *
        weights.dependencies;

      scores.total = Object.values(scores.details).reduce(
        (sum, val) => sum + val,
        0,
      );
      scores.primary = "Weighted score";
      break;

    default:
      // Simple scoring
      scores.total = Math.random() * 100;
      scores.primary = "Random";
  }

  return scores;
}

function generateRecommendations(scoredItems, criteria) {
  const recommendations = [];

  // Top priority recommendation
  if (scoredItems.length > 0) {
    recommendations.push({
      type: "priority",
      message: `Start with "${scoredItems[0].title}" (score: ${Math.round(scoredItems[0].score.total)})`,
    });
  }

  // Quick wins (high score, low effort)
  const quickWins = scoredItems
    .filter((item) => item.score.total > 50 && (item.effort || 5) <= 3)
    .slice(0, 3);

  if (quickWins.length > 0) {
    recommendations.push({
      type: "quick-wins",
      message: `Quick wins available: ${quickWins.map((i) => i.title).join(", ")}`,
    });
  }

  // Blocked items
  const blocked = scoredItems.filter(
    (item) => item.dependencies?.length > 0 || item.blocked,
  );

  if (blocked.length > 0) {
    recommendations.push({
      type: "blocked",
      message: `${blocked.length} items are blocked by dependencies`,
    });
  }

  // High risk items
  const highRisk = scoredItems.filter((item) => (item.risk || 0) >= 4);

  if (highRisk.length > 0) {
    recommendations.push({
      type: "risk",
      message: `${highRisk.length} high-risk items need careful planning`,
    });
  }

  return recommendations;
}
