#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

interface Route {
  method: string;
  path: string;
  controller: string;
}

/**
 * Verify all required routes are implemented
 */
function verifyRoutes(): boolean {
  console.log('🔍 Verifying route parity...');
  
  try {
    // Read reference routes
    const referenceRoutesPath = path.join(__dirname, 'REFERENCE_ROUTES.json');
    const referenceRoutes: Route[] = JSON.parse(fs.readFileSync(referenceRoutesPath, 'utf-8'));
    
    // Scan implementation for routes
    const routesFile = path.join(__dirname, '../routes/index.ts');
    const routesContent = fs.readFileSync(routesFile, 'utf-8');
    
    const discoveredRoutes: Route[] = [];
    const routeRegex = /router\.(get|post|patch|put|delete)\(['"](.*?)['"],/g;
    
    let match;
    while ((match = routeRegex.exec(routesContent)) !== null) {
      discoveredRoutes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        controller: 'implemented'
      });
    }
    
    // Compare routes
    const missing: Route[] = [];
    const extra: Route[] = [];
    
    for (const refRoute of referenceRoutes) {
      const found = discoveredRoutes.find(r => 
        r.method === refRoute.method && r.path === refRoute.path
      );
      if (!found) {
        missing.push(refRoute);
      }
    }
    
    for (const implRoute of discoveredRoutes) {
      const found = referenceRoutes.find(r => 
        r.method === implRoute.method && r.path === implRoute.path
      );
      if (!found) {
        extra.push(implRoute);
      }
    }
    
    // Report results
    console.log(`📊 Route Analysis:`);
    console.log(`   Reference: ${referenceRoutes.length} routes`);
    console.log(`   Discovered: ${discoveredRoutes.length} routes`);
    console.log(`   Missing: ${missing.length} routes`);
    console.log(`   Extra: ${extra.length} routes`);
    
    if (missing.length > 0) {
      console.log('\n❌ Missing routes:');
      missing.forEach(route => {
        console.log(`   ${route.method} ${route.path}`);
      });
    }
    
    if (extra.length > 0) {
      console.log('\n➕ Extra routes (not in reference):');
      extra.forEach(route => {
        console.log(`   ${route.method} ${route.path}`);
      });
    }
    
    const passed = missing.length === 0;
    console.log(`\n${passed ? '✅' : '❌'} Route verification: ${passed ? 'PASS' : 'FAIL'}`);
    
    return passed;
    
  } catch (error) {
    console.error('❌ Route verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const passed = verifyRoutes();
  process.exit(passed ? 0 : 1);
}

export { verifyRoutes };