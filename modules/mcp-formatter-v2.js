// mcp-formatter-v2.js - Beautiful terminal output for MCP operations

/**
 * ANSI color codes for terminal formatting
 */
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

/**
 * Box drawing characters
 */
const BOX = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  cross: '┼',
  teeDown: '┬',
  teeUp: '┴',
  teeRight: '├',
  teeLeft: '┤',
};

/**
 * Check if terminal supports colors
 */
const supportsColor = process.env.TERM !== 'dumb' && !process.env.NO_COLOR;

/**
 * Apply color to text
 */
function color(text, ...colors) {
  if (!supportsColor) return text;
  return colors.join('') + text + COLORS.reset;
}

/**
 * Create a horizontal line
 */
function createLine(length = 50, char = BOX.horizontal) {
  return char.repeat(length);
}

/**
 * Format file path for display
 */
function formatPath(fullPath) {
  if (!fullPath) return '';
  
  // Extract just filename
  const parts = fullPath.split(/[/\\]/);
  const filename = parts[parts.length - 1];
  
  // Get directory (last 2 parts)
  const dirParts = parts.slice(-3, -1);
  const shortDir = dirParts.length > 0 ? `.../${dirParts.join('/')}/` : '';
  
  return {
    filename,
    shortDir,
    full: fullPath
  };
}

/**
 * Format file size
 */
function formatSize(bytes) {
  if (bytes === 0) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

/**
 * Count lines in content
 */
function countLines(content) {
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * Create status line
 */
function createStatusLine(success, details) {
  const icon = success ? '✅' : '❌';
  const colorFn = success ? COLORS.green : COLORS.red;
  return color(`${icon} ${details}`, colorFn);
}

/**
 * Format read operation
 */
export function formatReadOperation(path, content, stats = {}) {
  const pathInfo = formatPath(path);
  const lines = countLines(content);
  const size = formatSize(Buffer.byteLength(content, 'utf8'));
  const time = stats.time || 0;
  const cached = stats.cached ? ' • cached ⚡' : '';
  
  const output = [
    // Header
    color(`📖 Reading ${pathInfo.filename}`, COLORS.bold),
    color(createLine(50), COLORS.dim),
    
    // Status
    createStatusLine(true, `${lines} lines • ${size} • ${time}ms${cached}`),
    
    // Path info (if needed)
    pathInfo.shortDir ? color(`📍 ${pathInfo.shortDir}`, COLORS.cyan, COLORS.dim) : '',
    
    // Blank line before content
    ''
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Format write operation
 */
export function formatWriteOperation(path, content, stats = {}) {
  const pathInfo = formatPath(path);
  const lines = countLines(content);
  const size = formatSize(Buffer.byteLength(content, 'utf8'));
  const time = stats.time || 0;
  
  // Analyze content type
  const contentType = detectContentType(path, content);
  
  const output = [
    // Header
    color('💾 Created new file', COLORS.bold),
    color(createLine(50), COLORS.dim),
    
    // File info
    color(`📄 ${pathInfo.filename}`, COLORS.cyan),
    createStatusLine(true, `${lines} lines • ${size} • ${time}ms`),
    '',
    
    // Content type
    color('Type: ' + contentType.name, COLORS.bold),
    ...contentType.features.map(f => color(`• ${f}`, COLORS.gray))
  ].join('\n');
  
  return output;
}

/**
 * Format edit operation  
 */
export function formatEditOperation(path, edits, stats = {}) {
  const pathInfo = formatPath(path);
  const time = stats.time || 0;
  const changeCount = edits.length;
  
  // Create change box
  const changeBox = createChangeBox(edits);
  
  const output = [
    // Header
    color('✏️ File updated successfully', COLORS.bold),
    color(createLine(50), COLORS.dim),
    
    // File info
    color(`📄 ${pathInfo.filename}`, COLORS.cyan),
    createStatusLine(true, `${changeCount} changes applied • ${time}ms`),
    '',
    
    // Changes
    color('Changes made:', COLORS.bold),
    changeBox
  ].join('\n');
  
  return output;
}

/**
 * Format list directory operation
 */
export function formatListOperation(path, entries, stats = {}) {
  const pathInfo = formatPath(path);
  const time = stats.time || 0;
  
  // Separate files and dirs
  const files = entries.filter(e => typeof e.isDirectory === 'function' ? !e.isDirectory() : !e.isDirectory);
  const dirs = entries.filter(e => typeof e.isDirectory === 'function' ? e.isDirectory() : e.isDirectory);
  
  // Truncate if too many
  const maxShow = 5;
  const filesShown = files.slice(0, maxShow);
  const dirsShown = dirs.slice(0, maxShow);
  
  const output = [
    // Header
    color('📁 Directory Contents', COLORS.bold),
    color(createLine(50), COLORS.dim),
    
    // Path
    color(`📍 ${pathInfo.full}`, COLORS.cyan),
    createStatusLine(true, `${files.length} files • ${dirs.length} directories • ${time}ms`),
    '',
    
    // Files section
    files.length > 0 ? color('Files:', COLORS.bold) : '',
    ...filesShown.map(f => {
      const sizeStr = f.size !== undefined ? ` ${color(`(${formatSize(f.size)})`, COLORS.gray)}` : '';
      return `  📄 ${color(f.name, COLORS.white)}${sizeStr}`;
    }),
    files.length > maxShow ? color(`  ... and ${files.length - maxShow} more files`, COLORS.dim) : '',
    '',
    
    // Dirs section  
    dirs.length > 0 ? color('Directories:', COLORS.bold) : '',
    ...dirsShown.map(d => `  📁 ${color(d.name + '/', COLORS.blue)}`),
    dirs.length > maxShow ? color(`  ... and ${dirs.length - maxShow} more directories`, COLORS.dim) : ''
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Format search operation
 */
export function formatSearchOperation(pattern, basePath, results, stats = {}) {
  const time = stats.time || 0;
  const maxShow = 10;
  const shown = results.slice(0, maxShow);
  
  const output = [
    // Header
    color(`🔍 Search Results for "${pattern}"`, COLORS.bold),
    color(createLine(50), COLORS.dim),
    
    // Status
    color(`📍 ${basePath}`, COLORS.cyan),
    createStatusLine(results.length > 0, `${results.length} matches found • ${time}ms`),
    '',
    
    // Results
    ...shown.map(result => {
      const pathInfo = formatPath(result);
      return `  📄 ${color(pathInfo.filename, COLORS.green)} ${color(pathInfo.shortDir, COLORS.gray, COLORS.dim)}`;
    }),
    results.length > maxShow ? color(`  ... and ${results.length - maxShow} more matches`, COLORS.dim) : ''
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Format error
 */
/**
 * Format batch read operation
 */
export function formatBatchReadOperation(paths, results, errors, stats = {}) {
  const time = stats.time || 0;
  const successful = Object.keys(results).length;
  const failed = Object.keys(errors).length;
  const total = paths.length;
  const truncated = stats.truncated || 0;
  
  const output = [
    // Header
    color('📚 Reading Multiple Files', COLORS.bold),
    color(createLine(50), COLORS.dim),
    
    // Status
    createStatusLine(failed === 0, `${successful}/${total} files read • ${time}ms`),
    truncated > 0 ? color(`⚠️  ${truncated} files truncated to limit`, COLORS.yellow) : '',
    '',
    
    // File summaries
    color('Files read:', COLORS.bold),
    ...Object.entries(results).slice(0, 10).map(([path, content]) => {
      const pathInfo = formatPath(path);
      const lines = countLines(content);
      const size = formatSize(Buffer.byteLength(content, 'utf8'));
      return `  📄 ${color(pathInfo.filename, COLORS.green)} ${color(`(${lines} lines, ${size})`, COLORS.gray)}`;
    }),
    Object.keys(results).length > 10 ? color(`  ... and ${Object.keys(results).length - 10} more files`, COLORS.dim) : '',
    
    // Errors
    failed > 0 ? '' : '',
    failed > 0 ? color('Failed:', COLORS.red, COLORS.bold) : '',
    ...Object.entries(errors).slice(0, 5).map(([path, error]) => {
      const pathInfo = formatPath(path);
      return `  ❌ ${color(pathInfo.filename, COLORS.red)} - ${error.message}`;
    })
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Format file info operation
 */
export function formatInfoOperation(path, info, stats = {}) {
  const pathInfo = formatPath(path);
  const time = stats.time || 0;
  
  const output = [
    // Header
    color('ℹ️  File Information', COLORS.bold),
    color(createLine(50), COLORS.dim),
    
    // File
    color(`📄 ${pathInfo.filename}`, COLORS.cyan),
    color(`📍 ${pathInfo.full}`, COLORS.gray, COLORS.dim),
    '',
    
    // Details
    color('Details:', COLORS.bold),
    `  Type: ${info.type}`,
    `  Size: ${formatSize(info.size)}`,
    `  Modified: ${new Date(info.modified).toLocaleString()}`,
    `  Permissions: ${info.permissions}`,
    '',
    
    createStatusLine(true, `Retrieved in ${time}ms`)
  ].join('\n');
  
  return output;
}

export function formatError(operation, error, path) {
  const pathInfo = formatPath(path);
  
  const output = [
    // Header
    color(`❌ ${operation} failed`, COLORS.bold, COLORS.red),
    color(createLine(50), COLORS.dim),
    
    // File (if applicable)
    path ? color(`📄 ${pathInfo.filename}`, COLORS.cyan) : '',
    
    // Error
    color('Error: ' + error.message, COLORS.red),
    
    // Help text
    '',
    color('💡 Suggestions:', COLORS.yellow),
    ...getErrorSuggestions(error).map(s => color(`  • ${s}`, COLORS.gray))
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Create a box for changes
 */
function createChangeBox(edits) {
  const maxWidth = 50;
  const changes = edits.slice(0, 5).map(edit => {
    const line = edit.line || '?';
    const old = edit.oldText.substring(0, 15) + (edit.oldText.length > 15 ? '...' : '');
    const new_ = edit.newText.substring(0, 15) + (edit.newText.length > 15 ? '...' : '');
    return `Line ${line}: "${old}" → "${new_}"`;
  });
  
  // Create box
  const lines = [
    BOX.topLeft + createLine(maxWidth - 2, BOX.horizontal) + BOX.topRight,
    ...changes.map(change => {
      const padded = change.padEnd(maxWidth - 4);
      return BOX.vertical + ' ' + padded + ' ' + BOX.vertical;
    }),
    BOX.bottomLeft + createLine(maxWidth - 2, BOX.horizontal) + BOX.bottomRight
  ];
  
  return lines.join('\n');
}

/**
 * Detect content type from filename and content
 */
function detectContentType(path, content) {
  const ext = path.split('.').pop().toLowerCase();
  const lines = content.split('\n').slice(0, 20); // Check first 20 lines
  
  const features = [];
  let type = 'Text file';
  
  // JavaScript/TypeScript
  if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
    type = ext === 'ts' || ext === 'tsx' ? 'TypeScript' : 'JavaScript';
    
    if (lines.some(l => l.includes('import ') || l.includes('export '))) {
      features.push('ES6 module imports');
    }
    if (lines.some(l => l.includes('async ') || l.includes('await '))) {
      features.push('Async operations');
    }
    if (lines.some(l => l.includes('class '))) {
      features.push('Class definitions');
    }
  }
  
  // JSON
  else if (ext === 'json') {
    type = 'JSON configuration';
    try {
      const parsed = JSON.parse(content);
      if (parsed.dependencies) features.push('Package dependencies');
      if (parsed.scripts) features.push('NPM scripts');
      if (parsed.devDependencies) features.push('Dev dependencies');
    } catch (e) {
      features.push('Invalid JSON');
    }
  }
  
  // Markdown
  else if (ext === 'md') {
    type = 'Markdown document';
    if (lines.some(l => l.startsWith('# '))) features.push('Headers');
    if (lines.some(l => l.includes('```'))) features.push('Code blocks');
    if (lines.some(l => l.match(/\[.*\]\(.*\)/))) features.push('Links');
  }
  
  // Default
  if (features.length === 0) {
    features.push(`${lines.length} lines of content`);
  }
  
  return { name: type, features };
}

/**
 * Get error suggestions
 */
function getErrorSuggestions(error) {
  const msg = error.message.toLowerCase();
  const suggestions = [];
  
  if (msg.includes('not found') || msg.includes('enoent')) {
    suggestions.push('Check if the file path is correct');
    suggestions.push('Ensure the file exists');
  } else if (msg.includes('permission') || msg.includes('eacces')) {
    suggestions.push('Check file permissions');
    suggestions.push('Try running with appropriate privileges');
  } else if (msg.includes('already exists') || msg.includes('eexist')) {
    suggestions.push('Use a different filename');
    suggestions.push('Delete the existing file first');
  } else {
    suggestions.push('Check the error message for details');
    suggestions.push('Verify the operation parameters');
  }
  
  return suggestions;
}