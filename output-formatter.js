// output-formatter.js - Intelligent output formatting for token optimization

/**
 * Format output based on result type and context
 * No hard limits - just smart formatting
 */

// Emoji mapping for apex operations
const APEX_EMOJI = {
  ci: '🚀',
  doc: '📚',
  quality: '✨',
  backlog: '📋',
  git: '🔀',
  cache: '💾',
  test: '🧪',
  build: '🔨',
  search: '🔍',
  init: '🎯',
  deploy: '🌐',
  recipe: '📦'
};

// Get emoji for command
function getCommandEmoji(command) {
  if (!command) return '🔧';
  
  const category = command.split(':')[0];
  return APEX_EMOJI[category] || '🔧';
}

// Format timing info
function formatTiming(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export async function formatOutput(result, context = {}) {
  const { command, args } = context;
  const emoji = getCommandEmoji(command);
  
  // Add command header if available
  let output = '';
  if (command) {
    output = `${emoji} apex ${command}\n`;
  }
  
  // Handle different result types
  if (Array.isArray(result)) {
    return output + formatArray(result, context);
  }
  
  if (result && typeof result === 'object') {
    if (result.recipe) {
      return formatRecipeResult(result);
    }
    if (result.matches || (result.files && Array.isArray(result.files))) {
      return output + formatSearchResult(result);
    }
    if (result.status && result.details) {
      // Handle doc:fix-links and similar results
      return output + formatDocResult(result);
    }
    
    // CI status formatting
    if (command && command.startsWith('ci:') && result.workflows) {
      return formatCIStatus(result, command);
    }
    
    // Cache status formatting
    if (command && command.startsWith('cache:') && result.totalCaches) {
      return formatCacheStatus(result, command);
    }
    
    if (result.error) {
      return output + formatError(result);
    }
    
    // Handle success/data/message pattern
    if (result.success !== undefined && result.message) {
      const status = result.success ? '✅' : '❌';
      return output + `${status} ${result.message}`;
    }
    
    // Handle generic objects by converting to readable JSON
    return output + JSON.stringify(result, null, 2);
  }
  
  // Default: return as string
  return output + String(result);
}

function formatArray(items, context) {
  if (items.length === 0) {
    return 'No results found';
  }
  
  // For file lists, group by directory
  if (items.every(item => item.includes('/'))) {
    return formatFileList(items);
  }
  
  // For search results, group by relevance
  if (items[0] && typeof items[0] === 'object' && items[0].file) {
    return formatSearchMatches(items);
  }
  
  // Default array formatting
  return items.map(item => `• ${item}`).join('\n');
}

function formatFileList(files) {
  // Ensure files is an array
  if (!Array.isArray(files)) {
    return 'No files to display';
  }
  
  const byDir = new Map();
  
  files.forEach(file => {
    const dir = file.substring(0, file.lastIndexOf('/')) || '/';
    if (!byDir.has(dir)) {
      byDir.set(dir, []);
    }
    byDir.get(dir).push(file.substring(file.lastIndexOf('/') + 1));
  });
  
  const output = [];
  for (const [dir, fileList] of byDir) {
    output.push(`${dir}/`);
    fileList.forEach(file => {
      output.push(`  ${file}`);
    });
  }
  
  return output.join('\n');
}

function formatSearchMatches(matches) {
  // Group by file for clarity
  const byFile = new Map();
  
  matches.forEach(match => {
    if (!byFile.has(match.file)) {
      byFile.set(match.file, []);
    }
    byFile.get(match.file).push(match);
  });
  
  const output = [];
  for (const [file, fileMatches] of byFile) {
    output.push(`\n📄 ${file}`);
    fileMatches.forEach(match => {
      if (match.line) {
        output.push(`  ${match.line}: ${match.text.trim()}`);
      } else {
        output.push(`  ${match.text.trim()}`);
      }
    });
  }
  
  return output.join('\n');
}

function formatRecipeResult(result) {
  const totalTime = result.steps.reduce((sum, step) => sum + (step.time || 0), 0);
  const cachedSteps = result.steps.filter(step => step.cached).length;
  
  const output = [`${APEX_EMOJI.recipe} apex ${result.recipe}`];
  
  if (result.success) {
    output.push(`✅ ${result.steps.length}/${result.steps.length} steps complete • ${formatTiming(totalTime)}`);
  } else {
    const completed = result.steps.filter(s => s.success).length;
    output.push(`❌ ${completed}/${result.steps.length} steps complete • ${formatTiming(totalTime)}`);
  }
  
  output.push('');
  
  result.steps.forEach((step, i) => {
    const icon = step.success ? '✓' : '✗';
    const time = step.time ? ` (${formatTiming(step.time)})` : '';
    const cached = step.cached ? ' ⚡' : '';
    output.push(`${i + 1}. ${icon} ${step.step}${time}${cached}`);
    
    if (step.error) {
      output.push(`   → Error: ${step.error}`);
    } else if (step.result && step.result.message) {
      output.push(`   → ${step.result.message}`);
    }
  });
  
  if (cachedSteps > 0) {
    output.push(`\n⚡ = used cache (${cachedSteps} operations)`);
  }
  
  return output.join('\n');
}

function formatSearchResult(result) {
  const output = [];
  
  if (result.query) {
    output.push(`Search: "${result.query}"`);
  }
  
  if (result.files) {
    output.push(`\nFound in ${result.files.length} files:`);
    return output.join('\n') + '\n' + formatFileList(result.files);
  }
  
  if (result.matches) {
    output.push(`\n${result.matches.length} matches found:`);
    return output.join('\n') + formatSearchMatches(result.matches);
  }
  
  return output.join('\n');
}

function formatDocResult(result) {
  const output = [];
  
  // Status header
  if (result.status === 'fixed') {
    output.push(`✅ ${result.message || 'Documentation fixed'}`);
  } else if (result.status === 'no-issues') {
    output.push(`✓ ${result.message || 'No issues found'}`);
  } else if (result.status === 'no-files') {
    output.push(`ℹ️  ${result.message || 'No files found'}`);
  } else {
    output.push(result.message || 'Operation completed');
  }
  
  // Show details if available
  if (result.details && result.details.length > 0) {
    output.push('\nFiles processed:');
    result.details.forEach(detail => {
      output.push(`\n📄 ${detail.file} (${detail.count} fixes)`);
      if (detail.fixes && detail.fixes.length > 0) {
        // Show first few fixes as examples
        detail.fixes.slice(0, 3).forEach(fix => {
          output.push(`  • ${fix.type}: ${fix.original} → ${fix.fixed}`);
        });
        if (detail.fixes.length > 3) {
          output.push(`  • ... and ${detail.fixes.length - 3} more`);
        }
      }
    });
  }
  
  return output.join('\n');
}

function formatError(result) {
  const output = ['❌ Error occurred:'];
  
  if (result.error) {
    output.push(result.error);
  }
  
  if (result.details) {
    output.push('\nDetails:');
    output.push(result.details);
  }
  
  if (result.suggestion) {
    output.push('\n💡 Suggestion:');
    output.push(result.suggestion);
  }
  
  return output.join('\n');
}

function formatCIStatus(result, command) {
  const output = [`${APEX_EMOJI.ci} apex ${command}`];
  
  if (result.workflows && result.workflows.length > 0) {
    const passing = result.workflows.filter(w => w.conclusion === 'success').length;
    output.push(`✅ ${passing}/${result.workflows.length} workflows passing • ${formatTiming(result.totalTime || 0)}`);
    output.push('');
    
    output.push('Recent runs:');
    result.workflows.slice(0, 4).forEach(workflow => {
      const icon = workflow.conclusion === 'success' ? '✅' : '❌';
      const time = workflow.duration ? ` - ${formatTiming(workflow.duration)}` : '';
      output.push(`• ${icon} ${workflow.name}${time}`);
    });
  } else {
    output.push('✅ No active CI runs');
  }
  
  return output.join('\n');
}

function formatCacheStatus(result, command) {
  const output = [`${APEX_EMOJI.cache} apex ${command}`];
  
  if (result.totalCaches) {
    const hitRate = (parseFloat(result.averageHitRate) * 100).toFixed(0);
    output.push(`✅ ${result.totalItems} items • ${result.totalSize} • ${hitRate}% hit rate`);
    output.push('');
    
    output.push('Cache breakdown:');
    Object.entries(result.caches).forEach(([name, cache]) => {
      const hitPercent = cache.hitRate ? `${(cache.hitRate * 100).toFixed(0)}%` : '0%';
      const cached = cache.hits > 0 ? ' ⚡' : '';
      output.push(`• ${name}: ${cache.items} items, ${cache.size}, ${hitPercent} hits${cached}`);
    });
    
    if (result.totalHits > 0) {
      output.push(`\n⚡ = cache hits (${result.totalHits} total)`);
    }
  }
  
  return output.join('\n');
}