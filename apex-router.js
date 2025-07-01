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
    const help = ['Apex Hive - AI Development Hub', ''];
    help.push('Usage: apex <command> [args]', '');
    
    // Group commands by category
    const categories = {
      'Core': ['help', 'search', 'read', 'write', 'init', 'build', 'test', 'code', 'save-conversation'],
      'CI/CD': [],
      'Documentation': [],
      'Quality': [],
      'Git': [],
      'Backlog': [],
      'Cache': [],
      'XML': [],
      'Other': []
    };
    
    // Sort commands into categories
    if (this.registry) {
      Object.keys(this.registry).forEach(cmd => {
        if (cmd === 'help' || categories.Core.includes(cmd)) return;
        
        if (cmd.startsWith('ci:')) categories['CI/CD'].push(cmd);
        else if (cmd.startsWith('doc:')) categories['Documentation'].push(cmd);
        else if (cmd.startsWith('quality:')) categories['Quality'].push(cmd);
        else if (cmd.startsWith('git:')) categories['Git'].push(cmd);
        else if (cmd.startsWith('backlog:')) categories['Backlog'].push(cmd);
        else if (cmd.startsWith('cache:')) categories['Cache'].push(cmd);
        else if (cmd.startsWith('xml:')) categories['XML'].push(cmd);
        else categories['Other'].push(cmd);
      });
    }
    
    // Display commands by category
    Object.entries(categories).forEach(([category, commands]) => {
      if (commands.length > 0) {
        help.push(`${category} Commands:`);
        commands.sort().forEach(cmd => {
          const padding = ' '.repeat(Math.max(20 - cmd.length, 1));
          help.push(`  ${cmd}${padding}${this.getCommandDescription(cmd)}`);
        });
        help.push('');
      }
    });
    
    // Add recipes
    if (this.recipes && Object.keys(this.recipes).length > 0) {
      help.push('Recipes:');
      Object.keys(this.recipes).forEach(recipe => {
        const padding = ' '.repeat(Math.max(20 - recipe.length, 1));
        help.push(`  ${recipe}${padding}${this.getRecipeDescription(recipe)}`);
      });
      help.push('');
    }
    
    // Add natural language examples
    help.push('Natural Language Examples:');
    help.push('  "fix the CI"');
    help.push('  "what\'s broken?"');
    help.push('  "generate docs"');
    help.push('  "run tests"');
    help.push('');
    help.push('Dutch commands also supported!');
    help.push('');
    help.push(`Total: ${Object.keys(this.registry || {}).length} commands available`);
    
    return help.join('\n');
  }
  
  getCommandDescription(cmd) {
    const descriptions = {
      'search': 'Search codebase',
      'read': 'Read file contents',
      'write': 'Write file contents',
      'test': 'Run test suite',
      'init': 'Initialize project',
      'build': 'Build project',
      'code': 'Generate code stubs',
      'save-conversation': 'Save AI conversation',
      'ci:monitor': 'Monitor CI status',
      'ci:fix': 'Fix CI issues',
      'ci:status': 'Check CI status',
      'doc:generate': 'Generate documentation',
      'doc:validate': 'Validate docs',
      'cache:warm-all': 'Warm all caches',
      'cache:status': 'Cache statistics'
    };
    return descriptions[cmd] || '';
  }
  
  getRecipeDescription(recipe) {
    const descriptions = {
      'commit-push': 'Commit and push with CI monitoring',
      'fix-ci': 'Fix all CI issues',
      'clean-code': 'Clean up code quality'
    };
    return descriptions[recipe] || 'Workflow automation';
  }
}