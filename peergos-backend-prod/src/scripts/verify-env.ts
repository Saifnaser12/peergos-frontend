#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Verify all environment variables are documented
 */
function verifyEnv(): boolean {
  console.log('🔧 Verifying environment variable coverage...');
  
  try {
    // Read .env.example
    const envExamplePath = path.join(__dirname, '../../.env.example');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
    const documentedVars = envExampleContent
      .split('\n')
      .filter(line => line.includes('='))
      .map(line => line.split('=')[0].trim());
    
    // Scan source code for process.env usage
    const srcDir = path.join(__dirname, '..');
    const usedVars = new Set<string>();
    
    function scanDirectory(dir: string) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const envRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
          
          let match;
          while ((match = envRegex.exec(content)) !== null) {
            usedVars.add(match[1]);
          }
        }
      }
    }
    
    scanDirectory(srcDir);
    
    // Find missing variables
    const usedVarsArray = Array.from(usedVars);
    const missingVars = usedVarsArray.filter(varName => 
      !documentedVars.includes(varName)
    );
    
    // Report results
    console.log('📋 Environment variables analysis:');
    console.log(`   Documented: ${documentedVars.length} variables`);
    console.log(`   Used in code: ${usedVarsArray.length} variables`);
    console.log(`   Missing from .env.example: ${missingVars.length} variables`);
    
    if (missingVars.length > 0) {
      console.log('\n❌ Missing variables:');
      missingVars.forEach(varName => {
        console.log(`   ${varName}`);
      });
    }
    
    if (documentedVars.length > 0) {
      console.log('\n✅ Documented variables:');
      documentedVars.slice(0, 5).forEach(varName => {
        console.log(`   ${varName}`);
      });
      if (documentedVars.length > 5) {
        console.log(`   ... and ${documentedVars.length - 5} more`);
      }
    }
    
    const passed = missingVars.length === 0;
    console.log(`\n${passed ? '✅' : '❌'} Environment verification: ${passed ? 'PASS' : 'FAIL'}`);
    
    return passed;
    
  } catch (error) {
    console.error('❌ Environment verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const passed = verifyEnv();
  process.exit(passed ? 0 : 1);
}

export { verifyEnv };