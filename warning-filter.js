/**
 * Global Warning Filter voor MaxListenersExceededWarning
 * 
 * Dit script onderdrukt specifiek de AbortSignal MaxListenersExceededWarning
 * die veroorzaakt wordt door de Supabase MCP server, maar laat alle andere
 * warnings door.
 * 
 * Gebruik: NODE_OPTIONS="--require /pad/naar/warning-filter.js"
 */

// Override the default warning handler
process.removeAllListeners('warning');

process.on('warning', (warning) => {
  // Check if this is the specific warning we want to suppress
  if (warning.name === 'MaxListenersExceededWarning' && 
      warning.message && 
      warning.message.includes('AbortSignal')) {
    // Silently suppress this warning
    return;
  }
  
  // For all other warnings, use the default behavior
  console.warn(warning.stack || warning.message);
});

// Silent console log to confirm the filter is loaded (remove in production)
// console.error('[WARNING-FILTER] AbortSignal MaxListenersExceededWarning suppression active');