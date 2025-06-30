// index.js - Main entry point for Apex Hive

import ApexRouter from './apex-router.js';
import { formatOutput } from './output-formatter.js';

// Export the router for use by other modules
export default ApexRouter;

// Also export as named export
export { ApexRouter };

// For CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const router = new ApexRouter();
  
  (async () => {
    try {
      await router.initialize();
      
      // Get command from args
      const [,, command, ...args] = process.argv;
      
      if (!command) {
        const helpResult = await router.execute('help');
        console.error(await formatOutput(helpResult));
        process.exit(0);
      }
      
      // Parse args into object
      const argsObj = { modules: router.modules };
      let positionalArgs = [];
      
      for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
          const key = args[i].slice(2);
          const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
          argsObj[key] = value;
          if (value !== true) i++; // Skip next arg if it was a value
        } else {
          positionalArgs.push(args[i]);
        }
      }
      
      // Handle common positional arguments
      if (command === 'search' && positionalArgs.length > 0) {
        argsObj.query = positionalArgs.join(' ');
      } else if (positionalArgs.length > 0) {
        // Generic positional arg handling
        argsObj.query = positionalArgs[0];
        argsObj.q = positionalArgs[0];
        if (positionalArgs.length > 1) {
          argsObj.args = positionalArgs;
        }
      }
      
      // Execute command
      const result = await router.execute(command, argsObj);
      // CRITICAL: Use console.error for output to avoid breaking MCP!
      const formatted = await formatOutput(result, { command, args: argsObj });
      console.error(formatted);
      
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}