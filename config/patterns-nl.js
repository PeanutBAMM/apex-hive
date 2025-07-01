// patterns-nl.js - Dutch natural language patterns

export default [
  // Recipe triggers
  {
    name: "commit-en-push-nl",
    match: /commit.*push|alles.*pushen/i,
    recipe: "commit-push",
  },
  {
    name: "fix-de-ci-nl",
    match: /fix\s+de\s+ci|ci.*kapot|build.*gefaald/i,
    recipe: "fix-ci",
  },
  {
    name: "ruim-code-op-nl",
    match: /ruim.*code.*op|code.*opruimen|maak.*schoon/i,
    recipe: "clean-code",
  },
  {
    name: "start-mijn-dag-nl",
    match: /start.*dag|begin.*dag|goedemorgen/i,
    recipe: "start-day",
  },
  {
    name: "einde-dag-nl",
    match: /einde.*dag|klaar.*vandaag|stop.*werken/i,
    recipe: "end-day",
  },
  {
    name: "wat-is-kapot-nl",
    match: /wat.*kapot|wat.*stuk|toon.*problemen/i,
    command: "detect-issues",
  },
  {
    name: "repareer-nl",
    match: /^fix$|^repareer$/i,
    recipe: "fix",
  },

  // Direct command patterns
  {
    name: "zoek-naar-nl",
    match: /zoek\s+(?:naar\s+)?(.+)/i,
    handler: (match) => ({
      command: "search",
      args: { query: match[1].trim() },
    }),
  },
  {
    name: "vind-bestanden-nl",
    match: /vind\s+(?:alle\s+)?(\S+)\s+bestanden/i,
    handler: (match) => ({
      command: "find",
      args: { pattern: match[1] },
    }),
  },
  {
    name: "lees-bestand-nl",
    match: /lees\s+(?:bestand\s+)?(.+)/i,
    handler: (match) => ({
      command: "read",
      args: { path: match[1].trim() },
    }),
  },
  {
    name: "draai-tests-nl",
    match: /draai.*test|test.*alles/i,
    command: "test",
  },
  {
    name: "toon-status-nl",
    match: /toon.*status|laat.*status.*zien/i,
    command: "git:status",
  },
  {
    name: "genereer-docs-nl",
    match: /genereer.*doc|maak.*documentatie/i,
    command: "doc:generate",
  },
  {
    name: "help-nl",
    match: /help|hulp/i,
    command: "help",
  },
  {
    name: "cache-status-nl",
    match: /cache.*status|toon.*cache/i,
    command: "cache:status",
  },
  {
    name: "sla-gesprek-op-nl",
    match: /sla.*gesprek.*op|bewaar.*gesprek|bewaar.*conversatie|save.*conversation/i,
    command: "save-conversation",
  },
  {
    name: "onthoud-dit-nl",
    match: /onthoud.*dit|remember.*this|bewaar.*dit/i,
    command: "save-conversation",
  },
];
