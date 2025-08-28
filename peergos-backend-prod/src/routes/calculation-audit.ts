import { Router } from 'express';
import { db, transactions, companies } from '../db';
import { eq } from 'drizzle-orm';

const router = Router();

// Calculation audit trail endpoint
router.get('/api/calculation-audit/:type/:period', async (req, res) => {
  try {
    const { type, period } = req.params;
    const companyId = req.session?.companyId || 1;

    if (!['VAT', 'CIT'].includes(type.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid calculation type. Must be VAT or CIT.' });
    }

    // Get transactions for the period
    const transactionsList = await db.select().from(transactions)
      .where(eq(transactions.companyId, companyId));
    
    // Filter transactions for the specific period
    const periodTransactions = transactionsList.filter(t => {
      const transactionMonth = new Date(t.transactionDate).toISOString().slice(0, 7);
      return transactionMonth === period;
    });

    let auditTrail: any;

    if (type.toUpperCase() === 'VAT') {
      auditTrail = generateVATAudit(companyId, period, periodTransactions, req.session?.userId || 1);
    } else {
      // Get company info for CIT calculation
      const company = await db.select().from(companies).where(eq(companies.id, companyId)).then(rows => rows[0]);
      auditTrail = generateCITAudit(companyId, period, periodTransactions, req.session?.userId || 1, company);
    }

    res.json(auditTrail);
  } catch (error: any) {
    console.error('Error generating calculation audit:', error);
    res.status(500).json({ message: error.message || 'Failed to generate calculation audit' });
  }
});

// Get calculation history
router.get('/api/calculation-audit/history/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const companyId = req.session?.companyId || 1;

    if (!['VAT', 'CIT'].includes(type.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid calculation type. Must be VAT or CIT.' });
    }

    // Mock calculation history - in real implementation, this would be stored in database
    const mockHistory = [
      {
        id: 1,
        period: '2025-01',
        calculatedAt: new Date('2025-01-31'),
        totalAmount: type === 'VAT' ? 12500 : 45000,
        status: 'completed',
        calculatedBy: 'admin'
      },
      {
        id: 2,
        period: '2024-12',
        calculatedAt: new Date('2024-12-31'),
        totalAmount: type === 'VAT' ? 11200 : 42000,
        status: 'completed',
        calculatedBy: 'admin'
      },
      {
        id: 3,
        period: '2024-11',
        calculatedAt: new Date('2024-11-30'),
        totalAmount: type === 'VAT' ? 10800 : 38000,
        status: 'completed',
        calculatedBy: 'admin'
      }
    ];

    res.json(mockHistory);
  } catch (error: any) {
    console.error('Error fetching calculation history:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch calculation history' });
  }
});

// Validate calculation endpoint
router.post('/api/calculation-audit/validate', async (req, res) => {
  try {
    const { type, period, expectedAmount } = req.body;
    const companyId = req.session?.companyId || 1;

    if (!['VAT', 'CIT'].includes(type.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid calculation type. Must be VAT or CIT.' });
    }

    // Get transactions for validation
    const transactionsList = await db.select().from(transactions)
      .where(eq(transactions.companyId, companyId));
    
    const periodTransactions = transactionsList.filter(t => {
      const transactionMonth = new Date(t.transactionDate).toISOString().slice(0, 7);
      return transactionMonth === period;
    });

    // Recalculate based on transactions
    let calculatedAmount = 0;
    if (type.toUpperCase() === 'VAT') {
      calculatedAmount = periodTransactions.reduce((sum, t) => sum + parseFloat(t.vatAmount || '0'), 0);
    } else {
      // CIT calculation (simplified)
      const totalIncome = periodTransactions
        .filter(t => t.type === 'REVENUE')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      calculatedAmount = totalIncome * 0.09; // 9% CIT rate
    }

    const difference = Math.abs(calculatedAmount - expectedAmount);
    const isValid = difference < 0.01; // Allow for rounding differences

    res.json({
      isValid,
      calculatedAmount,
      expectedAmount,
      difference,
      message: isValid 
        ? 'Calculation is valid and matches expected amount'
        : `Calculation mismatch detected. Difference: ${difference.toFixed(2)} AED`
    });
  } catch (error: any) {
    console.error('Error validating calculation:', error);
    res.status(500).json({ message: error.message || 'Failed to validate calculation' });
  }
});

function generateVATAudit(companyId: number, period: string, transactions: any[], userId: number) {
  const totalSales = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalPurchases = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const outputVAT = totalSales * 0.05; // 5% UAE VAT
  const inputVAT = totalPurchases * 0.05;
  const netVAT = outputVAT - inputVAT;

  return {
    type: 'VAT',
    period,
    companyId,
    calculatedBy: userId,
    calculatedAt: new Date().toISOString(),
    breakdown: {
      totalSales,
      totalPurchases,
      outputVAT,
      inputVAT,
      netVAT
    },
    transactions: transactions.map(t => ({
      id: t.id,
      date: t.transactionDate,
      description: t.description,
      amount: parseFloat(t.amount),
      vatAmount: parseFloat(t.vatAmount || '0'),
      type: t.type
    }))
  };
}

function generateCITAudit(companyId: number, period: string, transactions: any[], userId: number, company: any) {
  const totalIncome = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const taxableIncome = totalIncome - totalExpenses;
  const isQFZP = company?.qfzpStatus || false;
  const citRate = isQFZP ? 0 : 0.09; // 9% or 0% for QFZP
  const citLiability = taxableIncome * citRate;

  return {
    type: 'CIT',
    period,
    companyId,
    calculatedBy: userId,
    calculatedAt: new Date().toISOString(),
    breakdown: {
      totalIncome,
      totalExpenses,
      taxableIncome,
      citRate,
      citLiability,
      isQFZP
    },
    transactions: transactions.map(t => ({
      id: t.id,
      date: t.transactionDate,
      description: t.description,
      amount: parseFloat(t.amount),
      type: t.type
    }))
  };
}

export default router;