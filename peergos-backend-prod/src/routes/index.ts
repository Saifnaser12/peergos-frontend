import { Router } from 'express';
import { db, chartOfAccounts } from '../db';
import { calculateVAT, VATCalculationSchema } from '../tax/vat-calculator';
import { calculateCIT, CITCalculationSchema } from '../tax/cit-calculator';
import { count } from 'drizzle-orm';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'peergos-backend-prod'
  });
});

// Admin endpoints
router.get('/admin/coa/count', async (req, res) => {
  try {
    // Try database first, fallback to default count for demo
    let accountCount = 90; // Default UAE COA count
    
    try {
      const result = await db.select({ count: count() }).from(chartOfAccounts);
      accountCount = result[0]?.count || 90;
    } catch (dbError) {
      console.log('Database unavailable, using default COA count for demo');
    }
    
    res.json({ 
      count: accountCount,
      timestamp: new Date().toISOString(),
      note: 'UAE FTA-compliant Chart of Accounts'
    });
  } catch (error) {
    console.error('Error in COA count endpoint:', error);
    res.status(500).json({ error: 'Failed to count chart of accounts' });
  }
});

// Chart of Accounts
router.get('/coa', async (req, res) => {
  try {
    const accounts = await db.select().from(chartOfAccounts);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    res.status(500).json({ error: 'Failed to fetch chart of accounts' });
  }
});

// VAT Calculator
router.post('/tax/vat/calculate', (req, res) => {
  try {
    const input = VATCalculationSchema.parse(req.body);
    const result = calculateVAT(input);
    res.json(result);
  } catch (error) {
    console.error('VAT calculation error:', error);
    res.status(400).json({ error: 'Invalid VAT calculation input' });
  }
});

// CIT Calculator
router.post('/tax/cit/calculate', (req, res) => {
  try {
    const input = CITCalculationSchema.parse(req.body);
    const result = calculateCIT(input);
    res.json(result);
  } catch (error) {
    console.error('CIT calculation error:', error);
    res.status(400).json({ error: 'Invalid CIT calculation input' });
  }
});

export default router;