// mcp-output-formatter.js - Minimal output formatting for MCP filesystem operations

/**
 * Format file operations with minimal output for display
 * while preserving full content for Claude
 */

// Emoji mapping for operations
const OPERATION_EMOJI = {
  read: '📖',
  write: '✏️',
  edit: '📝',
  list: '📁',
  search: '🔍',
  batch: '📚',
  delete: '🗑️',
  move: '📦',
  info: 'ℹ️',
  create: '📂'
};

/**
 * Convert path to clickable file:// URL
 */
export function makeClickable(path) {
  if (!path) return '';
  // Ensure absolute path and convert backslashes
  const absolutePath = path.startsWith('/') ? path : `/${path}`;
  return `file://${absolutePath.replace(/\\/g, '/')}`;
}

/**
 * Format file size in human readable format
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

/**
 * Count lines in content
 */
export function countLines(content) {
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * Create minimal summary for read operations
 */
export function formatReadSummary(path, content, stats = {}) {
  const lines = countLines(content);
  const size = formatSize(Buffer.byteLength(content, 'utf8'));
  const cached = stats.cached ? ' (cached ⚡)' : '';
  const time = stats.time || 'N/A';
  
  return [
    `${OPERATION_EMOJI.read} Read: ${makeClickable(path)}`,
    `✅ ${lines} lines • ${size} • ${time}ms${cached}`
  ].join('\n');
}

/**
 * Create minimal summary for write operations
 */
export function formatWriteSummary(path, content, stats = {}) {
  const lines = countLines(content);
  const size = formatSize(Buffer.byteLength(content, 'utf8'));
  const time = stats.time || 'N/A';
  
  // Extract first meaningful lines for summary
  const contentLines = content.split('\n').filter(line => line.trim());
  const summary = generateContentSummary(contentLines);
  
  return [
    `${OPERATION_EMOJI.write} Write: ${makeClickable(path)}`,
    `✅ Created • ${lines} lines • ${size} • ${time}ms`,
    '',
    'Summary: ' + summary.type,
    summary.items.map(item => `• ${item}`).join('\n')
  ].join('\n');
}

/**
 * Create minimal summary for edit operations
 */
export function formatEditSummary(path, edits, stats = {}) {
  const time = stats.time || 'N/A';
  const cached = stats.cachedRead ? ' (cached read ⚡)' : '';
  
  const changes = edits.map((edit, i) => {
    const oldPreview = edit.oldText.length > 30 
      ? `"${edit.oldText.substring(0, 30)}..."` 
      : `"${edit.oldText}"`;
    const newPreview = edit.newText.length > 30 
      ? `"${edit.newText.substring(0, 30)}..."` 
      : `"${edit.newText}"`;
    
    if (edit.oldText && edit.newText) {
      return `• Line ${stats.lines?.[i] || '?'}: ${oldPreview} → ${newPreview}`;
    } else if (edit.oldText) {
      return `- Line ${stats.lines?.[i] || '?'}: Removed ${oldPreview}`;
    } else {
      return `+ Line ${stats.lines?.[i] || '?'}: Added ${newPreview}`;
    }
  });
  
  return [
    `${OPERATION_EMOJI.edit} Edit: ${makeClickable(path)}`,
    `✅ ${edits.length} changes • ${time}ms${cached}`,
    '',
    'Changes:',
    ...changes
  ].join('\n');
}

/**
 * Create minimal summary for list directory operations
 */
export function formatListSummary(path, entries, stats = {}) {
  const files = entries.filter(e => !e.isDirectory).length;
  const dirs = entries.filter(e => e.isDirectory).length;
  const time = stats.time || 'N/A';
  
  return [
    `${OPERATION_EMOJI.list} List: ${makeClickable(path)}`,
    `✅ ${files} files • ${dirs} dirs • ${time}ms`,
    '',
    '[Truncated - use --verbose for full list]'
  ].join('\n');
}

/**
 * Create minimal summary for search operations
 */
export function formatSearchSummary(pattern, path, results, stats = {}) {
  const time = stats.time || 'N/A';
  const fileCount = results.length;
  
  // Group by file and count matches
  const topFiles = results.slice(0, 3).map(file => {
    const matches = stats.matchCounts?.[file] || 1;
    return `• ${makeClickable(file)} (${matches})`;
  });
  
  return [
    `${OPERATION_EMOJI.search} Search: "${pattern}" in ${path}`,
    `✅ ${results.length} matches • ${fileCount} files • ${time}ms`,
    '',
    ...topFiles,
    results.length > 3 ? `... and ${results.length - 3} more files` : ''
  ].filter(line => line).join('\n');
}

/**
 * Create minimal summary for batch read operations
 */
export function formatBatchReadSummary(files, results, errors, stats = {}) {
  // Handle different call signatures
  if (arguments.length === 1 && typeof files === 'object' && !Array.isArray(files)) {
    // Called with single object parameter (legacy)
    results = files;
    files = Object.keys(results);
    errors = {};
  }
  
  results = results || {};
  errors = errors || {};
  
  const successful = Object.keys(results).length;
  const failed = Object.keys(errors).length;
  const total = files.length;
  const time = stats.time || 'N/A';
  
  let totalLines = 0;
  let totalSize = 0;
  let cachedCount = 0;
  
  const fileDetails = Object.entries(results).map(([path, content]) => {
    const lines = countLines(content);
    const size = Buffer.byteLength(content, 'utf8');
    totalLines += lines;
    totalSize += size;
    
    const cached = stats.cached?.[path] ? ' ⚡' : '';
    if (cached) cachedCount++;
    
    return `• ${makeClickable(path)} (${lines} lines)${cached}`;
  });
  
  const cacheInfo = cachedCount > 0 ? `\n\n⚡ = cached (${cachedCount}/${successful} files from cache)` : '';
  
  const truncatedInfo = truncated > 0 ? `⚠️ ${truncated} files truncated to limit` : '';
  
  return [
    `${OPERATION_EMOJI.batch} Batch Read: ${total} files`,
    `✅ ${successful}/${total} success • ${totalLines} lines • ${formatSize(totalSize)} • ${time}ms`,
    truncatedInfo,
    '',
    ...fileDetails.slice(0, 10),
    fileDetails.length > 10 ? `... and ${fileDetails.length - 10} more files` : '',
    cacheInfo
  ].filter(line => line).join('\n');
}

/**
 * Generate smart content summary
 */
function generateContentSummary(lines) {
  // Detect file type and generate appropriate summary
  const firstLines = lines.slice(0, 10).join('\n').toLowerCase();
  
  if (firstLines.includes('import react') || firstLines.includes('from react')) {
    return {
      type: 'React component',
      items: extractReactFeatures(lines)
    };
  } else if (firstLines.includes('export function') || firstLines.includes('export async function')) {
    return {
      type: 'JavaScript module',
      items: extractExportedFunctions(lines)
    };
  } else if (firstLines.includes('#!/usr/bin/env node')) {
    return {
      type: 'Node.js script',
      items: extractScriptFeatures(lines)
    };
  } else if (firstLines.includes('{') && firstLines.includes('"')) {
    return {
      type: 'JSON data',
      items: extractJsonKeys(lines)
    };
  } else {
    return {
      type: 'Text file',
      items: [`${lines.length} lines of content`]
    };
  }
}

function extractReactFeatures(lines) {
  const features = [];
  const content = lines.join('\n');
  
  if (content.includes('useState')) features.push('Uses state hooks');
  if (content.includes('useEffect')) features.push('Uses effect hooks');
  if (content.includes('export default')) features.push('Default export component');
  
  return features.slice(0, 3);
}

function extractExportedFunctions(lines) {
  const exports = [];
  for (const line of lines) {
    const match = line.match(/export\s+(async\s+)?function\s+(\w+)/);
    if (match) {
      exports.push(`Exports ${match[2]}()`);
    }
  }
  return exports.slice(0, 3);
}

function extractScriptFeatures(lines) {
  const features = [];
  const content = lines.join('\n');
  
  if (content.includes('import')) features.push('ES6 module imports');
  if (content.includes('async function')) features.push('Async operations');
  if (content.includes('process.argv')) features.push('CLI arguments');
  
  return features.slice(0, 3);
}

function extractJsonKeys(lines) {
  try {
    const content = lines.join('\n');
    const json = JSON.parse(content);
    return Object.keys(json).slice(0, 3).map(key => `Key: "${key}"`);
  } catch {
    return ['Invalid or complex JSON'];
  }
}

/**
 * Format error messages
 */
export function formatError(operation, error, path) {
  return [
    `${OPERATION_EMOJI[operation] || '❌'} ${operation}: ${makeClickable(path)}`,
    `❌ Error: ${error.message}`
  ].join('\n');
}