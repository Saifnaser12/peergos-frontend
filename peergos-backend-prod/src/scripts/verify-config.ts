#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Verify critical configuration settings
 */
function verifyConfig(): boolean {
  console.log('⚙️ Verifying configuration settings...');
  
  try {
    const serverFile = path.join(__dirname, '../server.ts');
    const serverContent = fs.readFileSync(serverFile, 'utf-8');
    
    // Check CORS configuration
    const corsChecks = [
      'cors',
      'CORS_ORIGIN'
    ];
    
    let corsConfigured = false;
    corsChecks.forEach(check => {
      if (serverContent.includes(check)) {
        console.log(`   ✅ CORS setting '${check}': Found`);
        corsConfigured = true;
      }
    });
    
    if (!corsConfigured) {
      console.log('   ❌ CORS configuration: Missing');
    }
    
    // Check rate limiting
    const rateLimitChecks = [
      'rate',
      'limit',
      'RATE_LIMIT'
    ];
    
    let rateLimitConfigured = false;
    rateLimitChecks.forEach(check => {
      if (serverContent.includes(check)) {
        console.log(`   ✅ Rate limiting '${check}': Found`);
        rateLimitConfigured = true;
      }
    });
    
    if (!rateLimitConfigured) {
      console.log('   ❌ Rate limiting: Missing');
    }
    
    // Check session configuration
    const sessionChecks = [
      'session',
      'SESSION_SECRET'
    ];
    
    let sessionConfigured = false;
    sessionChecks.forEach(check => {
      if (serverContent.includes(check)) {
        console.log(`   ✅ Session setting '${check}': Found`);
        sessionConfigured = true;
      }
    });
    
    if (!sessionConfigured) {
      console.log('   ❌ Session configuration: Missing');
    }
    
    // Check environment handling
    const envHandling = serverContent.includes('NODE_ENV') || serverContent.includes('process.env');
    console.log(`   ${envHandling ? '✅' : '❌'} Environment handling: ${envHandling ? 'Found' : 'Missing'}`);
    
    // Check health endpoint
    const healthEndpoint = serverContent.includes('/health');
    console.log(`   ${healthEndpoint ? '✅' : '❌'} Health endpoint: ${healthEndpoint ? 'Found' : 'Missing'}`);
    
    // Calculate overall score
    const checks = [corsConfigured, rateLimitConfigured, sessionConfigured, envHandling, healthEndpoint];
    const passedChecks = checks.filter(check => check).length;
    const score = passedChecks / checks.length;
    
    const passed = score >= 0.8; // 80% threshold
    
    console.log(`\n📊 Configuration coverage: ${Math.round(score * 100)}%`);
    console.log(`${passed ? '✅' : '❌'} Configuration verification: ${passed ? 'PASS' : 'FAIL'}`);
    
    return passed;
    
  } catch (error) {
    console.error('❌ Configuration verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const passed = verifyConfig();
  process.exit(passed ? 0 : 1);
}

export { verifyConfig };