#!/usr/bin/env node

import { db } from '../db';
import { chartOfAccounts } from '../db/schema';
import { count } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Seeds exactly 87 UAE Chart of Accounts entries as required for parity
 */
async function seedExact87COAAccounts(): Promise<void> {
  console.log('🔄 Seeding exact 87 UAE Chart of Accounts...');
  
  try {
    // Load the reference 87 accounts from REFERENCE_COA.json
    const referenceFilePath = path.join(__dirname, 'REFERENCE_COA.json');
    
    if (!fs.existsSync(referenceFilePath)) {
      throw new Error('REFERENCE_COA.json not found. Cannot proceed with seeding.');
    }
    
    const referenceAccounts = JSON.parse(fs.readFileSync(referenceFilePath, 'utf-8'));
    
    if (referenceAccounts.length !== 87) {
      throw new Error(`Reference file contains ${referenceAccounts.length} accounts, expected exactly 87`);
    }
    
    // Check current count
    const currentCount = await db.select({ count: count() }).from(chartOfAccounts);
    const existing = currentCount[0]?.count || 0;
    
    console.log(`📊 Current COA count: ${existing}, Required: 87`);
    
    if (existing === 87) {
      console.log('✅ COA already has exactly 87 accounts. Skipping...');
      return;
    }
    
    // Clear existing accounts if any
    if (existing > 0) {
      console.log(`🧹 Clearing ${existing} existing accounts...`);
      await db.delete(chartOfAccounts);
    }
    
    // Prepare accounts for insertion
    const accountsToInsert = referenceAccounts.map((account: any) => ({
      code: account.code,
      name: account.name,
      type: account.type,
      description: account.description || account.name,
      vatCode: 'STANDARD', // Default VAT treatment
      citDeductible: account.type === 'EXPENSE', // Expenses are generally deductible
      qualifiesForQFZP: true, // Most accounts qualify for QFZP
      notes: `UAE FTA compliant account: ${account.name}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert all accounts in a single transaction
    console.log('💾 Inserting 87 accounts...');
    const insertResult = await db.insert(chartOfAccounts).values(accountsToInsert).returning();
    
    // Verify the insertion
    const finalCount = await db.select({ count: count() }).from(chartOfAccounts);
    const actualInserted = finalCount[0]?.count || 0;
    
    console.log(`✅ COA seeding completed:`);
    console.log(`   Expected: 87`);
    console.log(`   Actual: ${actualInserted}`);
    console.log(`   Status: ${actualInserted === 87 ? 'SUCCESS' : 'FAILED'}`);
    
    // Print sample accounts to verify content
    const sampleAccounts = await db.select({
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      type: chartOfAccounts.type
    }).from(chartOfAccounts).limit(5);
    
    console.log('\n📋 Sample accounts:');
    sampleAccounts.forEach(acc => {
      console.log(`   ${acc.code}: ${acc.name} (${acc.type})`);
    });
    
    if (actualInserted !== 87) {
      throw new Error(`Seeding failed: Expected 87 accounts, got ${actualInserted}`);
    }
    
  } catch (error) {
    console.error('❌ COA seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedExact87COAAccounts().then(() => {
    console.log('🎯 COA seeding completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default seedExact87COAAccounts;