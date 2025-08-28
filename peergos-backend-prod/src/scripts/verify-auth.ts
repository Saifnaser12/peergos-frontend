#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Verify authentication and authorization implementation
 */
function verifyAuth(): boolean {
  console.log('🔐 Verifying authentication implementation...');
  
  try {
    const routesFile = path.join(__dirname, '../routes/index.ts');
    const routesContent = fs.readFileSync(routesFile, 'utf-8');
    
    // Check for authentication routes
    const authRoutes = [
      '/api/auth/login',
      '/api/users/me'
    ];
    
    let authRoutesFound = 0;
    authRoutes.forEach(route => {
      if (routesContent.includes(route)) {
        console.log(`   ✅ ${route}: Found`);
        authRoutesFound++;
      } else {
        console.log(`   ❌ ${route}: Missing`);
      }
    });
    
    // Check for session handling
    const sessionChecks = [
      'req.session',
      'userId',
      'companyId'
    ];
    
    let sessionFeaturesFound = 0;
    sessionChecks.forEach(check => {
      if (routesContent.includes(check)) {
        console.log(`   ✅ Session feature '${check}': Found`);
        sessionFeaturesFound++;
      } else {
        console.log(`   ❌ Session feature '${check}': Missing`);
      }
    });
    
    // Check for role-based access
    const roleChecks = [
      'ADMIN',
      'ACCOUNTANT', 
      'SME_CLIENT'
    ];
    
    let roleSupport = false;
    const schemaFile = path.join(__dirname, '../db/schema.ts');
    if (fs.existsSync(schemaFile)) {
      const schemaContent = fs.readFileSync(schemaFile, 'utf-8');
      roleSupport = roleChecks.some(role => schemaContent.includes(role));
    }
    
    console.log(`   ${roleSupport ? '✅' : '❌'} Role-based access: ${roleSupport ? 'Found' : 'Missing'}`);
    
    // Calculate score
    const authScore = authRoutesFound / authRoutes.length;
    const sessionScore = sessionFeaturesFound / sessionChecks.length;
    const totalScore = (authScore + sessionScore + (roleSupport ? 1 : 0)) / 3;
    
    const passed = totalScore >= 0.8; // 80% threshold
    
    console.log(`\n📊 Authentication coverage: ${Math.round(totalScore * 100)}%`);
    console.log(`${passed ? '✅' : '❌'} Authentication verification: ${passed ? 'PASS' : 'FAIL'}`);
    
    return passed;
    
  } catch (error) {
    console.error('❌ Authentication verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const passed = verifyAuth();
  process.exit(passed ? 0 : 1);
}

export { verifyAuth };