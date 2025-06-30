# Commands Reference

Complete reference for all 60+ Apex Hive commands.

## 📋 Command Categories

### CI/CD Commands (7)
| Command | Description | Example |
|---------|-------------|---------|
| `ci:monitor` | Monitor GitHub Actions CI status in real-time | `apex ci:monitor` |
| `ci:parse` | Parse CI logs for errors and warnings | `apex ci:parse` |
| `ci:fix` | Auto-fix common CI issues | `apex ci:fix` |
| `ci:heal` | Self-healing CI system | `apex ci:heal` |
| `ci:watch` | Watch CI runs and notify | `apex ci:watch` |
| `ci:smart-push` | Intelligent git push with CI monitoring | `apex ci:smart-push` |
| `ci:status` | Comprehensive CI status report | `apex ci:status` |

### Documentation Commands (15)
| Command | Description | Example |
|---------|-------------|---------|
| `doc:generate` | Generate documentation for changed files | `apex doc:generate` |
| `doc:generate-changed` | Generate docs only for recently changed files | `apex doc:generate-changed` |
| `doc:generate-missing` | Generate documentation for files without docs | `apex doc:generate-missing` |
| `doc:update` | Update existing documentation | `apex doc:update` |
| `doc:update-readme` | Update README files automatically | `apex doc:update-readme` |
| `doc:validate` | Validate documentation structure | `apex doc:validate` |
| `doc:validate-xml` | Validate XML documentation tags | `apex doc:validate-xml` |
| `doc:validate-links` | Check all documentation links | `apex doc:validate-links` |
| `doc:fix-links` | Fix broken documentation links | `apex doc:fix-links` |
| `doc:organize` | Organize documentation files | `apex doc:organize` |
| `doc:sync` | Sync documentation structure | `apex doc:sync` |
| `doc:add-xml` | Add XML documentation tags | `apex doc:add-xml` |
| `doc:search` | Search through documentation | `apex doc:search "query"` |
| `doc:post-merge` | Run documentation tasks after merge | `apex doc:post-merge` |
| `doc:check` | Check documentation status | `apex doc:check` |

### Quality Control (8)
| Command | Description | Example |
|---------|-------------|---------|
| `quality:lint` | Run linting checks | `apex quality:lint` |
| `quality:fix-versions` | Fix dependency version issues | `apex quality:fix-versions` |
| `quality:console-clean` | Remove console.log statements | `apex quality:console-clean` |
| `quality:fix-all` | Fix all auto-fixable issues | `apex quality:fix-all` |
| `quality:validate` | Validate code quality metrics | `apex quality:validate` |
| `quality:format` | Format code according to standards | `apex quality:format` |
| `quality:setup` | Setup quality tools | `apex quality:setup` |
| `quality:check` | Run comprehensive quality checks | `apex quality:check` |

### Backlog Management (5)
| Command | Description | Example |
|---------|-------------|---------|
| `backlog:analyze` | Analyze backlog items and priorities | `apex backlog:analyze` |
| `backlog:score` | Score backlog items by importance | `apex backlog:score` |
| `backlog:sync` | Sync backlog with project tools | `apex backlog:sync` |
| `backlog:display` | Display backlog in visual format | `apex backlog:display` |
| `backlog:table` | Show backlog as formatted table | `apex backlog:table` |

### XML Processing (3)
| Command | Description | Example |
|---------|-------------|---------|
| `xml:validate` | Validate XML files and structure | `apex xml:validate` |
| `xml:add` | Add XML content to files | `apex xml:add` |
| `xml:clean` | Clean and format XML files | `apex xml:clean` |

### Git Operations (8)
| Command | Description | Example |
|---------|-------------|---------|
| `git:commit` | Create smart git commit | `apex git:commit` |
| `git:push` | Push changes with safety checks | `apex git:push` |
| `git:status` | Enhanced git status | `apex git:status` |
| `git:pull` | Pull changes with conflict detection | `apex git:pull` |
| `git:tag` | Create and manage git tags | `apex git:tag v1.0.0` |
| `git:push-tags` | Push tags to remote | `apex git:push-tags` |
| `git:init` | Initialize git repository | `apex git:init` |
| `git:branch` | Manage git branches | `apex git:branch` |

### Core Commands (8)
| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize new Apex project | `apex init` |
| `build` | Build the project | `apex build` |
| `test` | Run test suite | `apex test` |
| `test:run` | Run test suite (alias) | `apex test:run` |
| `test:setup` | Setup test environment | `apex test:setup` |
| `search` | Search codebase using ripgrep | `apex search "pattern"` |
| `save-conversation` | Save AI conversation | `apex save-conversation` |
| `code` | Generate code stubs | `apex code` |

### Deployment (4)
| Command | Description | Example |
|---------|-------------|---------|
| `deploy` | Deploy application | `apex deploy` |
| `version:bump` | Bump version numbers | `apex version:bump` |
| `changelog:generate` | Generate CHANGELOG | `apex changelog:generate` |
| `release` | Complete release workflow | `apex release` |

### Detection & Reporting (3)
| Command | Description | Example |
|---------|-------------|---------|
| `detect-issues` | Detect all types of issues | `apex detect-issues` |
| `fix-detected` | Fix detected issues | `apex fix-detected` |
| `report` | Generate status report | `apex report` |

### Cache Management (3)
| Command | Description | Example |
|---------|-------------|---------|
| `cache:warm-readmes` | Pre-cache README files | `apex cache:warm-readmes` |
| `cache:clear` | Clear all caches | `apex cache:clear` |
| `cache:status` | Display cache statistics and status | `apex cache:status --detailed` |

### Aliases & Helpers (3)
| Command | Description | Example |
|---------|-------------|---------|
| `commit` | Quick commit (alias) | `apex commit` |
| `push` | Smart push (alias) | `apex push` |
| `help` | Show help | `apex help` |

## 🔧 Common Options

Most commands support these options:
- `--dry-run` - Preview changes without applying
- `--verbose` - Show detailed output
- `--force` - Skip confirmations
- `--help` - Show command-specific help

## 📊 Usage Examples

### Basic Usage
```bash
apex <command> [options]
```javascript

### With Arguments
```bash
apex search "authentication"
apex git:tag "v1.2.3"
apex doc:search "API reference"
```javascript

### With Options
```bash
apex ci:fix --dry-run
apex quality:fix-all --verbose
apex deploy --force
```javascript

### Natural Language
```bash
apex "fix the CI"
apex "search for user authentication"
apex "generate missing documentation"
```javascript

---

*Total Commands: 66*