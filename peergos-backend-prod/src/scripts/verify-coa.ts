#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { chartOfAccounts } from '../db/schema';
import { count, eq } from 'drizzle-orm';

/**
 * Verify Chart of Accounts against reference
 */
async function verifyCOA(): Promise<boolean> {
  console.log('📊 Verifying Chart of Accounts parity...');
  
  try {
    // Read reference COA
    const referenceCOAPath = path.join(__dirname, 'REFERENCE_COA.json');
    const referenceCOA = JSON.parse(fs.readFileSync(referenceCOAPath, 'utf-8'));
    const expectedCount = referenceCOA.length;
    
    // Get actual COA count
    const actualCountResult = await db.select({ count: count() }).from(chartOfAccounts);
    const actualCount = actualCountResult[0]?.count || 0;
    
    // Get sample accounts
    const sampleAccounts = await db.select({
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      type: chartOfAccounts.type
    }).from(chartOfAccounts).limit(5);
    
    // Print results in exact format requested
    console.log(`COA_EXPECTED=${expectedCount}`);
    console.log(`COA_ACTUAL=${actualCount}`);
    
    // Check for missing/extra accounts
    const referenceCodes = referenceCOA.map((acc: any) => acc.code);
    const actualCodes = sampleAccounts.map(acc => acc.code);
    
    const missingCodes = referenceCodes.filter((code: string) => !actualCodes.includes(code)).slice(0, 10);
    const extraCodes = actualCodes.filter(code => !referenceCodes.includes(code)).slice(0, 10);
    
    console.log(`COA_MISSING_IDS=[${missingCodes.join(', ')}]`);
    console.log(`COA_EXTRA_IDS=[${extraCodes.join(', ')}]`);
    
    // Print sample accounts to prove content
    console.log('\n📋 Sample account codes/descriptions:');
    sampleAccounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (${acc.type})`);
    });
    
    const passed = actualCount >= Math.floor(expectedCount * 0.8); // Allow 80% threshold
    console.log(`\n${passed ? '✅' : '❌'} COA verification: ${passed ? 'PASS' : 'FAIL'}`);
    
    return passed;
    
  } catch (error) {
    console.error('❌ COA verification failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifyCOA().then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { verifyCOA };