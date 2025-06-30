// apex-router.js - Smart command dispatcher with NL support

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class ApexRouter {
  constructor() {
    // Configurations will be loaded lazily
    this.recipes = null;
    this.patterns = null;
    this.patternsNL = null;
    this.registry = null;
    
    // Core modules (will be initialized later)
    this.modules = {};
    
    // Loaded scripts cache
    this.loaded = new Map();
  }
  
  async initialize() {
    // Silent initialization for MCP
    
    // Load configurations
    await this.loadConfigurations();
    
    // Initialize core modules
    await this.initializeModules();
    
    // Initialization complete
  }
  
  async loadConfigurations() {
    try {
      // Load recipes
      const recipesPath = path.join(__dirname, 'config', 'recipes.json');
      const recipesContent = await fs.readFile(recipesPath, 'utf8');
      this.recipes = JSON.parse(recipesContent);
      
      // Load patterns (English)
      const patternsPath = path.join(__dirname, 'config', 'patterns.js');
      this.patterns = (await import(patternsPath)).default;
      
      // Load patterns (Dutch) - if exists
      try {
        const patternsNLPath = path.join(__dirname, 'config', 'patterns-nl.js');
        this.patternsNL = (await import(patternsNLPath)).default;
      } catch {
        this.patternsNL = [];
      }
      
      // Load script registry
      const registryPath = path.join(__dirname, 'config', 'registry.js');
      this.registry = (await import(registryPath)).default;
      
      // Configurations loaded
    } catch (error) {
      // Silently use defaults if configs don't exist yet
      this.recipes = {};
      this.patterns = [];
      this.patternsNL = [];
      this.registry = {};
    }
  }
  
  async initializeModules() {
    try {
      // Import modules
      const { Cache } = await import('./modules/cache.js');
      const { readFile, writeFile, listFiles } = await import('./modules/file-ops.js');
      const { ragSystem } = await import('./modules/rag-system.js');
      const { gitOps } = await import('./modules/git-ops.js');
      
      // Initialize cache
      const cache = new Cache();
      
      // Initialize modules
      this.modules = {
        cache,
        fileOps: { readFile, writeFile, listFiles },
        rag: ragSystem,
        gitOps: gitOps
      };
      
      // Modules initialized
    } catch (error) {
      // Modules not ready yet: error.message
      this.modules = {};
    }
  }
  
  async execute(input, args = {}) {
    // Execute: input
    
    // Step 1: Natural Language Processing
    const nlResult = this.parseNaturalLanguage(input);
    if (nlResult) {
      // NL match found
      return await this.handleNLResult(nlResult, args);
    }
    
    // Step 2: Check if it's a recipe
    if (this.recipes && this.recipes[input]) {
      // Recipe match
      return await this.runRecipe(input, args);
    }
    
    // Step 3: Direct command routing
    // Direct command
    return await this.routeCommand(input, args);
  }
  
  parseNaturalLanguage(input) {
    // Check both Dutch and English patterns
    const allPatterns = [...(this.patternsNL || []), ...(this.patterns || [])];
    
    for (const pattern of allPatterns) {
      const match = input.match(pattern.match);
      if (match) {
        if (pattern.recipe) {
          return { type: 'recipe', name: pattern.recipe };
        } else if (pattern.command) {
          return { type: 'command', command: pattern.command, args: {} };
        } else if (pattern.handler) {
          return { type: 'command', ...pattern.handler(match) };
        }
      }
    }
    
    return null;
  }
  
  async handleNLResult(nlResult, baseArgs) {
    if (nlResult.type === 'recipe') {
      return await this.runRecipe(nlResult.name, baseArgs);
    } else {
      // Merge NL-extracted args with base args
      const mergedArgs = { ...baseArgs, ...nlResult.args };
      return await this.routeCommand(nlResult.command, mergedArgs);
    }
  }
  
  async routeCommand(command, args) {
    // Check if it's a module command
    if (command === 'search') {
      // Use the search script instead
      const searchScript = await this.loadScript('search');
      return await searchScript.run({ query: args.query || args.q || '', modules: this.modules });
    }
    
    if (command === 'read' && this.modules.fileOps) {
      return await this.modules.fileOps.read(args.path || args.file);
    }
    
    if (command === 'write' && this.modules.fileOps) {
      return await this.modules.fileOps.write(args.path || args.file, args.content);
    }
    
    // Check script registry
    if (this.registry && this.registry[command]) {
      const script = await this.loadScript(command);
      return await script.run(args);
    }
    
    // Handle help command
    if (command === 'help') {
      return this.showHelp();
    }
    
    // Unknown command
    throw new Error(`Unknown command: ${command}\n\nTry 'apex help' for available commands.`);
  }
  
  async loadScript(name) {
    if (!this.loaded.has(name)) {
      const scriptPath = path.join(__dirname, this.registry[name]);
      // Loading script: name
      const module = await import(scriptPath);
      this.loaded.set(name, module);
    }
    return this.loaded.get(name);
  }
  
  async runRecipe(name, context) {
    const steps = this.recipes[name];
    if (!steps) {
      throw new Error(`Unknown recipe: ${name}`);
    }
    
    const results = [];
    
    for (const step of steps) {
      // Running step
      
      try {
        const result = await this.execute(step, context);
        results.push({ step, success: true, result });
        
        // Smart stopping on test failures
        if (step === 'test' && result && result.failed) {
          // Tests failed, stopping recipe
          break;
        }
      } catch (error) {
        results.push({ step, success: false, error: error.message });
        // Step failed
        break;
      }
    }
    
    return {
      recipe: name,
      steps: results,
      success: results.every(r => r.success)
    };
  }
  
  showHelp() {
    const help = [
      'Apex Hive - AI Development Hub',
      '',
      'Usage: apex <command> [args]',
      '',
      'Commands:',
      '  help              Show this help',
      '  search <query>    Search with ripgrep',
      '  read <file>       Read file contents',
      '  test              Run tests',
      '',
      'Recipes:',
      '  commit-push       Full commit workflow',
      '  fix-ci            Fix CI issues',
      '  clean-code        Clean up code quality',
      '',
      'Natural Language:',
      '  "fix the CI"',
      '  "search for authentication"',
      '  "commit and push"',
      '',
      'Dutch commands also supported!'
    ];
    
    return help.join('\n');
  }
}