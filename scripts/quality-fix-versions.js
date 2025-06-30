// quality-fix-versions.js - Fix version issues in package.json
import { promises as fs } from 'fs';
import { execSync } from 'child_process';

export async function run(args = {}) {
  const { 
    exact = true,
    update = false,
    dryRun = false,
    modules = {} 
  } = args;
  
  console.error('[QUALITY-FIX-VERSIONS] Fixing version issues...');
  
  try {
    // Read package.json
    const packagePath = './package.json';
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const fixes = [];
    const issues = [];
    
    // Check dependencies
    const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];
    
    for (const depType of depTypes) {
      const deps = packageJson[depType] || {};
      
      for (const [name, version] of Object.entries(deps)) {
        // Check for version ranges
        if (version.includes('^') || version.includes('~')) {
          issues.push({
            type: 'range',
            depType,
            name,
            current: version
          });
          
          if (exact && !dryRun) {
            // Remove ^ or ~ to make exact
            const exactVersion = version.replace(/^[\^~]/, '');
            deps[name] = exactVersion;
            fixes.push({
              name,
              from: version,
              to: exactVersion,
              reason: 'Made version exact'
            });
          }
        }
        
        // Check for wildcards
        if (version.includes('*') || version === 'latest') {
          issues.push({
            type: 'wildcard',
            depType,
            name,
            current: version
          });
          
          if (!dryRun) {
            // Get actual version
            try {
              const info = execSync(`npm view ${name} version`, { encoding: 'utf8' }).trim();
              deps[name] = info;
              fixes.push({
                name,
                from: version,
                to: info,
                reason: 'Resolved wildcard version'
              });
            } catch {
              // Can't resolve, keep as is
            }
          }
        }
      }
    }
    
    // Check for missing fields
    const requiredFields = ['name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!packageJson[field]) {
        issues.push({
          type: 'missing-field',
          field
        });
        
        if (!dryRun) {
          switch (field) {
            case 'name':
              packageJson.name = path.basename(process.cwd());
              break;
            case 'version':
              packageJson.version = '1.0.0';
              break;
            case 'description':
              packageJson.description = 'Apex Hive project';
              break;
          }
          fixes.push({
            field,
            action: 'added',
            value: packageJson[field]
          });
        }
      }
    }
    
    // Update outdated packages if requested
    if (update && !dryRun) {
      console.error('[QUALITY-FIX-VERSIONS] Checking for outdated packages...');
      try {
        const outdated = execSync('npm outdated --json', { 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr
        });
        
        if (outdated) {
          const outdatedPackages = JSON.parse(outdated);
          for (const [name, info of Object.entries(outdatedPackages)) {
            const depType = info.type || 'dependencies';
            if (packageJson[depType]?.[name]) {
              packageJson[depType][name] = info.latest;
              fixes.push({
                name,
                from: info.current,
                to: info.latest,
                reason: 'Updated to latest'
              });
            }
          }
        }
      } catch {
        // No outdated packages or npm failed
      }
    }
    
    // Write back if changes were made
    if (fixes.length > 0 && !dryRun) {
      const newContent = JSON.stringify(packageJson, null, 2) + '\n';
      await fs.writeFile(packagePath, newContent);
      
      // Update lock file
      console.error('[QUALITY-FIX-VERSIONS] Updating lock file...');
      try {
        execSync('npm install', { stdio: 'pipe' });
      } catch {
        // Lock file update failed, but package.json is fixed
      }
    }
    
    return {
      success: true,
      dryRun,
      data: {
        issues: issues.length,
        fixed: fixes.length,
        fixes,
        issueDetails: issues
      },
      message: dryRun
        ? `Found ${issues.length} version issues`
        : `Fixed ${fixes.length} version issues`
    };
    
  } catch (error) {
    console.error('[QUALITY-FIX-VERSIONS] Error:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fix version issues'
    };
  }
}