#!/usr/bin/env node
/**
 * Quick fix for MaxListenersExceededWarning
 * Run this before starting any MCP servers or Node.js apps
 * 
 * Usage: node fix-listeners.js
 * Or add to your shell: export NODE_OPTIONS="--max-old-space-size=4096 --require=/path/to/fix-listeners.js"
 */

// Increase default max listeners globally
require('events').EventEmitter.defaultMaxListeners = 20;
process.setMaxListeners(20);

console.log('✅ MaxListeners increased to 20 (fixes AbortSignal warnings)');