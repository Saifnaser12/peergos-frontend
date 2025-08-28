import { Router } from 'express';
import { db } from '../db';
import { chartOfAccounts } from '../db/schema';
import { count } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const router = Router();

// POST /api/chart-of-accounts/seed-87 - Seeds exactly 87 COA accounts
router.post('/api/chart-of-accounts/seed-87', async (req, res) => {
  try {
    console.log('🔄 Starting 87 COA seeding...');
    
    // Load reference COA
    const referenceFilePath = path.join(__dirname, '../scripts/REFERENCE_COA.json');
    const referenceAccounts = JSON.parse(fs.readFileSync(referenceFilePath, 'utf-8'));
    
    if (referenceAccounts.length !== 87) {
      return res.status(400).json({ 
        error: `Reference file contains ${referenceAccounts.length} accounts, expected exactly 87` 
      });
    }
    
    // Clear existing accounts
    await db.delete(chartOfAccounts);
    
    // Insert exactly 87 accounts
    const accountsToInsert = referenceAccounts.map((acc: any) => ({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      category: 'General'
    }));
    
    await db.insert(chartOfAccounts).values(accountsToInsert);
    
    // Verify count
    const finalCount = await db.select({ count: count() }).from(chartOfAccounts);
    const actualCount = finalCount[0]?.count || 0;
    
    console.log(`✅ COA seeded: ${actualCount} accounts`);
    
    res.json({
      success: true,
      expected: 87,
      actual: actualCount,
      status: actualCount === 87 ? 'SUCCESS' : 'FAILED'
    });
    
  } catch (error) {
    console.error('❌ Error seeding 87 COA:', error);
    res.status(500).json({ error: 'Failed to seed COA' });
  }
});

export default router;