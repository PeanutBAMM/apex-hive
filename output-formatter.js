// output-formatter.js - Intelligent output formatting for token optimization

/**
 * Format output based on result type and context
 * No hard limits - just smart formatting
 */
export async function formatOutput(result, context = {}) {
  const { command, args } = context;
  
  // Handle different result types
  if (Array.isArray(result)) {
    return formatArray(result, context);
  }
  
  if (result && typeof result === 'object') {
    if (result.recipe) {
      return formatRecipeResult(result);
    }
    if (result.files || result.matches) {
      return formatSearchResult(result);
    }
    if (result.error) {
      return formatError(result);
    }
  }
  
  // Default: return as string
  return String(result);
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
  const output = [`Recipe: ${result.recipe}`];
  
  if (result.success) {
    output.push('✅ All steps completed successfully\n');
  } else {
    output.push('❌ Recipe failed\n');
  }
  
  result.steps.forEach((step, i) => {
    const icon = step.success ? '✓' : '✗';
    output.push(`${i + 1}. ${icon} ${step.step}`);
    
    if (step.error) {
      output.push(`   → Error: ${step.error}`);
    } else if (step.result && step.result.message) {
      output.push(`   → ${step.result.message}`);
    }
  });
  
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