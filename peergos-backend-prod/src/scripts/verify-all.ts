#!/usr/bin/env node

import { verifyRoutes } from './verify-routes';
import { verifySchemas } from './verify-schemas';
import { verifySeeds } from './verify-seeds';
import { verifyEnv } from './verify-env';
import { verifyAuth } from './verify-auth';
import { verifyJobs } from './verify-jobs';
import { verifyConfig } from './verify-config';

/**
 * Run all verification checks
 */
async function verifyAll(): Promise<boolean> {
  console.log('🔍 Running comprehensive verification suite...\n');
  
  const results: { name: string; passed: boolean }[] = [];
  
  try {
    // 1. Routes verification
    console.log('='.repeat(50));
    const routesResult = verifyRoutes();
    results.push({ name: 'Routes', passed: routesResult });
    
    // 2. Schemas verification
    console.log('\n' + '='.repeat(50));
    const schemasResult = verifySchemas();
    results.push({ name: 'Schemas', passed: schemasResult });
    
    // 3. Seeds verification
    console.log('\n' + '='.repeat(50));
    const seedsResult = await verifySeeds();
    results.push({ name: 'Seeds', passed: seedsResult });
    
    // 4. Environment verification
    console.log('\n' + '='.repeat(50));
    const envResult = verifyEnv();
    results.push({ name: 'Environment', passed: envResult });
    
    // 5. Authentication verification
    console.log('\n' + '='.repeat(50));
    const authResult = verifyAuth();
    results.push({ name: 'Authentication', passed: authResult });
    
    // 6. Jobs verification
    console.log('\n' + '='.repeat(50));
    const jobsResult = verifyJobs();
    results.push({ name: 'Background Jobs', passed: jobsResult });
    
    // 7. Configuration verification
    console.log('\n' + '='.repeat(50));
    const configResult = verifyConfig();
    results.push({ name: 'Configuration', passed: configResult });
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${result.name.padEnd(20)}: ${status}`);
    });
    
    console.log('='.repeat(50));
    console.log(`Overall Score: ${passedCount}/${totalCount} (${Math.round((passedCount/totalCount)*100)}%)`);
    
    const allPassed = passedCount === totalCount;
    console.log(`Final Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(50));
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Verification suite failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifyAll().then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(error => {
    console.error('💥 Fatal verification error:', error);
    process.exit(1);
  });
}

export { verifyAll };