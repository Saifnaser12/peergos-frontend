#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

/**
 * Package the backend for distribution
 */
function packageBackend() {
  console.log('📦 Packaging backend for distribution...');
  
  try {
    // Generate timestamp
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const packageName = `peergos-backend-${timestamp}.tar.gz`;
    
    // Create package
    const command = `tar -czf "${packageName}" ` +
      `--exclude="node_modules" ` +
      `--exclude=".git" ` +
      `--exclude="*.map" ` +
      `--exclude="*.log" ` +
      `dist package.json package-lock.json tsconfig.json .env.example ` +
      `MANIFEST.json PARITY_REPORT.md README.md`;
    
    console.log('🔨 Creating package...');
    execSync(command);
    
    // Get package info
    const stats = fs.statSync(packageName);
    const sizeKB = Math.round(stats.size / 1024);
    
    // Count files
    const listCommand = `tar -tzf "${packageName}" | wc -l`;
    const fileCount = execSync(listCommand, { encoding: 'utf-8' }).trim();
    
    console.log('✅ Package created successfully');
    console.log(`📦 PACKAGE: ${packageName} (${sizeKB} KB)`);
    console.log(`📁 LOCATION: ${process.cwd()}/`);
    console.log(`📊 FILES: ${fileCount} files included`);
    
    // List first few files
    console.log('\n📋 Package contents (first 10):');
    const listFiles = execSync(`tar -tzf "${packageName}" | head -10`, { encoding: 'utf-8' });
    console.log(listFiles);
    
    return packageName;
    
  } catch (error) {
    console.error('❌ Packaging failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  packageBackend();
}

export { packageBackend };