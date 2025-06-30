// patterns.js - English natural language patterns

export default [
  // Recipe triggers
  {
    name: "commit-and-push",
    match: /commit.*push|push.*commit/i,
    recipe: "commit-push",
  },
  {
    name: "fix-ci",
    match: /fix.*ci|ci.*broken|ci.*fail/i,
    recipe: "fix-ci",
  },
  {
    name: "clean-code",
    match: /clean.*code|cleanup|code.*quality/i,
    recipe: "clean-code",
  },
  {
    name: "start-day",
    match: /start.*day|morning|begin.*work/i,
    recipe: "start-day",
  },
  {
    name: "end-day",
    match: /end.*day|finish.*work|done.*today/i,
    recipe: "end-day",
  },
  {
    name: "whats-broken",
    match: /what.*broken|what.*wrong|show.*issues/i,
    command: "detect-issues",
  },
  {
    name: "fix-it",
    match: /^fix$/i,
    recipe: "fix",
  },

  // Direct command patterns
  {
    name: "search-pattern",
    match: /search\s+(?:for\s+)?(.+)/i,
    handler: (match) => ({
      command: "search",
      args: { query: match[1].trim() },
    }),
  },
  {
    name: "find-files",
    match: /find\s+(?:all\s+)?(\S+)\s+files?/i,
    handler: (match) => ({
      command: "find",
      args: { pattern: match[1] },
    }),
  },
  {
    name: "read-file",
    match: /read\s+(?:file\s+)?(.+)/i,
    handler: (match) => ({
      command: "read",
      args: { path: match[1].trim() },
    }),
  },
  {
    name: "run-tests",
    match: /run.*test|test.*all/i,
    command: "test",
  },
  {
    name: "show-status",
    match: /show.*status|git.*status/i,
    command: "git:status",
  },
  {
    name: "generate-docs",
    match: /generate.*doc|create.*doc/i,
    command: "doc:generate",
  },
  {
    name: "cache-status",
    match: /cache.*status|show.*cache/i,
    command: "cache:status",
  },
];
