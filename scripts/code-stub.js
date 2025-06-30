// code-stub.js - Generate code stubs and boilerplate
import { promises as fs } from 'fs';
import path from 'path';

export async function run(args = {}) {
  const { 
    type = 'function',
    name = 'example',
    template,
    language = 'javascript',
    directory = '.',
    features = [],
    dryRun = false,
    modules = {} 
  } = args;
  
  console.error('[CODE-STUB] Generating code stub...');
  
  try {
    // Validate inputs
    if (!name || !name.match(/^[a-zA-Z_][a-zA-Z0-9_-]*$/)) {
      return {
        success: false,
        error: 'Invalid name',
        message: 'Name must start with letter/underscore and contain only alphanumeric, underscore, or dash'
      };
    }
    
    // Generate stub based on type
    let stubResult;
    
    switch (type) {
      case 'function':
        stubResult = generateFunctionStub(name, { language, features });
        break;
        
      case 'class':
        stubResult = generateClassStub(name, { language, features });
        break;
        
      case 'component':
        stubResult = generateComponentStub(name, { language, features });
        break;
        
      case 'module':
        stubResult = generateModuleStub(name, { language, features });
        break;
        
      case 'api':
        stubResult = generateAPIStub(name, { language, features });
        break;
        
      case 'test':
        stubResult = generateTestStub(name, { language, features });
        break;
        
      case 'script':
        stubResult = generateScriptStub(name, { language, features });
        break;
        
      case 'config':
        stubResult = generateConfigStub(name, { language, features });
        break;
        
      case 'custom':
        if (!template) {
          return {
            success: false,
            error: 'Template required',
            message: 'Custom type requires a template'
          };
        }
        stubResult = await generateCustomStub(name, template, { language, features });
        break;
        
      default:
        return {
          success: false,
          error: 'Unknown type',
          message: `Unknown stub type: ${type}`
        };
    }
    
    if (!stubResult.success) {
      return stubResult;
    }
    
    // Determine output path
    const extension = getFileExtension(language, type);
    const filename = stubResult.filename || `${name}${extension}`;
    const filepath = path.join(directory, filename);
    
    // Create directory if needed
    if (!dryRun) {
      const dir = path.dirname(filepath);
      if (dir !== '.') {
        await fs.mkdir(dir, { recursive: true });
      }
      
      // Check if file exists
      try {
        await fs.access(filepath);
        return {
          success: false,
          error: 'File exists',
          message: `File already exists: ${filepath}`
        };
      } catch {
        // File doesn't exist, good
      }
      
      // Write stub
      await fs.writeFile(filepath, stubResult.content);
      
      // Create additional files if any
      if (stubResult.additionalFiles) {
        for (const additional of stubResult.additionalFiles) {
          const additionalPath = path.join(directory, additional.filename);
          await fs.writeFile(additionalPath, additional.content);
        }
      }
    }
    
    return {
      success: true,
      dryRun,
      data: {
        type,
        name,
        file: filepath,
        language,
        features,
        additionalFiles: stubResult.additionalFiles?.map(f => 
          path.join(directory, f.filename)
        ) || []
      },
      message: dryRun 
        ? `Would create ${type} stub: ${filepath}`
        : `Created ${type} stub: ${filepath}`
    };
    
  } catch (error) {
    console.error('[CODE-STUB] Error:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate code stub'
    };
  }
}

function generateFunctionStub(name, options) {
  const { language, features } = options;
  let content = '';
  
  switch (language) {
    case 'javascript':
      content = generateJSFunction(name, features);
      break;
      
    case 'typescript':
      content = generateTSFunction(name, features);
      break;
      
    case 'python':
      content = generatePythonFunction(name, features);
      break;
      
    default:
      return {
        success: false,
        error: `Unsupported language for function: ${language}`
      };
  }
  
  return {
    success: true,
    content
  };
}

function generateJSFunction(name, features) {
  let content = '';
  
  // Add JSDoc if requested
  if (features.includes('jsdoc')) {
    content += `/**
 * ${camelToSentence(name)}
 * @param {Object} options - The options object
 * @returns {Promise<Object>} The result object
 */
`;
  }
  
  // Function declaration
  if (features.includes('async')) {
    content += `async function ${name}(options = {}) {\n`;
  } else if (features.includes('arrow')) {
    content += `const ${name} = (options = {}) => {\n`;
  } else {
    content += `function ${name}(options = {}) {\n`;
  }
  
  // Function body
  content += `  // TODO: Implement ${name}\n`;
  
  if (features.includes('validation')) {
    content += `  
  // Validate inputs
  if (!options || typeof options !== 'object') {
    throw new Error('Options must be an object');
  }
  \n`;
  }
  
  if (features.includes('logging')) {
    content += `  console.log('[${name.toUpperCase()}] Starting...');\n\n`;
  }
  
  if (features.includes('error-handling')) {
    content += `  try {\n`;
    content += `    // Main logic here\n`;
    content += `    const result = {};\n\n`;
    content += `    return result;\n`;
    content += `  } catch (error) {\n`;
    content += `    console.error('[${name.toUpperCase()}] Error:', error.message);\n`;
    content += `    throw error;\n`;
    content += `  }\n`;
  } else {
    content += `  const result = {};\n\n`;
    content += `  return result;\n`;
  }
  
  content += `}\n`;
  
  // Export
  if (features.includes('export')) {
    content += `\nmodule.exports = ${name};\n`;
  } else if (features.includes('export-default')) {
    content += `\nexport default ${name};\n`;
  } else if (features.includes('export-named')) {
    content += `\nexport { ${name} };\n`;
  }
  
  return content;
}

function generateTSFunction(name, features) {
  let content = '';
  
  // Interface for options
  content += `interface ${capitalize(name)}Options {\n`;
  content += `  // TODO: Define options\n`;
  content += `}\n\n`;
  
  content += `interface ${capitalize(name)}Result {\n`;
  content += `  // TODO: Define result\n`;
  content += `  success: boolean;\n`;
  content += `  data?: any;\n`;
  content += `  error?: string;\n`;
  content += `}\n\n`;
  
  // Function
  if (features.includes('async')) {
    content += `async function ${name}(options: ${capitalize(name)}Options = {}): Promise<${capitalize(name)}Result> {\n`;
  } else {
    content += `function ${name}(options: ${capitalize(name)}Options = {}): ${capitalize(name)}Result {\n`;
  }
  
  // Similar body to JS
  content += `  // TODO: Implement ${name}\n`;
  
  if (features.includes('error-handling')) {
    content += `  try {\n`;
    content += `    const result: ${capitalize(name)}Result = {\n`;
    content += `      success: true,\n`;
    content += `      data: {}\n`;
    content += `    };\n\n`;
    content += `    return result;\n`;
    content += `  } catch (error) {\n`;
    content += `    return {\n`;
    content += `      success: false,\n`;
    content += `      error: error.message\n`;
    content += `    };\n`;
    content += `  }\n`;
  } else {
    content += `  const result: ${capitalize(name)}Result = {\n`;
    content += `    success: true,\n`;
    content += `    data: {}\n`;
    content += `  };\n\n`;
    content += `  return result;\n`;
  }
  
  content += `}\n`;
  
  // Export
  content += `\nexport { ${name}, ${capitalize(name)}Options, ${capitalize(name)}Result };\n`;
  
  return content;
}

function generatePythonFunction(name, features) {
  let content = '';
  
  // Imports
  if (features.includes('typing')) {
    content += 'from typing import Dict, Any, Optional\n\n';
  }
  
  // Function
  if (features.includes('async')) {
    content += `async def ${name}(`;
  } else {
    content += `def ${name}(`;
  }
  
  if (features.includes('typing')) {
    content += `options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:\n`;
  } else {
    content += `options=None):\n`;
  }
  
  // Docstring
  content += `    """${camelToSentence(name)}
    
    Args:
        options: Configuration options
        
    Returns:
        Result dictionary
    """\n`;
  
  // Body
  content += `    if options is None:\n`;
  content += `        options = {}\n\n`;
  
  if (features.includes('error-handling')) {
    content += `    try:\n`;
    content += `        # TODO: Implement ${name}\n`;
    content += `        result = {\n`;
    content += `            'success': True,\n`;
    content += `            'data': {}\n`;
    content += `        }\n`;
    content += `        return result\n`;
    content += `    except Exception as e:\n`;
    content += `        return {\n`;
    content += `            'success': False,\n`;
    content += `            'error': str(e)\n`;
    content += `        }\n`;
  } else {
    content += `    # TODO: Implement ${name}\n`;
    content += `    result = {\n`;
    content += `        'success': True,\n`;
    content += `        'data': {}\n`;
    content += `    }\n`;
    content += `    return result\n`;
  }
  
  return content;
}

function generateClassStub(name, options) {
  const { language, features } = options;
  let content = '';
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      content = generateJSClass(name, features, language);
      break;
      
    case 'python':
      content = generatePythonClass(name, features);
      break;
      
    default:
      return {
        success: false,
        error: `Unsupported language for class: ${language}`
      };
  }
  
  return {
    success: true,
    content
  };
}

function generateJSClass(name, features, language) {
  const className = capitalize(name);
  let content = '';
  
  if (language === 'typescript' && features.includes('interface')) {
    content += `interface I${className} {\n`;
    content += `  // TODO: Define interface\n`;
    content += `}\n\n`;
  }
  
  // Class declaration
  content += `class ${className}`;
  
  if (language === 'typescript' && features.includes('interface')) {
    content += ` implements I${className}`;
  }
  
  content += ` {\n`;
  
  // Constructor
  if (language === 'typescript') {
    content += `  private config: any;\n\n`;
    content += `  constructor(config: any = {}) {\n`;
  } else {
    content += `  constructor(config = {}) {\n`;
  }
  
  content += `    this.config = config;\n`;
  content += `    // TODO: Initialize ${className}\n`;
  content += `  }\n\n`;
  
  // Methods
  if (features.includes('singleton')) {
    content += `  private static instance: ${className};\n\n`;
    content += `  static getInstance(config${language === 'typescript' ? ': any' : ''} = {})${language === 'typescript' ? ': ' + className : ''} {\n`;
    content += `    if (!${className}.instance) {\n`;
    content += `      ${className}.instance = new ${className}(config);\n`;
    content += `    }\n`;
    content += `    return ${className}.instance;\n`;
    content += `  }\n\n`;
  }
  
  // Example method
  content += `  ${features.includes('async') ? 'async ' : ''}process(data${language === 'typescript' ? ': any' : ''})${language === 'typescript' ? ': Promise<any>' : ''} {\n`;
  content += `    // TODO: Implement process method\n`;
  
  if (features.includes('error-handling')) {
    content += `    try {\n`;
    content += `      const result = data;\n`;
    content += `      return result;\n`;
    content += `    } catch (error) {\n`;
    content += `      console.error('[${className}] Error:', error.message);\n`;
    content += `      throw error;\n`;
    content += `    }\n`;
  } else {
    content += `    return data;\n`;
  }
  
  content += `  }\n`;
  content += `}\n`;
  
  // Export
  if (language === 'typescript') {
    content += `\nexport { ${className}`;
    if (features.includes('interface')) {
      content += `, I${className}`;
    }
    content += ` };\n`;
  } else {
    content += `\nmodule.exports = ${className};\n`;
  }
  
  return content;
}

function generatePythonClass(name, features) {
  const className = capitalize(name);
  let content = '';
  
  // Imports
  if (features.includes('dataclass')) {
    content += 'from dataclasses import dataclass\n';
  }
  if (features.includes('abc')) {
    content += 'from abc import ABC, abstractmethod\n';
  }
  content += '\n';
  
  // Class
  if (features.includes('dataclass')) {
    content += '@dataclass\n';
  }
  
  content += `class ${className}`;
  
  if (features.includes('abc')) {
    content += '(ABC)';
  }
  
  content += ':\n';
  
  // Docstring
  content += `    """${camelToSentence(className)}"""\n\n`;
  
  if (features.includes('dataclass')) {
    content += `    # TODO: Define dataclass fields\n`;
    content += `    name: str = "${name}"\n\n`;
  } else {
    // Constructor
    content += `    def __init__(self, config=None):\n`;
    content += `        self.config = config or {}\n`;
    content += `        # TODO: Initialize ${className}\n\n`;
  }
  
  // Methods
  if (features.includes('singleton')) {
    content += `    _instance = None\n\n`;
    content += `    def __new__(cls, *args, **kwargs):\n`;
    content += `        if not cls._instance:\n`;
    content += `            cls._instance = super().__new__(cls)\n`;
    content += `        return cls._instance\n\n`;
  }
  
  // Example method
  if (features.includes('abc')) {
    content += `    @abstractmethod\n`;
  }
  content += `    ${features.includes('async') ? 'async ' : ''}def process(self, data):\n`;
  
  if (features.includes('abc')) {
    content += `        """Process data - must be implemented by subclasses"""\n`;
    content += `        pass\n`;
  } else {
    content += `        """Process data"""\n`;
    content += `        # TODO: Implement process method\n`;
    
    if (features.includes('error-handling')) {
      content += `        try:\n`;
      content += `            result = data\n`;
      content += `            return result\n`;
      content += `        except Exception as e:\n`;
      content += `            print(f"[${className}] Error: {e}")\n`;
      content += `            raise\n`;
    } else {
      content += `        return data\n`;
    }
  }
  
  return content;
}

function generateComponentStub(name, options) {
  const { language, features } = options;
  const componentName = capitalize(name);
  
  // Detect framework
  const isReact = features.includes('react');
  const isVue = features.includes('vue');
  const isAngular = features.includes('angular');
  
  if (!isReact && !isVue && !isAngular) {
    // Default to React
    features.push('react');
  }
  
  if (isReact) {
    return generateReactComponent(componentName, features, language);
  } else if (isVue) {
    return generateVueComponent(componentName, features, language);
  } else if (isAngular) {
    return generateAngularComponent(componentName, features, language);
  }
  
  return {
    success: false,
    error: 'No framework specified'
  };
}

function generateReactComponent(name, features, language) {
  const isTS = language === 'typescript';
  const ext = isTS ? '.tsx' : '.jsx';
  let content = '';
  
  // Imports
  content += `import React`;
  
  if (features.includes('hooks')) {
    content += `, { useState, useEffect }`;
  }
  
  content += ` from 'react';\n`;
  
  if (features.includes('props') && isTS) {
    content += `\ninterface ${name}Props {\n`;
    content += `  // TODO: Define props\n`;
    content += `  title?: string;\n`;
    content += `  children?: React.ReactNode;\n`;
    content += `}\n\n`;
  }
  
  // Component
  if (features.includes('class')) {
    // Class component
    content += `class ${name} extends React.Component`;
    if (isTS && features.includes('props')) {
      content += `<${name}Props>`;
    }
    content += ` {\n`;
    
    if (features.includes('state')) {
      content += `  state = {\n`;
      content += `    // TODO: Define state\n`;
      content += `    loading: false\n`;
      content += `  };\n\n`;
    }
    
    content += `  render() {\n`;
    content += `    return (\n`;
    content += `      <div className="${name.toLowerCase()}">\n`;
    content += `        {/* TODO: Implement ${name} */}\n`;
    content += `        <h1>${name} Component</h1>\n`;
    
    if (features.includes('props')) {
      content += `        {this.props.children}\n`;
    }
    
    content += `      </div>\n`;
    content += `    );\n`;
    content += `  }\n`;
    content += `}\n`;
  } else {
    // Functional component
    content += `const ${name}`;
    
    if (isTS && features.includes('props')) {
      content += `: React.FC<${name}Props>`;
    }
    
    content += ` = (`;
    
    if (features.includes('props')) {
      content += isTS ? `props` : `{ title, children }`;
    }
    
    content += `) => {\n`;
    
    if (features.includes('hooks')) {
      content += `  const [loading, setLoading] = useState(false);\n\n`;
      
      content += `  useEffect(() => {\n`;
      content += `    // TODO: Add effect logic\n`;
      content += `  }, []);\n\n`;
    }
    
    content += `  return (\n`;
    content += `    <div className="${name.toLowerCase()}">\n`;
    content += `      {/* TODO: Implement ${name} */}\n`;
    content += `      <h1>${name} Component</h1>\n`;
    
    if (features.includes('props')) {
      content += `      {${isTS ? 'props.children' : 'children'}}\n`;
    }
    
    content += `    </div>\n`;
    content += `  );\n`;
    content += `};\n`;
  }
  
  // Export
  content += `\nexport default ${name};\n`;
  
  // Style file
  const styleContent = `.${name.toLowerCase()} {
  /* TODO: Add styles */
}`;
  
  return {
    success: true,
    content,
    filename: name + ext,
    additionalFiles: features.includes('styles') ? [{
      filename: `${name}.css`,
      content: styleContent
    }] : []
  };
}

function generateVueComponent(name, features, language) {
  const content = `<template>
  <div class="${name.toLowerCase()}">
    <!-- TODO: Implement ${name} -->
    <h1>{{ title }}</h1>
    <slot></slot>
  </div>
</template>

<script${language === 'typescript' ? ' lang="ts"' : ''}>
${features.includes('composition') ? `import { ref, computed, onMounted } from 'vue';

export default {
  name: '${name}',
  props: {
    title: {
      type: String,
      default: '${name} Component'
    }
  },
  setup(props) {
    const loading = ref(false);
    
    onMounted(() => {
      // TODO: Add mounted logic
    });
    
    return {
      loading
    };
  }
};` : `export default {
  name: '${name}',
  props: {
    title: {
      type: String,
      default: '${name} Component'
    }
  },
  data() {
    return {
      loading: false
    };
  },
  mounted() {
    // TODO: Add mounted logic
  }
};`}
</script>

<style scoped>
.${name.toLowerCase()} {
  /* TODO: Add styles */
}
</style>`;
  
  return {
    success: true,
    content,
    filename: `${name}.vue`
  };
}

function generateAngularComponent(name, features, language) {
  // Component file
  const componentContent = `import { Component, OnInit${features.includes('input') ? ', Input' : ''} } from '@angular/core';

@Component({
  selector: 'app-${name.toLowerCase()}',
  templateUrl: './${name.toLowerCase()}.component.html',
  styleUrls: ['./${name.toLowerCase()}.component.css']
})
export class ${name}Component implements OnInit {
  ${features.includes('input') ? `@Input() title: string = '${name} Component';` : ''}
  loading = false;

  constructor() { }

  ngOnInit(): void {
    // TODO: Add initialization logic
  }
}`;
  
  // Template file
  const templateContent = `<div class="${name.toLowerCase()}">
  <!-- TODO: Implement ${name} -->
  <h1>{{ title }}</h1>
  <ng-content></ng-content>
</div>`;
  
  // Style file
  const styleContent = `.${name.toLowerCase()} {
  /* TODO: Add styles */
}`;
  
  return {
    success: true,
    content: componentContent,
    filename: `${name.toLowerCase()}.component.ts`,
    additionalFiles: [
      {
        filename: `${name.toLowerCase()}.component.html`,
        content: templateContent
      },
      {
        filename: `${name.toLowerCase()}.component.css`,
        content: styleContent
      }
    ]
  };
}

function generateModuleStub(name, options) {
  const { language, features } = options;
  let content = '';
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      content = generateJSModule(name, features, language);
      break;
      
    case 'python':
      content = generatePythonModule(name, features);
      break;
      
    default:
      return {
        success: false,
        error: `Unsupported language for module: ${language}`
      };
  }
  
  return {
    success: true,
    content
  };
}

function generateJSModule(name, features, language) {
  const isTS = language === 'typescript';
  let content = '';
  
  // Module header
  content += `/**
 * ${capitalize(name)} Module
 * ${camelToSentence(name)}
 */\n\n`;
  
  // Private variables
  if (features.includes('state')) {
    content += '// Private state\n';
    content += `const state = {\n`;
    content += `  initialized: false,\n`;
    content += `  config: {}\n`;
    content += `};\n\n`;
  }
  
  // Initialize function
  content += `${features.includes('async') ? 'async ' : ''}function initialize(config${isTS ? ': any' : ''} = {})${isTS ? ': ' + (features.includes('async') ? 'Promise<void>' : 'void') : ''} {\n`;
  content += `  // TODO: Initialize module\n`;
  
  if (features.includes('state')) {
    content += `  state.config = config;\n`;
    content += `  state.initialized = true;\n`;
  }
  
  content += `}\n\n`;
  
  // Example functions
  content += `${features.includes('async') ? 'async ' : ''}function process(data${isTS ? ': any' : ''})${isTS ? ': ' + (features.includes('async') ? 'Promise<any>' : 'any') : ''} {\n`;
  content += `  // TODO: Process data\n`;
  content += `  return data;\n`;
  content += `}\n\n`;
  
  content += `function getStatus()${isTS ? ': any' : ''} {\n`;
  content += `  return {\n`;
  content += `    initialized: ${features.includes('state') ? 'state.initialized' : 'true'},\n`;
  content += `    // TODO: Add more status info\n`;
  content += `  };\n`;
  content += `}\n\n`;
  
  // Export
  if (isTS || features.includes('esm')) {
    content += `export {\n`;
    content += `  initialize,\n`;
    content += `  process,\n`;
    content += `  getStatus\n`;
    content += `};\n`;
  } else {
    content += `module.exports = {\n`;
    content += `  initialize,\n`;
    content += `  process,\n`;
    content += `  getStatus\n`;
    content += `};\n`;
  }
  
  return content;
}

function generatePythonModule(name, features) {
  let content = `"""${capitalize(name)} Module

${camelToSentence(name)}
"""\n\n`;
  
  // Imports
  if (features.includes('typing')) {
    content += 'from typing import Dict, Any\n\n';
  }
  
  // Module state
  if (features.includes('state')) {
    content += '# Module state\n';
    content += '_state = {\n';
    content += '    "initialized": False,\n';
    content += '    "config": {}\n';
    content += '}\n\n';
  }
  
  // Functions
  content += `${features.includes('async') ? 'async ' : ''}def initialize(config${features.includes('typing') ? ': Dict[str, Any]' : ''} = None):\n`;
  content += '    """Initialize the module"""\n';
  
  if (features.includes('state')) {
    content += '    global _state\n';
    content += '    _state["config"] = config or {}\n';
    content += '    _state["initialized"] = True\n';
  } else {
    content += '    # TODO: Initialize module\n';
    content += '    pass\n';
  }
  
  content += '\n\n';
  
  content += `${features.includes('async') ? 'async ' : ''}def process(data):\n`;
  content += '    """Process data"""\n';
  content += '    # TODO: Process data\n';
  content += '    return data\n\n';
  
  content += 'def get_status()';
  if (features.includes('typing')) {
    content += ' -> Dict[str, Any]';
  }
  content += ':\n';
  content += '    """Get module status"""\n';
  content += '    return {\n';
  content += `        "initialized": ${features.includes('state') ? '_state["initialized"]' : 'True'},\n`;
  content += '        # TODO: Add more status info\n';
  content += '    }\n\n';
  
  // __all__ export
  content += '__all__ = ["initialize", "process", "get_status"]\n';
  
  return content;
}

function generateAPIStub(name, options) {
  const { language, features } = options;
  
  // Only support JS/TS for now
  if (!['javascript', 'typescript'].includes(language)) {
    return {
      success: false,
      error: `API stub only supports JavaScript/TypeScript`
    };
  }
  
  const isExpress = features.includes('express');
  const isFastify = features.includes('fastify');
  const isKoa = features.includes('koa');
  
  if (!isExpress && !isFastify && !isKoa) {
    // Default to Express
    features.push('express');
  }
  
  if (features.includes('express')) {
    return generateExpressAPI(name, features, language);
  } else if (features.includes('fastify')) {
    return generateFastifyAPI(name, features, language);
  } else if (features.includes('koa')) {
    return generateKoaAPI(name, features, language);
  }
}

function generateExpressAPI(name, features, language) {
  const isTS = language === 'typescript';
  let content = '';
  
  // Imports
  content += `${isTS ? "import express, { Request, Response, NextFunction } from 'express';" : "const express = require('express');"}\n`;
  
  if (features.includes('router')) {
    content += `\nconst router = express.Router();\n\n`;
  } else {
    content += `\nconst app = express();\n\n`;
  }
  
  // Middleware
  if (!features.includes('router')) {
    content += '// Middleware\n';
    content += 'app.use(express.json());\n';
    content += 'app.use(express.urlencoded({ extended: true }));\n\n';
  }
  
  // Routes
  const base = features.includes('router') ? 'router' : 'app';
  
  // GET route
  content += `${base}.get('/${features.includes('router') ? '' : name}', ${isTS ? 'async (req: Request, res: Response) => {' : 'async (req, res) => {'}\n`;
  content += `  try {\n`;
  content += `    // TODO: Implement GET /${name}\n`;
  content += `    res.json({\n`;
  content += `      success: true,\n`;
  content += `      data: [],\n`;
  content += `      message: 'Retrieved ${name} successfully'\n`;
  content += `    });\n`;
  content += `  } catch (error) {\n`;
  content += `    res.status(500).json({\n`;
  content += `      success: false,\n`;
  content += `      error: error.message\n`;
  content += `    });\n`;
  content += `  }\n`;
  content += `});\n\n`;
  
  // POST route
  content += `${base}.post('/${features.includes('router') ? '' : name}', ${isTS ? 'async (req: Request, res: Response) => {' : 'async (req, res) => {'}\n`;
  content += `  try {\n`;
  content += `    // TODO: Validate request body\n`;
  content += `    const { data } = req.body;\n\n`;
  content += `    // TODO: Implement POST /${name}\n`;
  content += `    res.status(201).json({\n`;
  content += `      success: true,\n`;
  content += `      data: { id: Date.now(), ...data },\n`;
  content += `      message: 'Created ${name} successfully'\n`;
  content += `    });\n`;
  content += `  } catch (error) {\n`;
  content += `    res.status(500).json({\n`;
  content += `      success: false,\n`;
  content += `      error: error.message\n`;
  content += `    });\n`;
  content += `  }\n`;
  content += `});\n\n`;
  
  // Additional routes
  if (features.includes('crud')) {
    // PUT route
    content += `${base}.put('/${features.includes('router') ? ':id' : name + '/:id'}', ${isTS ? 'async (req: Request, res: Response) => {' : 'async (req, res) => {'}\n`;
    content += `  try {\n`;
    content += `    const { id } = req.params;\n`;
    content += `    const { data } = req.body;\n\n`;
    content += `    // TODO: Implement PUT /${name}/:id\n`;
    content += `    res.json({\n`;
    content += `      success: true,\n`;
    content += `      data: { id, ...data },\n`;
    content += `      message: 'Updated ${name} successfully'\n`;
    content += `    });\n`;
    content += `  } catch (error) {\n`;
    content += `    res.status(500).json({\n`;
    content += `      success: false,\n`;
    content += `      error: error.message\n`;
    content += `    });\n`;
    content += `  }\n`;
    content += `});\n\n`;
    
    // DELETE route
    content += `${base}.delete('/${features.includes('router') ? ':id' : name + '/:id'}', ${isTS ? 'async (req: Request, res: Response) => {' : 'async (req, res) => {'}\n`;
    content += `  try {\n`;
    content += `    const { id } = req.params;\n\n`;
    content += `    // TODO: Implement DELETE /${name}/:id\n`;
    content += `    res.json({\n`;
    content += `      success: true,\n`;
    content += `      message: 'Deleted ${name} successfully'\n`;
    content += `    });\n`;
    content += `  } catch (error) {\n`;
    content += `    res.status(500).json({\n`;
    content += `      success: false,\n`;
    content += `      error: error.message\n`;
    content += `    });\n`;
    content += `  }\n`;
    content += `});\n\n`;
  }
  
  // Export or start server
  if (features.includes('router')) {
    content += `${isTS ? 'export default' : 'module.exports ='} router;\n`;
  } else {
    content += `const PORT = process.env.PORT || 3000;\n\n`;
    content += `app.listen(PORT, () => {\n`;
    content += `  console.log(\`Server running on port \${PORT}\`);\n`;
    content += `});\n`;
  }
  
  return {
    success: true,
    content,
    filename: features.includes('router') ? `${name}.routes.${isTS ? 'ts' : 'js'}` : `${name}.${isTS ? 'ts' : 'js'}`
  };
}

function generateTestStub(name, options) {
  const { language, features } = options;
  
  // Detect test framework
  const isJest = features.includes('jest');
  const isMocha = features.includes('mocha');
  const isVitest = features.includes('vitest');
  
  if (!isJest && !isMocha && !isVitest) {
    // Default to Jest
    features.push('jest');
  }
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      return generateJSTest(name, features, language);
      
    case 'python':
      return generatePythonTest(name, features);
      
    default:
      return {
        success: false,
        error: `Unsupported language for test: ${language}`
      };
  }
}

function generateJSTest(name, features, language) {
  const isTS = language === 'typescript';
  const isJest = features.includes('jest');
  const isMocha = features.includes('mocha');
  let content = '';
  
  // Imports
  if (isMocha) {
    content += `const { expect } = require('chai');\n`;
  } else if (features.includes('vitest')) {
    content += `import { describe, test, expect, beforeEach, afterEach } from 'vitest';\n`;
  }
  
  content += `${isTS || features.includes('esm') ? 'import' : 'const'} ${name} ${isTS || features.includes('esm') ? 'from' : '='} './${name}';\n\n`;
  
  // Test suite
  content += `describe('${capitalize(name)}', () => {\n`;
  
  // Setup/teardown
  if (features.includes('setup')) {
    content += `  ${isJest || features.includes('vitest') ? 'beforeEach' : 'beforeEach'}(() => {\n`;
    content += `    // TODO: Setup before each test\n`;
    content += `  });\n\n`;
    
    content += `  ${isJest || features.includes('vitest') ? 'afterEach' : 'afterEach'}(() => {\n`;
    content += `    // TODO: Cleanup after each test\n`;
    content += `  });\n\n`;
  }
  
  // Basic test
  content += `  ${isJest || features.includes('vitest') ? 'test' : 'it'}('should exist', () => {\n`;
  content += `    expect(${name}).${isMocha ? 'to.exist' : 'toBeDefined()'};\n`;
  content += `  });\n\n`;
  
  // Function test
  content += `  ${isJest || features.includes('vitest') ? 'test' : 'it'}('should process data correctly', ${features.includes('async') ? 'async ' : ''}() => {\n`;
  content += `    // Arrange\n`;
  content += `    const input = { test: true };\n\n`;
  content += `    // Act\n`;
  content += `    const result = ${features.includes('async') ? 'await ' : ''}${name}${typeof name === 'string' && name.match(/^[A-Z]/) ? '.process' : ''}(input);\n\n`;
  content += `    // Assert\n`;
  
  if (isMocha) {
    content += `    expect(result).to.be.an('object');\n`;
    content += `    expect(result.test).to.equal(true);\n`;
  } else {
    content += `    expect(result).toBeInstanceOf(Object);\n`;
    content += `    expect(result.test).toBe(true);\n`;
  }
  
  content += `  });\n\n`;
  
  // Error handling test
  if (features.includes('error-handling')) {
    content += `  ${isJest || features.includes('vitest') ? 'test' : 'it'}('should handle errors gracefully', ${features.includes('async') ? 'async ' : ''}() => {\n`;
    content += `    // Arrange\n`;
    content += `    const invalidInput = null;\n\n`;
    content += `    // Act & Assert\n`;
    
    if (features.includes('async')) {
      if (isMocha) {
        content += `    try {\n`;
        content += `      await ${name}(invalidInput);\n`;
        content += `      expect.fail('Should have thrown an error');\n`;
        content += `    } catch (error) {\n`;
        content += `      expect(error).to.be.an('error');\n`;
        content += `    }\n`;
      } else {
        content += `    await expect(${name}(invalidInput)).rejects.toThrow();\n`;
      }
    } else {
      if (isMocha) {
        content += `    expect(() => ${name}(invalidInput)).to.throw();\n`;
      } else {
        content += `    expect(() => ${name}(invalidInput)).toThrow();\n`;
      }
    }
    
    content += `  });\n`;
  }
  
  content += `});\n`;
  
  return {
    success: true,
    content,
    filename: `${name}.test.${isTS ? 'ts' : 'js'}`
  };
}

function generatePythonTest(name, features) {
  let content = '';
  
  // Imports
  if (features.includes('pytest')) {
    content += 'import pytest\n';
  } else {
    content += 'import unittest\n';
  }
  
  if (features.includes('async')) {
    content += 'import asyncio\n';
  }
  
  content += `from ${name} import *\n\n`;
  
  if (features.includes('pytest')) {
    // Pytest style
    if (features.includes('fixture')) {
      content += '@pytest.fixture\n';
      content += 'def setup_data():\n';
      content += '    """Setup test data"""\n';
      content += '    return {"test": True}\n\n';
    }
    
    content += `def test_${name}_exists():\n`;
    content += `    """Test that module exists"""\n`;
    content += `    assert ${name} is not None\n\n`;
    
    content += `${features.includes('async') ? 'async ' : ''}def test_process_data${features.includes('fixture') ? '(setup_data)' : '()'}():\n`;
    content += `    """Test data processing"""\n`;
    content += `    # Arrange\n`;
    content += `    input_data = ${features.includes('fixture') ? 'setup_data' : '{"test": True}'}\n\n`;
    content += `    # Act\n`;
    content += `    result = ${features.includes('async') ? 'await ' : ''}process(input_data)\n\n`;
    content += `    # Assert\n`;
    content += `    assert isinstance(result, dict)\n`;
    content += `    assert result["test"] is True\n\n`;
    
    if (features.includes('error-handling')) {
      content += `def test_handle_errors():\n`;
      content += `    """Test error handling"""\n`;
      content += `    with pytest.raises(Exception):\n`;
      content += `        process(None)\n`;
    }
  } else {
    // Unittest style
    content += `class Test${capitalize(name)}(unittest.TestCase):\n`;
    content += `    """Test cases for ${name}"""\n\n`;
    
    if (features.includes('setup')) {
      content += `    def setUp(self):\n`;
      content += `        """Setup before each test"""\n`;
      content += `        self.test_data = {"test": True}\n\n`;
      
      content += `    def tearDown(self):\n`;
      content += `        """Cleanup after each test"""\n`;
      content += `        pass\n\n`;
    }
    
    content += `    def test_exists(self):\n`;
    content += `        """Test that module exists"""\n`;
    content += `        self.assertIsNotNone(${name})\n\n`;
    
    content += `    ${features.includes('async') ? 'async ' : ''}def test_process_data(self):\n`;
    content += `        """Test data processing"""\n`;
    content += `        # Arrange\n`;
    content += `        input_data = ${features.includes('setup') ? 'self.test_data' : '{"test": True}'}\n\n`;
    content += `        # Act\n`;
    content += `        result = ${features.includes('async') ? 'await ' : ''}process(input_data)\n\n`;
    content += `        # Assert\n`;
    content += `        self.assertIsInstance(result, dict)\n`;
    content += `        self.assertTrue(result["test"])\n\n`;
    
    if (features.includes('error-handling')) {
      content += `    def test_handle_errors(self):\n`;
      content += `        """Test error handling"""\n`;
      content += `        with self.assertRaises(Exception):\n`;
      content += `            process(None)\n\n`;
    }
    
    content += `if __name__ == '__main__':\n`;
    content += `    unittest.main()\n`;
  }
  
  return {
    success: true,
    content,
    filename: `test_${name}.py`
  };
}

function generateScriptStub(name, options) {
  const { language, features } = options;
  
  switch (language) {
    case 'javascript':
      return generateJSScript(name, features);
      
    case 'bash':
      return generateBashScript(name, features);
      
    case 'python':
      return generatePythonScript(name, features);
      
    default:
      return {
        success: false,
        error: `Unsupported language for script: ${language}`
      };
  }
}

function generateJSScript(name, features) {
  let content = '#!/usr/bin/env node\n\n';
  
  // Script header
  content += `/**
 * ${capitalize(name)} Script
 * ${camelToSentence(name)}
 */\n\n`;
  
  // Imports
  if (features.includes('cli')) {
    content += `const { program } = require('commander');\n`;
  }
  
  content += `const path = require('path');\n`;
  content += `const fs = require('fs').promises;\n\n`;
  
  // CLI setup
  if (features.includes('cli')) {
    content += `program\n`;
    content += `  .name('${name}')\n`;
    content += `  .description('${camelToSentence(name)}')\n`;
    content += `  .version('1.0.0')\n`;
    content += `  .option('-i, --input <path>', 'input file path')\n`;
    content += `  .option('-o, --output <path>', 'output file path')\n`;
    content += `  .option('-v, --verbose', 'verbose output')\n`;
    content += `  .parse(process.argv);\n\n`;
    content += `const options = program.opts();\n\n`;
  }
  
  // Main function
  content += `async function main() {\n`;
  
  if (features.includes('error-handling')) {
    content += `  try {\n`;
    content += `    console.log('Running ${name}...');\n\n`;
    content += `    // TODO: Implement script logic\n`;
    
    if (features.includes('cli')) {
      content += `    if (options.input) {\n`;
      content += `      const data = await fs.readFile(options.input, 'utf8');\n`;
      content += `      console.log('Read', data.length, 'bytes');\n`;
      content += `    }\n\n`;
    }
    
    content += `    console.log('${name} completed successfully!');\n`;
    content += `  } catch (error) {\n`;
    content += `    console.error('Error:', error.message);\n`;
    content += `    process.exit(1);\n`;
    content += `  }\n`;
  } else {
    content += `  console.log('Running ${name}...');\n\n`;
    content += `  // TODO: Implement script logic\n\n`;
    content += `  console.log('${name} completed successfully!');\n`;
  }
  
  content += `}\n\n`;
  
  // Run main
  content += `// Run if called directly\n`;
  content += `if (require.main === module) {\n`;
  content += `  main();\n`;
  content += `}\n\n`;
  content += `module.exports = main;\n`;
  
  return {
    success: true,
    content
  };
}

function generateBashScript(name, features) {
  let content = '#!/bin/bash\n\n';
  
  // Script header
  content += `# ${capitalize(name)} Script\n`;
  content += `# ${camelToSentence(name)}\n\n`;
  
  // Set options
  if (features.includes('strict')) {
    content += 'set -euo pipefail\n\n';
  }
  
  // Variables
  content += '# Configuration\n';
  content += `SCRIPT_NAME="${name}"\n`;
  content += 'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"\n\n';
  
  // Functions
  if (features.includes('logging')) {
    content += '# Logging functions\n';
    content += 'log() { echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*"; }\n';
    content += 'error() { echo "[ERROR] $*" >&2; }\n\n';
  }
  
  if (features.includes('help')) {
    content += 'usage() {\n';
    content += '    cat << EOF\n';
    content += `Usage: $0 [OPTIONS]\n\n`;
    content += `${camelToSentence(name)}\n\n`;
    content += 'Options:\n';
    content += '    -h, --help     Show this help message\n';
    content += '    -v, --verbose  Verbose output\n';
    content += '    -d, --debug    Debug mode\n';
    content += 'EOF\n';
    content += '}\n\n';
  }
  
  // Parse arguments
  if (features.includes('args')) {
    content += '# Parse arguments\n';
    content += 'VERBOSE=false\n';
    content += 'DEBUG=false\n\n';
    content += 'while [[ $# -gt 0 ]]; do\n';
    content += '    case $1 in\n';
    content += '        -h|--help)\n';
    content += '            usage\n';
    content += '            exit 0\n';
    content += '            ;;\n';
    content += '        -v|--verbose)\n';
    content += '            VERBOSE=true\n';
    content += '            shift\n';
    content += '            ;;\n';
    content += '        -d|--debug)\n';
    content += '            DEBUG=true\n';
    content += '            set -x\n';
    content += '            shift\n';
    content += '            ;;\n';
    content += '        *)\n';
    content += '            echo "Unknown option: $1"\n';
    content += '            usage\n';
    content += '            exit 1\n';
    content += '            ;;\n';
    content += '    esac\n';
    content += 'done\n\n';
  }
  
  // Main logic
  content += '# Main script logic\n';
  content += 'main() {\n';
  
  if (features.includes('logging')) {
    content += `    log "Starting $SCRIPT_NAME..."\n\n`;
  } else {
    content += `    echo "Starting $SCRIPT_NAME..."\n\n`;
  }
  
  content += '    # TODO: Implement script logic\n\n';
  
  if (features.includes('logging')) {
    content += `    log "$SCRIPT_NAME completed successfully!"\n`;
  } else {
    content += `    echo "$SCRIPT_NAME completed successfully!"\n`;
  }
  
  content += '}\n\n';
  
  // Run main
  content += '# Run main function\n';
  content += 'main "$@"\n';
  
  return {
    success: true,
    content,
    filename: name  // No extension for bash scripts
  };
}

function generatePythonScript(name, features) {
  let content = '#!/usr/bin/env python3\n';
  
  // Script header
  content += `"""${capitalize(name)} Script\n\n`;
  content += `${camelToSentence(name)}\n`;
  content += '"""\n\n';
  
  // Imports
  content += 'import sys\n';
  content += 'import os\n';
  
  if (features.includes('cli')) {
    content += 'import argparse\n';
  }
  
  if (features.includes('logging')) {
    content += 'import logging\n';
  }
  
  if (features.includes('async')) {
    content += 'import asyncio\n';
  }
  
  content += '\n';
  
  // Logging setup
  if (features.includes('logging')) {
    content += '# Setup logging\n';
    content += 'logging.basicConfig(\n';
    content += '    level=logging.INFO,\n';
    content += '    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"\n';
    content += ')\n';
    content += 'logger = logging.getLogger(__name__)\n\n';
  }
  
  // Main function
  content += `${features.includes('async') ? 'async ' : ''}def main():\n`;
  content += '    """Main script logic"""\n';
  
  if (features.includes('cli')) {
    content += '    parser = argparse.ArgumentParser(\n';
    content += `        description="${camelToSentence(name)}"\n`;
    content += '    )\n';
    content += '    parser.add_argument(\n';
    content += '        "-i", "--input",\n';
    content += '        help="Input file path"\n';
    content += '    )\n';
    content += '    parser.add_argument(\n';
    content += '        "-o", "--output",\n';
    content += '        help="Output file path"\n';
    content += '    )\n';
    content += '    parser.add_argument(\n';
    content += '        "-v", "--verbose",\n';
    content += '        action="store_true",\n';
    content += '        help="Verbose output"\n';
    content += '    )\n';
    content += '    args = parser.parse_args()\n\n';
    
    if (features.includes('logging')) {
      content += '    if args.verbose:\n';
      content += '        logging.getLogger().setLevel(logging.DEBUG)\n\n';
    }
  }
  
  if (features.includes('logging')) {
    content += `    logger.info("Starting ${name}...")\n\n`;
  } else {
    content += `    print("Starting ${name}...")\n\n`;
  }
  
  content += '    # TODO: Implement script logic\n\n';
  
  if (features.includes('cli')) {
    content += '    if args.input:\n';
    content += '        with open(args.input, "r") as f:\n';
    content += '            data = f.read()\n';
    
    if (features.includes('logging')) {
      content += '            logger.info(f"Read {len(data)} bytes from {args.input}")\n\n';
    } else {
      content += '            print(f"Read {len(data)} bytes from {args.input}")\n\n';
    }
  }
  
  if (features.includes('logging')) {
    content += `    logger.info("${name} completed successfully!")\n`;
  } else {
    content += `    print("${name} completed successfully!")\n`;
  }
  
  content += '\n\n';
  
  // Entry point
  content += 'if __name__ == "__main__":\n';
  
  if (features.includes('error-handling')) {
    content += '    try:\n';
    
    if (features.includes('async')) {
      content += '        asyncio.run(main())\n';
    } else {
      content += '        main()\n';
    }
    
    content += '    except KeyboardInterrupt:\n';
    content += '        print("\\nInterrupted by user")\n';
    content += '        sys.exit(1)\n';
    content += '    except Exception as e:\n';
    
    if (features.includes('logging')) {
      content += '        logger.error(f"Error: {e}", exc_info=True)\n';
    } else {
      content += '        print(f"Error: {e}", file=sys.stderr)\n';
    }
    
    content += '        sys.exit(1)\n';
  } else {
    if (features.includes('async')) {
      content += '    asyncio.run(main())\n';
    } else {
      content += '    main()\n';
  }
  
  return {
    success: true,
    content,
    filename: `${name}.py`
  };
}

function generateConfigStub(name, options) {
  const { language, features } = options;
  
  // Config can be in various formats
  const format = features.includes('json') ? 'json' :
                features.includes('yaml') ? 'yaml' :
                features.includes('toml') ? 'toml' :
                features.includes('ini') ? 'ini' :
                features.includes('env') ? 'env' : 'json';
  
  switch (format) {
    case 'json':
      return generateJSONConfig(name, features);
      
    case 'yaml':
      return generateYAMLConfig(name, features);
      
    case 'toml':
      return generateTOMLConfig(name, features);
      
    case 'ini':
      return generateINIConfig(name, features);
      
    case 'env':
      return generateENVConfig(name, features);
      
    default:
      return generateJSONConfig(name, features);
  }
}

function generateJSONConfig(name, features) {
  const config = {
    name: name,
    version: "1.0.0",
    description: camelToSentence(name),
    environment: features.includes('multi-env') ? {
      development: {
        debug: true,
        logLevel: "debug"
      },
      production: {
        debug: false,
        logLevel: "error"
      }
    } : {
      debug: false,
      logLevel: "info"
    }
  };
  
  if (features.includes('database')) {
    config.database = {
      host: "localhost",
      port: 5432,
      name: name,
      user: "dbuser",
      password: "changeme"
    };
  }
  
  if (features.includes('api')) {
    config.api = {
      port: 3000,
      host: "0.0.0.0",
      cors: {
        enabled: true,
        origins: ["*"]
      }
    };
  }
  
  if (features.includes('auth')) {
    config.auth = {
      secret: "change-this-secret",
      tokenExpiry: "24h",
      refreshTokenExpiry: "7d"
    };
  }
  
  const content = JSON.stringify(config, null, 2);
  
  return {
    success: true,
    content,
    filename: `${name}.config.json`
  };
}

function generateYAMLConfig(name, features) {
  let content = `# ${capitalize(name)} Configuration\n\n`;
  
  content += `name: ${name}\n`;
  content += `version: 1.0.0\n`;
  content += `description: ${camelToSentence(name)}\n\n`;
  
  if (features.includes('multi-env')) {
    content += `# Environment-specific settings\n`;
    content += `environments:\n`;
    content += `  development:\n`;
    content += `    debug: true\n`;
    content += `    logLevel: debug\n`;
    content += `  production:\n`;
    content += `    debug: false\n`;
    content += `    logLevel: error\n`;
  } else {
    content += `# General settings\n`;
    content += `debug: false\n`;
    content += `logLevel: info\n`;
  }
  
  content += `\n`;
  
  if (features.includes('database')) {
    content += `# Database configuration\n`;
    content += `database:\n`;
    content += `  host: localhost\n`;
    content += `  port: 5432\n`;
    content += `  name: ${name}\n`;
    content += `  user: dbuser\n`;
    content += `  password: changeme\n\n`;
  }
  
  if (features.includes('api')) {
    content += `# API configuration\n`;
    content += `api:\n`;
    content += `  port: 3000\n`;
    content += `  host: 0.0.0.0\n`;
    content += `  cors:\n`;
    content += `    enabled: true\n`;
    content += `    origins:\n`;
    content += `      - "*"\n\n`;
  }
  
  return {
    success: true,
    content,
    filename: `${name}.config.yaml`
  };
}

function generateTOMLConfig(name, features) {
  let content = `# ${capitalize(name)} Configuration\n\n`;
  
  content += `[main]\n`;
  content += `name = "${name}"\n`;
  content += `version = "1.0.0"\n`;
  content += `description = "${camelToSentence(name)}"\n\n`;
  
  if (features.includes('multi-env')) {
    content += `[environments.development]\n`;
    content += `debug = true\n`;
    content += `log_level = "debug"\n\n`;
    content += `[environments.production]\n`;
    content += `debug = false\n`;
    content += `log_level = "error"\n\n`;
  } else {
    content += `[general]\n`;
    content += `debug = false\n`;
    content += `log_level = "info"\n\n`;
  }
  
  if (features.includes('database')) {
    content += `[database]\n`;
    content += `host = "localhost"\n`;
    content += `port = 5432\n`;
    content += `name = "${name}"\n`;
    content += `user = "dbuser"\n`;
    content += `password = "changeme"\n\n`;
  }
  
  return {
    success: true,
    content,
    filename: `${name}.config.toml`
  };
}

function generateINIConfig(name, features) {
  let content = `; ${capitalize(name)} Configuration\n\n`;
  
  content += `[main]\n`;
  content += `name = ${name}\n`;
  content += `version = 1.0.0\n`;
  content += `description = ${camelToSentence(name)}\n\n`;
  
  content += `[general]\n`;
  content += `debug = false\n`;
  content += `log_level = info\n\n`;
  
  if (features.includes('database')) {
    content += `[database]\n`;
    content += `host = localhost\n`;
    content += `port = 5432\n`;
    content += `name = ${name}\n`;
    content += `user = dbuser\n`;
    content += `password = changeme\n\n`;
  }
  
  return {
    success: true,
    content,
    filename: `${name}.ini`
  };
}

function generateENVConfig(name, features) {
  let content = `# ${capitalize(name)} Environment Variables\n\n`;
  
  content += `# Application\n`;
  content += `APP_NAME=${name}\n`;
  content += `APP_VERSION=1.0.0\n`;
  content += `NODE_ENV=development\n`;
  content += `DEBUG=false\n`;
  content += `LOG_LEVEL=info\n\n`;
  
  if (features.includes('database')) {
    content += `# Database\n`;
    content += `DB_HOST=localhost\n`;
    content += `DB_PORT=5432\n`;
    content += `DB_NAME=${name}\n`;
    content += `DB_USER=dbuser\n`;
    content += `DB_PASSWORD=changeme\n\n`;
  }
  
  if (features.includes('api')) {
    content += `# API\n`;
    content += `API_PORT=3000\n`;
    content += `API_HOST=0.0.0.0\n`;
    content += `CORS_ENABLED=true\n`;
    content += `CORS_ORIGINS=*\n\n`;
  }
  
  if (features.includes('auth')) {
    content += `# Authentication\n`;
    content += `JWT_SECRET=change-this-secret\n`;
    content += `TOKEN_EXPIRY=24h\n`;
    content += `REFRESH_TOKEN_EXPIRY=7d\n`;
  }
  
  return {
    success: true,
    content,
    filename: '.env'
  };
}

async function generateCustomStub(name, template, options) {
  // Process custom template
  const processedTemplate = template
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{Name\}\}/g, capitalize(name))
    .replace(/\{\{NAME\}\}/g, name.toUpperCase())
    .replace(/\{\{description\}\}/g, camelToSentence(name));
  
  return {
    success: true,
    content: processedTemplate
  };
}

// Helper functions
function getFileExtension(language, type) {
  const extensions = {
    javascript: '.js',
    typescript: '.ts',
    python: '.py',
    bash: '.sh',
    java: '.java',
    csharp: '.cs',
    go: '.go',
    rust: '.rs'
  };
  
  // Special cases
  if (type === 'component' && language === 'typescript') {
    return '.tsx';
  }
  
  if (type === 'script' && language === 'bash') {
    return ''; // No extension for bash scripts
  }
  
  return extensions[language] || '.txt';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelToSentence(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}