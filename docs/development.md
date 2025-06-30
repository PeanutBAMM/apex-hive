# Development Guide

## 🚀 Contributing to Apex Hive

This guide explains how to extend Apex Hive with new commands, modules, and features.

## 📋 Development Setup

### Prerequisites
- Node.js 18+
- Git
- Basic JavaScript/ES6 knowledge
- Understanding of async/await

### Local Development
```bash
# Clone the repository
git clone https://github.com/apex-hive/apex-hive.git
cd apex-hive

# Install dependencies
npm install

# Link for local testing
npm link

# Run tests
npm test
```

## 🛠️ Adding a New Command

### 1. Create the Script
Create a new file in `scripts/`:

```javascript
// scripts/my-awesome-command.js
#!/usr/bin/env node

import { logger } from '../modules/logger.js';
import { exec } from '../modules/utils.js';

/**
 * Execute the command
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Result object
 */
export async function execute(args = {}) {
  const log = logger.child('MyCommand');
  
  try {
    log.info('Starting my awesome command');
    
    // Your implementation here
    const result = await doSomethingAwesome(args);
    
    return {
      success: true,
      message: 'Command completed successfully',
      data: result
    };
  } catch (error) {
    log.error('Command failed:', error);
    return {
      success: false,
      error: error.message,
      suggestion: 'Check the logs for details'
    };
  }
}

async function doSomethingAwesome(args) {
  // Implementation
  return { awesome: true };
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  execute().then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}
```

### 2. Register the Command
Add to `config/registry.js`:

```javascript
export default {
  // ... existing commands
  'my:awesome': './scripts/my-awesome-command.js',
};
```

### 3. Add Natural Language Support
Update `config/patterns.js`:

```javascript
{
  name: "my-awesome-pattern",
  match: /do.*awesome|make.*awesome/i,
  command: "my:awesome"
}
```

### 4. Test Your Command
```bash
# Direct execution
apex my:awesome

# Natural language
apex "do something awesome"

# With arguments
apex my:awesome --option value
```

## 📦 Creating a New Module

### Module Template
```javascript
// modules/my-module.js

import { logger } from './logger.js';
import { Cache } from './cache.js';

export class MyModule {
  constructor(options = {}) {
    this.logger = logger.child('MyModule');
    this.cache = new Cache({ max: 100 });
    this.options = options;
  }

  async doSomething(input) {
    // Check cache
    if (this.cache.has(input)) {
      return this.cache.get(input);
    }

    // Process
    const result = await this.process(input);
    
    // Cache result
    this.cache.set(input, result);
    
    return result;
  }

  async process(input) {
    // Implementation
    return { processed: input };
  }
}

// Export singleton
export const myModule = new MyModule();
```

### Using the Module
```javascript
import { myModule } from '../modules/my-module.js';

const result = await myModule.doSomething('input');
```

## 🎯 Adding a Recipe

### 1. Define the Recipe
Edit `config/recipes.json`:

```json
{
  "my-workflow": {
    "description": "My custom workflow that does XYZ",
    "steps": [
      "git:pull",
      "my:awesome",
      "quality:fix-all",
      "test",
      "git:commit"
    ]
  }
}
```

### 2. Add NL Trigger
In `config/patterns.js`:

```javascript
{
  name: "my-workflow-trigger",
  match: /my.*workflow|custom.*flow/i,
  recipe: "my-workflow"
}
```

## 🧪 Testing

### Unit Tests
```javascript
// test/my-command.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { execute } from '../scripts/my-awesome-command.js';

test('my awesome command works', async () => {
  const result = await execute({ option: 'value' });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.awesome, true);
});
```

### Integration Tests
```javascript
// test-integration.js
const tests = [
  {
    name: 'My command via router',
    command: 'my:awesome',
    args: { option: 'value' },
    expect: { success: true }
  }
];
```

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
node test-integration.js

# Specific test
node --test test/my-command.test.js
```

## 📏 Code Standards

### Style Guide
- Use ES6 modules (`import`/`export`)
- Async/await over promises
- Descriptive variable names
- JSDoc comments for functions

### Error Handling
```javascript
try {
  // Operation
} catch (error) {
  logger.error('Descriptive message:', error);
  return {
    success: false,
    error: error.message,
    suggestion: 'How to fix'
  };
}
```

### Output Format
All commands must return:
```javascript
{
  success: boolean,
  message: string,    // Optional
  data: any,         // Optional
  error: string,     // If success: false
  suggestion: string // Optional help
}
```

## 🔌 Extending Natural Language

### Pattern Types

1. **Simple Match**
```javascript
{
  name: "simple",
  match: /keyword/i,
  command: "command:name"
}
```

2. **Pattern with Capture**
```javascript
{
  name: "with-args",
  match: /search for (.+)/i,
  handler: (match) => ({
    command: "search",
    args: { query: match[1] }
  })
}
```

3. **Recipe Trigger**
```javascript
{
  name: "recipe",
  match: /workflow/i,
  recipe: "recipe-name"
}
```

### Multi-language Support
Create `config/patterns-[lang].js`:
```javascript
// config/patterns-es.js (Spanish)
export default [
  {
    name: "buscar",
    match: /buscar (.+)/i,
    handler: (match) => ({
      command: "search",
      args: { query: match[1] }
    })
  }
];
```

## 🚀 Performance Tips

### 1. Use Caching
```javascript
import { commandCache } from '../modules/cache.js';

const cacheKey = `mycommand:${JSON.stringify(args)}`;
if (commandCache.has(cacheKey)) {
  return commandCache.get(cacheKey);
}

const result = await expensive();
commandCache.set(cacheKey, result);
```

### 2. Parallel Operations
```javascript
const [a, b, c] = await Promise.all([
  operationA(),
  operationB(),
  operationC()
]);
```

### 3. Stream Large Data
```javascript
import { createReadStream } from 'fs';
const stream = createReadStream(largFile);
stream.on('data', chunk => process(chunk));
```

## 📚 Best Practices

1. **Keep Scripts Focused** - One command, one purpose
2. **Reuse Modules** - Don't duplicate functionality
3. **Handle Errors Gracefully** - Always return structured errors
4. **Document Everything** - JSDoc and inline comments
5. **Test Your Code** - Unit and integration tests
6. **Consider Performance** - Cache when appropriate
7. **Follow Conventions** - Consistent naming and structure

## 🔧 Debugging Tips

### Enable Debug Logging
```javascript
const log = logger.child('MyFeature');
log.debug('Detailed info', { data });
```

### Trace Execution
```bash
LOG_LEVEL=DEBUG apex my:command
```

### Interactive Debugging
```javascript
// Add debugger statement
debugger;

// Run with inspector
node --inspect-brk scripts/my-command.js
```

## 📖 Documentation

When adding features, update:
1. Command in `docs/commands-reference.md`
2. Examples in `docs/natural-language.md`
3. Recipe in `docs/recipes.md` (if applicable)
4. This guide for development patterns

---

*Happy coding! Your contributions make Apex Hive better for everyone. 🚀*