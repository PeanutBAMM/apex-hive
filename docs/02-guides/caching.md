# Caching Guide

## 🚀 Overview

Apex Hive uses a unified file-based cache system that provides persistent, high-performance caching across MCP server restarts and Claude sessions. This guide covers everything you need to know about the cache system.

## 📦 Cache Architecture

### Storage Location
- **Base Directory**: `~/.apex-cache/`
- **Namespace Directories**:
  - `~/.apex-cache/commands/` - Command execution results
  - `~/.apex-cache/files/` - File contents
  - `~/.apex-cache/search/` - Search results

### Cache Namespaces

| Namespace | TTL | Purpose | Size Limit |
|-----------|-----|---------|------------|
| commands | 5 minutes | Command outputs | 100MB |
| files | 10 minutes | File contents | 100MB |
| search | 30 minutes | Search results | 100MB |

### Key Features
- **Persistence**: Survives MCP restarts and Claude sessions
- **Atomic Operations**: No corruption on crashes
- **Automatic Expiration**: TTL-based cleanup
- **Hit Tracking**: Performance metrics
- **Size Management**: Per-namespace limits

## 🔍 Using the Cache

### Monitor Cache Status

```bash
# Basic status overview
apex cache:status

# Detailed view with top items
apex cache:status --detailed

# Output example:
{
  "totalCaches": 3,
  "totalItems": 42,
  "totalSize": "15.7 MB",
  "totalHits": 237,
  "averageHitRate": "5.64"
}
```

### Warm the Cache

#### README Files
Pre-cache README files for instant access:

```bash
apex cache:warm-readmes

# This caches all README files for 24 hours
# Useful for documentation-heavy workflows
```

#### High-Value Documentation  
Pre-cache critical documentation files for development:

```bash
apex cache:warm-docs

# Caches 8 high-value documentation files:
# - commands-reference.md
# - architecture.md  
# - troubleshooting.md
# - development.md
# - caching.md
# - natural-language.md
# - recipes.md
# - getting-started.md
```

#### Complete Cache Warming
Warm both READMEs and documentation (recommended):

```bash
apex cache:warm-all

# Combines both README and documentation warming
# Used by automated daily cron job at 08:00 CET
```

### Clear Cache

```bash
# Clear all caches
apex cache:clear

# Clear specific namespace (future feature)
apex cache:clear --namespace search
```

## 🕰️ Automated Cache System

### Daily Cache Warming

The enhanced cache system automatically refreshes cache daily:

- **Schedule**: Every day at 08:00 CET  
- **Command**: `apex cache:warm-all`
- **Coverage**: 
  - All README files across the project
  - 8 high-value documentation files
- **Logging**: Operations logged to `~/.apex-cache/cron.log`

### Cron Job Details

```bash
# View current cron configuration
crontab -l

# Expected entry:
0 8 * * * /path/to/apex-hive/scripts/cache-cron-warm.sh >/dev/null 2>&1

# Check cron log for issues
tail -f ~/.apex-cache/cron.log
```

### Manual Cache Refresh

```bash
# Trigger immediate cache refresh
apex cache:warm-all

# Check if cache warming succeeded
apex cache:status
```

## 📊 Performance Benefits

### Speed Improvements
- **File reads**: Up to 495x faster for cached files
- **Search results**: Instant for repeated queries
- **Command outputs**: No re-execution needed

### Example Performance
```bash
# First run (cache miss): ~200ms
apex search "authenticate"

# Second run (cache hit): <5ms
apex search "authenticate"
```

## 🛠️ Cache Integration

### How Commands Use Cache

#### File Operations
```javascript
// Automatically cached
apex read README.md      // First read: from disk
apex read README.md      // Second read: from cache (495x faster)
```

#### Search Operations
```javascript
// Search results cached for 30 minutes
apex search "function"   // First search: runs ripgrep
apex search "function"   // Within 30min: from cache
```

### Bypass Cache

When you need fresh data:
```bash
# Bypass cache for this command
APEX_NO_CACHE=true apex search "latest"

# Or use --no-cache flag (where supported)
apex read file.js --no-cache
```

## 📈 Monitoring Performance

### Check Hit Rates

```bash
# See how well cache is performing
apex cache:status --detailed | grep hitRate

# Good hit rates:
# - files: >70% (working set of files)
# - search: >50% (repeated searches)
# - commands: >30% (repeated commands)
```

### Debug Cache Issues

```bash
# Check if cache directory exists
ls -la ~/.apex-cache/

# See cache file structure
find ~/.apex-cache -type f | head -20

# Check specific namespace size
du -sh ~/.apex-cache/files/
```

## 🔧 Advanced Usage

### Cache File Structure

Each cached item creates two files:
```
~/.apex-cache/files/
├── a1b2c3d4e5f6.cache      # Cached content (JSON)
└── a1b2c3d4e5f6.cache.meta # Metadata (expiry, hits, size)
```

### Manual Cache Inspection

```bash
# View cache metadata
cat ~/.apex-cache/files/*.meta | jq .

# See most accessed items
find ~/.apex-cache -name "*.meta" -exec cat {} \; | \
  jq -s 'sort_by(.hits) | reverse | .[0:5]'
```

### TTL Customization

Special cases with custom TTLs:
- README files: 24 hours (via cache:warm-readmes)
- System files: Extended TTL for stability
- Search results: 30 minutes for expensive operations

## 🚨 Troubleshooting

### Cache Not Working

1. **Check directory exists**:
   ```bash
   ls -la ~/.apex-cache/
   ```

2. **Verify permissions**:
   ```bash
   # Should be readable/writable by user
   ls -la ~/apex-cache/
   ```

3. **Check disk space**:
   ```bash
   df -h ~
   ```

### Low Hit Rate

1. **Pre-warm important files**:
   ```bash
   apex cache:warm-readmes
   ```

2. **Check TTL expiration**:
   ```bash
   apex cache:status --detailed
   ```

3. **Verify cache is being used**:
   ```bash
   # Run same command twice
   apex search "test" && apex cache:status | grep hits
   ```

### Clear Corrupted Cache

```bash
# Nuclear option - remove everything
rm -rf ~/.apex-cache/

# Cache will recreate automatically
apex cache:status
```

## 📋 Best Practices

1. **Regular Monitoring**: Check `apex cache:status` weekly
2. **Pre-warm on Start**: Run `apex cache:warm-readmes` in morning
3. **Don't Over-clear**: Let TTL handle expiration naturally
4. **Watch Disk Usage**: Monitor `~/.apex-cache/` size
5. **Use for Workflows**: Cache helps most with repetitive tasks

## 🔮 Future Enhancements

Planned improvements:
- Compression for large items
- Configurable TTLs per pattern
- Cache sharing between team members
- Remote cache support (Redis/Memcached)
- Smart eviction policies (LFU)

---

*The cache system is designed to be invisible during normal use - it just makes everything faster!*