// changelog-generate.js - Generate changelog from git commits
import { execSync } from "child_process";
import { promises as fs } from "fs";

export async function run(args = {}) {
  const {
    from,
    to = "HEAD",
    format = "markdown",
    output = "CHANGELOG.md",
    append = true,
    unreleased = true,
    dryRun = false,
    modules = {},
  } = args;

  console.error("[CHANGELOG-GENERATE] Generating changelog...");

  try {
    // Get tags if no from specified
    let fromRef = from;
    if (!fromRef) {
      try {
        const tags = execSync("git tag --sort=-version:refname", {
          encoding: "utf8",
        })
          .trim()
          .split("\n")
          .filter((t) => t);

        fromRef = tags.length > 0 ? tags[0] : null;
      } catch {
        // No tags found
      }
    }

    // Get commits
    const commits = await getCommits(fromRef, to);

    if (commits.length === 0) {
      return {
        success: true,
        data: {
          commits: 0,
          from: fromRef || "beginning",
          to,
        },
        message: "No commits found for changelog",
      };
    }

    // Categorize commits
    const categorized = categorizeCommits(commits);

    // Generate changelog content
    let changelogContent;
    switch (format) {
      case "markdown":
        changelogContent = generateMarkdownChangelog(categorized, {
          fromRef,
          to,
          unreleased,
        });
        break;
      case "json":
        changelogContent = JSON.stringify(categorized, null, 2);
        break;
      case "plain":
        changelogContent = generatePlainChangelog(categorized);
        break;
      default:
        changelogContent = generateMarkdownChangelog(categorized, {
          fromRef,
          to,
          unreleased,
        });
    }

    // Write or append to file
    if (!dryRun && output) {
      if (append && output.endsWith(".md")) {
        // Read existing changelog
        let existingContent = "";
        try {
          existingContent = await fs.readFile(output, "utf8");
        } catch {
          // File doesn't exist yet
          existingContent =
            "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
        }

        // Insert new content after header
        const headerEnd = existingContent.indexOf("\n\n") + 2;
        const newContent =
          existingContent.slice(0, headerEnd) +
          changelogContent +
          "\n" +
          existingContent.slice(headerEnd);

        await fs.writeFile(output, newContent);
      } else {
        await fs.writeFile(output, changelogContent);
      }
    }

    return {
      success: true,
      dryRun,
      data: {
        commits: commits.length,
        from: fromRef || "beginning",
        to,
        categories: Object.keys(categorized),
        output: dryRun ? null : output,
      },
      message: dryRun
        ? `Would generate changelog with ${commits.length} commits`
        : `Generated changelog with ${commits.length} commits`,
    };
  } catch (error) {
    console.error("[CHANGELOG-GENERATE] Error:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to generate changelog",
    };
  }
}

async function getCommits(from, to) {
  const range = from ? `${from}..${to}` : to;

  try {
    const format = "%H|%ai|%an|%s|%b";
    const output = execSync(`git log ${range} --format="${format}"`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    return output
      .trim()
      .split("\n")
      .filter((line) => line)
      .map((line) => {
        const [hash, date, author, subject, body] = line.split("|");
        return {
          hash: hash.substring(0, 7),
          date: date.split(" ")[0],
          author,
          subject,
          body: body || "",
          type: extractCommitType(subject),
          scope: extractCommitScope(subject),
          breaking: subject.includes("!") || body.includes("BREAKING CHANGE"),
        };
      });
  } catch (error) {
    if (error.message.includes("unknown revision")) {
      // Invalid ref, try without range
      return getCommits(null, to);
    }
    throw error;
  }
}

function extractCommitType(subject) {
  const match = subject.match(/^(\w+)(\([\w-]+\))?!?:/);
  if (match) {
    return match[1];
  }

  // Guess type from subject
  if (subject.match(/^(add|create|implement)/i)) return "feat";
  if (subject.match(/^fix/i)) return "fix";
  if (subject.match(/^(update|improve)/i)) return "enhance";
  if (subject.match(/^(doc|docs)/i)) return "docs";
  if (subject.match(/^test/i)) return "test";
  if (subject.match(/^(chore|bump|release)/i)) return "chore";

  return "other";
}

function extractCommitScope(subject) {
  const match = subject.match(/^\w+\(([\w-]+)\)/);
  return match ? match[1] : null;
}

function categorizeCommits(commits) {
  const categories = {
    breaking: [],
    feat: [],
    fix: [],
    enhance: [],
    docs: [],
    test: [],
    chore: [],
    other: [],
  };

  for (const commit of commits) {
    if (commit.breaking) {
      categories.breaking.push(commit);
    }

    const type = commit.type || "other";
    if (categories[type]) {
      categories[type].push(commit);
    } else {
      categories.other.push(commit);
    }
  }

  // Remove empty categories
  for (const key of Object.keys(categories)) {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  }

  return categories;
}

function generateMarkdownChangelog(categorized, options) {
  const { fromRef, to, unreleased } = options;

  let markdown = "";

  // Header
  if (unreleased && to === "HEAD") {
    markdown += `## [Unreleased]\n\n`;
  } else if (fromRef) {
    const toVersion = to === "HEAD" ? "Unreleased" : to;
    markdown += `## [${toVersion}] - ${new Date().toISOString().split("T")[0]}\n\n`;
  }

  // Category headers
  const categoryTitles = {
    breaking: "⚠️ BREAKING CHANGES",
    feat: "✨ Features",
    fix: "🐛 Bug Fixes",
    enhance: "💪 Enhancements",
    docs: "📚 Documentation",
    test: "🧪 Tests",
    chore: "🔧 Maintenance",
    other: "📦 Other Changes",
  };

  for (const [category, commits] of Object.entries(categorized)) {
    markdown += `### ${categoryTitles[category] || category}\n\n`;

    for (const commit of commits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : "";
      const subject = commit.subject
        .replace(/^\w+(\([\w-]+\))?!?:\s*/, "") // Remove conventional prefix
        .replace(/^./, (c) => c.toUpperCase()); // Capitalize first letter

      markdown += `- ${scope}${subject} ([${commit.hash}])\n`;

      if (commit.breaking && commit.body) {
        const breakingNote = commit.body
          .split("\n")
          .find((line) => line.startsWith("BREAKING CHANGE:"));

        if (breakingNote) {
          markdown += `  ${breakingNote}\n`;
        }
      }
    }

    markdown += "\n";
  }

  return markdown;
}

function generatePlainChangelog(categorized) {
  let plain = "";

  for (const [category, commits] of Object.entries(categorized)) {
    plain += `${category.toUpperCase()}\n`;
    plain += "=".repeat(category.length) + "\n\n";

    for (const commit of commits) {
      plain += `* ${commit.subject} (${commit.hash})\n`;
    }

    plain += "\n";
  }

  return plain;
}
