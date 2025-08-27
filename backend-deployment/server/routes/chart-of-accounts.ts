import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get all chart of accounts
router.get('/chart-of-accounts', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT 
        id,
        code,
        name,
        vat_code as "vatCode",
        cit_deductible as "citDeductible",
        notes,
        qualifies_for_qfzp as "qualifiesForQFZP",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM chart_of_accounts
      ORDER BY code
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    res.status(500).json({ error: 'Failed to fetch chart of accounts' });
  }
});

// Get specific account by code
router.get('/chart-of-accounts/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await db.execute({
      sql: `
        SELECT 
          id,
          code,
          name,
          vat_code as "vatCode",
          cit_deductible as "citDeductible",
          notes,
          qualifies_for_qfzp as "qualifiesForQFZP",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM chart_of_accounts
        WHERE code = $1
      `,
      args: [code]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

export { router as chartOfAccountsRouter };