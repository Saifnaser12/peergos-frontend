#!/usr/bin/env node

import { db } from '../db';
import { chartOfAccounts } from '../db/schema';
import { count } from 'drizzle-orm';

/**
 * Verify database seeding completed successfully
 */
async function verifySeeds(): Promise<boolean> {
  console.log('🌱 Verifying database seeds...');
  
  try {
    // Check Chart of Accounts
    console.log('📊 Checking Chart of Accounts...');
    const coaResult = await db.select({ count: count() }).from(chartOfAccounts);
    const coaCount = coaResult[0]?.count || 0;
    
    const expectedCoaCount = 90; // UAE standard COA
    const coaPassed = coaCount >= expectedCoaCount;
    
    console.log(`   Expected: ${expectedCoaCount}+ accounts`);
    console.log(`   Found: ${coaCount} accounts`);
    console.log(`   ${coaPassed ? '✅' : '❌'} COA seed: ${coaPassed ? 'PASS' : 'FAIL'}`);
    
    // Check other critical seeds
    console.log('\n👥 Checking other seed data...');
    
    // Add checks for other seeded data here
    const otherSeedsPassed = true; // Placeholder
    
    const allPassed = coaPassed && otherSeedsPassed;
    console.log(`\n${allPassed ? '✅' : '❌'} Seeds verification: ${allPassed ? 'PASS' : 'FAIL'}`);
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Seeds verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifySeeds().then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { verifySeeds };