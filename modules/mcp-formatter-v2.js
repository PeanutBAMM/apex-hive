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
 * Create compact status line with performance info inline
 */
function createStatusLine(success, details, performance = null) {
  const icon = success ? '✅' : '❌';
  const colorFn = success ? COLORS.green : COLORS.red;
  const perfText = performance ? ` • ${performance}` : '';
  return color(`${icon} ${details}${perfText}`, colorFn);
}

/**
 * Create compact one-line summary for operations
 */
function createCompactSummary(operation, details, performance = null) {
  const perfText = performance ? ` • ${performance}` : '';
  return `${color('✅', COLORS.green)} ${operation}${perfText} • ${color(details, COLORS.cyan)}`;
}

/**
 * Format read operation
 */
export function formatReadOperation(path, content, stats = {}) {
  const pathInfo = formatPath(path);
  const lines = countLines(content);
  const size = formatSize(Buffer.byteLength(content, 'utf8'));
  const time = stats.time || 0;
  const cacheHits = stats.cached ? 1 : 0;
  const diskReads = stats.cached ? 0 : 1;
  
  // Compact one-line summary
  const summary = createCompactSummary(
    'File read',
    `${pathInfo.filename}`,
    `${time}ms • ${color(`cache: ${cacheHits}`, COLORS.green)} / ${color(`disk: ${diskReads}`, COLORS.yellow)} • ${lines} lines • ${size}`
  );
  
  const output = [
    summary,
    
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
  
  // Compact one-line summary
  const summary = createCompactSummary(
    'Created new file',
    `${pathInfo.filename}`,
    `${lines} lines • ${size} • ${time}ms`
  );
  
  // Optional type info (only if interesting features)
  const typeInfo = contentType.features.length > 0 
    ? [`${color('Type:', COLORS.dim)} ${color(contentType.name, COLORS.cyan)}`,
       ...contentType.features.slice(0, 2).map(f => color(`• ${f}`, COLORS.gray))]
    : [];
  
  // Add content preview (truncated if too long)
  const maxPreviewLength = 150;
  let contentPreview = '';
  
  if (content && content.length > 0) {
    if (content.length > maxPreviewLength) {
      contentPreview = content.substring(0, maxPreviewLength).replace(/\n/g, ' ') + '...';
    } else {
      contentPreview = content.replace(/\n/g, ' ');
    }
  }
  
  const previewLine = contentPreview 
    ? [`${color('Content:', COLORS.dim)} ${contentPreview}`]
    : [];
  
  const output = [
    summary,
    ...typeInfo,
    ...previewLine
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Format edit operation  
 */
export function formatEditOperation(path, edits, stats = {}) {
  const pathInfo = formatPath(path);
  const time = stats.time || 0;
  const changeCount = edits.length;
  
  // Calculate line statistics
  let addedLines = 0;
  let removedLines = 0;
  
  edits.forEach(edit => {
    const oldLines = edit.oldText.split('\n').length;
    const newLines = edit.newText.split('\n').length;
    removedLines += oldLines;
    addedLines += newLines;
  });
  
  // Create change box
  const changeBox = createChangeBox(edits);
  
  // Compact one-line summary with Option B format
  const editStats = `${changeCount} edits (+${addedLines} lines, -${removedLines} lines)`;
  const summary = createCompactSummary(
    'File updated',
    `${pathInfo.filename}`,
    `${editStats} • ${time}ms`
  );
  
  // Show first few changes in compact format
  const compactChanges = edits.slice(0, 3).map(edit => {
    const line = edit.line || '?';
    const preview = edit.newText.substring(0, 30) + (edit.newText.length > 30 ? '...' : '');
    return `${color('Line', COLORS.dim)} ${color(line, COLORS.yellow)}: \"${preview}\"`;
  });
  
  const moreChanges = edits.length > 3 ? [`${color(`... and ${edits.length - 3} more changes`, COLORS.dim)}`] : [];
  
  const output = [
    summary,
    ...compactChanges,
    ...moreChanges
  ].filter(line => line !== '').join('\n');
  
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
  
  // Compact one-line summary
  const summary = createCompactSummary(
    'Directory contents',
    `${pathInfo.shortDir || pathInfo.filename}`,
    `${files.length} files, ${dirs.length} dirs • ${time}ms`
  );
  
  // Show first few items in compact format
  // maxShow already defined above
  const items = [
    ...filesShown.map(f => {
      const sizeStr = f.size !== undefined ? ` ${color(`(${formatSize(f.size)})`, COLORS.gray)}` : '';
      return `  📄 ${color(f.name, COLORS.white)}${sizeStr}`;
    }),
    ...dirsShown.map(d => `  📁 ${color(d.name + '/', COLORS.blue)}`)
  ];
  
  const totalHidden = (files.length - filesShown.length) + (dirs.length - dirsShown.length);
  const moreItems = totalHidden > 0 ? [`${color(`  ... and ${totalHidden} more items`, COLORS.dim)}`] : [];
  
  const output = [
    summary,
    '',
    ...items,
    ...moreItems
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
  const isGrep = stats.isGrep || false;
  const cacheHits = stats.cacheHits || 0;
  const diskHits = stats.diskHits || 0;
  
  // Build status message with cache info
  let statusMsg = `${results.length} matches found • ${time}ms`;
  if (cacheHits > 0 || diskHits > 0) {
    statusMsg += ` • ${color(`cache: ${cacheHits}`, COLORS.green)} / ${color(`disk: ${diskHits}`, COLORS.yellow)}`;
  }
  
  // Ultra compact one-line header
  const emoji = results.length > 0 ? '✅' : '❌';
  const summary = createCompactSummary(
    `${results.length} matches found`,
    `"${pattern}"`,
    `${time}ms • ${color(`cache: ${cacheHits}`, COLORS.green)} / ${color(`disk: ${diskHits}`, COLORS.yellow)}`
  );
  
  const output = [
    summary,
    
    // Results
    ...shown.map(result => {
      if (isGrep && result.line) {
        // Grep result with line number and text
        const pathInfo = formatPath(result.file);
        const cached = result.cached ? ' ⚡' : '';
        return `  📄 ${color(pathInfo.filename, COLORS.green)}:${color(result.line, COLORS.yellow)}${cached}\n     ${color(result.text || '', COLORS.gray)}`;
      } else {
        // Regular file search
        const pathInfo = formatPath(result.file || result);
        return `  📄 ${color(pathInfo.filename, COLORS.green)} ${color(pathInfo.shortDir, COLORS.gray, COLORS.dim)}`;
      }
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
  const cacheHits = stats.cacheHits || 0;
  const diskReads = stats.diskReads || 0;
  
  // Compact one-line summary
  const summary = createCompactSummary(
    'Files read',
    `${successful}/${total} files`,
    `${time}ms • ${color(`cache: ${cacheHits}`, COLORS.green)} / ${color(`disk: ${diskReads}`, COLORS.yellow)}${truncated > 0 ? ` • ${truncated} truncated` : ''}`
  );
  
  const output = [
    summary,
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
  
  // Compact one-line summary
  const summary = createCompactSummary(
    'File info',
    `${pathInfo.filename}`,
    `${time}ms • ${info.type} • ${info.size}`
  );
  
  const output = [
    summary,
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
  
  // Compact one-line error
  const summary = createCompactSummary(
    `${operation} failed`,
    path ? pathInfo.filename : '',
    error.message,
    COLORS.red
  );
  
  const output = [
    summary,
    ...getErrorSuggestions(error).map(s => color(`  • ${s}`, COLORS.gray))
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Format batch write operation
 */
export function formatBatchWriteOperation(files, results, errors, stats = {}) {
  const time = stats.time || 0;
  const successCount = results.length;
  const errorCount = Object.keys(errors).length;
  const totalCount = Object.keys(files).length;
  
  // Compact one-line summary
  const summary = createCompactSummary(
    'Batch write',
    `${successCount}/${totalCount} files`,
    `${time}ms`
  );
  
  // Show successful writes
  const successLines = results.slice(0, 5).map(path => {
    const pathInfo = formatPath(path);
    const size = formatSize(Buffer.byteLength(files[path] || '', 'utf8'));
    return `  ✅ ${color(pathInfo.filename, COLORS.green)} ${color(`(${size})`, COLORS.gray)}`;
  });
  
  if (results.length > 5) {
    successLines.push(color(`  ... and ${results.length - 5} more files`, COLORS.dim));
  }
  
  // Show errors
  const errorLines = Object.entries(errors).slice(0, 3).map(([path, error]) => {
    const pathInfo = formatPath(path);
    return `  ❌ ${color(pathInfo.filename, COLORS.red)}: ${error}`;
  });
  
  if (Object.keys(errors).length > 3) {
    errorLines.push(color(`  ... and ${Object.keys(errors).length - 3} more errors`, COLORS.dim));
  }
  
  const output = [
    summary,
    ...successLines,
    ...errorLines
  ].filter(line => line !== '').join('\n');
  
  return output;
}

/**
 * Format batch edit operation
 */
export function formatBatchEditOperation(edits, results, errors, stats = {}) {
  const time = stats.time || 0;
  const successCount = Object.keys(results).length;
  const errorCount = Object.keys(errors).length;
  const totalCount = Object.keys(edits).length;
  const mode = stats.dryRun ? ' (preview)' : '';
  
  // Compact one-line summary
  const summary = createCompactSummary(
    `Batch edit${mode}`,
    `${successCount}/${totalCount} files`,
    `${time}ms`
  );
  
  // Show successful edits
  const successLines = Object.entries(results).slice(0, 5).map(([path, result]) => {
    const pathInfo = formatPath(path);
    const editCount = result.editsApplied;
    return `  ✅ ${color(pathInfo.filename, COLORS.green)} ${color(`(${editCount} edits)`, COLORS.gray)}`;
  });
  
  if (Object.keys(results).length > 5) {
    successLines.push(color(`  ... and ${Object.keys(results).length - 5} more files`, COLORS.dim));
  }
  
  // Show errors
  const errorLines = Object.entries(errors).slice(0, 3).map(([path, error]) => {
    const pathInfo = formatPath(path);
    return `  ❌ ${color(pathInfo.filename, COLORS.red)}: ${error}`;
  });
  
  if (Object.keys(errors).length > 3) {
    errorLines.push(color(`  ... and ${Object.keys(errors).length - 3} more errors`, COLORS.dim));
  }
  
  const output = [
    summary,
    ...successLines,
    ...errorLines
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