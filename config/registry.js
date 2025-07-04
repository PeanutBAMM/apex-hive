// registry.js - Script registry (61 scripts total)

export default {
  // CI Scripts (6)
  "ci:monitor": "./scripts/ci-monitor.js",
  "ci:parse": "./scripts/ci-parse.js",
  "ci:fix": "./scripts/ci-fix.js",
  "ci:heal": "./scripts/ci-heal.js",
  "ci:watch": "./scripts/ci-watch.js",
  "ci:smart-push": "./scripts/ci-smart-push.js",
  "ci:status": "./scripts/ci-status.js",

  // Documentation Scripts (14)
  "doc:generate": "./scripts/doc-generate.js",
  "doc:generate-changed": "./scripts/doc-generate-changed.js",
  "doc:generate-missing": "./scripts/doc-generate-missing.js",
  "doc:update": "./scripts/doc-update.js",
  "doc:update-readme": "./scripts/doc-update-readme.js",
  "doc:validate": "./scripts/doc-validate.js",
  "doc:validate-links": "./scripts/doc-validate-links.js",
  "doc:fix-links": "./scripts/doc-fix-links.js",
  "doc:organize": "./scripts/doc-organize.js",
  "doc:cleanup": "./scripts/doc-cleanup.js",
  "doc:sync": "./scripts/doc-sync.js",
  "doc:search": "./scripts/doc-search.js",
  "doc:post-merge": "./scripts/doc-post-merge.js",
  "doc:check": "./scripts/doc-check.js",
  "doc:cleanup-prefixes": "./scripts/doc-cleanup-prefixes.js",

  // Quality Scripts (8)
  "quality:lint": "./scripts/quality-lint.js",
  "quality:fix-versions": "./scripts/quality-fix-versions.js",
  "quality:console-clean": "./scripts/quality-console-clean.js",
  "quality:fix-all": "./scripts/quality-fix-all.js",
  "quality:validate": "./scripts/quality-validate.js",
  "quality:format": "./scripts/quality-format.js",
  "quality:setup": "./scripts/quality-setup.js",
  "quality:check": "./scripts/quality-check.js",

  // Backlog Scripts (5)
  "backlog:analyze": "./scripts/backlog-analyze.js",
  "backlog:score": "./scripts/backlog-score.js",
  "backlog:sync": "./scripts/backlog-sync.js",
  "backlog:display": "./scripts/backlog-display.js",
  "backlog:table": "./scripts/backlog-table.js",


  // Git Scripts (8)
  "git:commit": "./scripts/git-commit.js",
  "git:push": "./scripts/git-push.js",
  "git:status": "./scripts/git-status.js",
  "git:pull": "./scripts/git-pull.js",
  "git:tag": "./scripts/git-tag.js",
  "git:push-tags": "./scripts/git-push-tags.js",
  "git:init": "./scripts/git-init.js",
  "git:branch": "./scripts/git-branch.js",

  // Core Scripts (8)
  init: "./scripts/init-project.js",
  build: "./scripts/build.js",
  test: "./scripts/test-runner.js",
  "test:run": "./scripts/test-runner.js", // Alias
  "test:setup": "./scripts/test-setup.js",
  search: "./scripts/search.js",
  "save-conversation": "./scripts/save-conversation.js",
  code: "./scripts/code-stub.js",

  // Deployment Scripts (4)
  deploy: "./scripts/deploy.js",
  "version:bump": "./scripts/version-bump.js",
  "changelog:generate": "./scripts/changelog-generate.js",
  release: "./scripts/release.js",

  // Detection Scripts (3)
  "detect-issues": "./scripts/detect-issues.js",
  "fix-detected": "./scripts/fix-detected.js",
  report: "./scripts/report-status.js",

  // Cache Scripts (8)
  "cache:warm-readmes": "./scripts/cache-warm-readmes.js",
  "cache:warm-docs": "./scripts/cache-warm-docs.js",
  "cache:warm-conversations": "./scripts/cache-warm-conversations.js",
  "cache:warm-scripts": "./scripts/cache-warm-scripts.js",
  "cache:warm-all": "./scripts/cache-warm-all.js",
  "cache:clear": "./scripts/cache-clear.js",
  "cache:status": "./scripts/cache-status.js",

  // Context Scripts (1)
  "startup-context": "./scripts/startup-context.js",

  // Workflow Helpers (2)
  commit: "./scripts/git-commit.js", // Alias
  push: "./scripts/ci-smart-push.js", // Smart push with CI monitoring

  // Help command (special)
  help: null, // Handled by router directly
};
