#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Export comprehensive manifest
 */
function exportManifest() {
  console.log('📋 Generating system manifest...');
  
  try {
    // Get system information
    const nodeVersion = process.version;
    
    let tsVersion = 'unknown';
    try {
      tsVersion = execSync('npx tsc --version', { encoding: 'utf-8' }).trim();
    } catch {}
    
    // Read package.json
    const packagePath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    // Get routes
    const routesPath = path.join(__dirname, 'REFERENCE_ROUTES.json');
    const routes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
    
    // Get schemas
    const schemasPath = path.join(__dirname, 'REFERENCE_SCHEMAS.json');
    const schemas = JSON.parse(fs.readFileSync(schemasPath, 'utf-8'));
    
    // Generate manifest
    const manifest = {
      metadata: {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        generated: new Date().toISOString(),
        node_version: nodeVersion,
        typescript_version: tsVersion
      },
      system: {
        architecture: process.arch,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      dependencies: {
        production: packageJson.dependencies || {},
        development: packageJson.devDependencies || {}
      },
      api: {
        total_routes: routes.length,
        routes_by_method: routes.reduce((acc: any, route: any) => {
          acc[route.method] = (acc[route.method] || 0) + 1;
          return acc;
        }, {}),
        controllers: [...new Set(routes.map((r: any) => r.controller))]
      },
      database: {
        total_tables: schemas.tables.length,
        total_enums: schemas.enums.length,
        tables: schemas.tables.map((t: any) => ({
          name: t.name,
          column_count: t.columns.length
        }))
      },
      scripts: {
        available: Object.keys(packageJson.scripts || {}),
        verification_suite: [
          'verify:routes',
          'verify:schemas', 
          'verify:seeds',
          'verify:env',
          'verify:auth',
          'verify:jobs',
          'verify:cfg',
          'verify:all'
        ]
      },
      health: {
        status: 'manifest_generated',
        timestamp: new Date().toISOString()
      }
    };
    
    // Write manifest
    fs.writeFileSync('MANIFEST.json', JSON.stringify(manifest, null, 2));
    
    console.log('✅ Manifest generated successfully');
    console.log(`📊 Summary:`);
    console.log(`   Routes: ${manifest.api.total_routes}`);
    console.log(`   Tables: ${manifest.database.total_tables}`);
    console.log(`   Dependencies: ${Object.keys(manifest.dependencies.production).length} prod, ${Object.keys(manifest.dependencies.development).length} dev`);
    console.log(`📄 Output: MANIFEST.json`);
    
  } catch (error) {
    console.error('❌ Manifest generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  exportManifest();
}

export { exportManifest };