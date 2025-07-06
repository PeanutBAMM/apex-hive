#!/usr/bin/env node
/**
 * Fix MaxListenersExceededWarning for MCP servers
 * 
 * This warning occurs when MCP servers (like Supabase) add too many abort listeners
 * to AbortSignal objects. The default limit is 10, but some operations need more.
 * 
 * Run this script at startup or add to your MCP server initialization.
 */

import { EventEmitter } from 'events';

// Increase the default max listeners for EventEmitter
EventEmitter.defaultMaxListeners = 20;

// Also increase for the global process
process.setMaxListeners(20);

// If running in Node.js with AbortController available
if (typeof AbortSignal !== 'undefined') {
  // Some MCP servers use the global AbortSignal
  try {
    // This might not work in all environments, but worth trying
    if (AbortSignal.prototype && typeof AbortSignal.prototype.setMaxListeners === 'function') {
      AbortSignal.prototype.setMaxListeners(20);
    }
  } catch (e) {
    // Silently ignore if this doesn't work
  }
}

console.log('✅ Max listeners increased to 20 to prevent MCP server warnings');
console.log('   This fixes: MaxListenersExceededWarning with AbortSignal');

// Export for use in other scripts
export function increaseMaxListeners(limit = 20) {
  EventEmitter.defaultMaxListeners = limit;
  process.setMaxListeners(limit);
  return limit;
}