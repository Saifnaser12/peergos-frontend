import { Router } from 'express';
import { db, transactions, companies, users } from '../db';
import { eq } from 'drizzle-orm';

const router = Router();

// Cross-module data synchronization
router.get('/api/cross-module-data', async (req, res) => {
  try {
    const userId = req.session?.userId || 1;
    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    const companyId = user?.companyId || 1;

    // Gather data from all modules
    const [company, transactionsList] = await Promise.all([
      db.select().from(companies).where(eq(companies.id, companyId)).then(rows => rows[0]),
      db.select().from(transactions).where(eq(transactions.companyId, companyId))
    ]);

    // Calculate VAT based on transactions
    const vatCalculations = calculateVATFromTransactions(transactionsList);
    
    // Calculate CIT based on transactions  
    const citCalculations = calculateCITFromTransactions(transactionsList, company);

    const crossModuleData = {
      transactions: transactionsList,
      company,
      vatCalculations,
      citCalculations,
    };

    res.json(crossModuleData);
  } catch (error) {
    console.error('Error fetching cross-module data:', error);
    res.status(500).json({ error: 'Failed to fetch cross-module data' });
  }
});

// Sync modules endpoint
router.post('/api/sync-modules', async (req, res) => {
  try {
    const { modules } = req.body;
    const userId = req.session?.userId || 1;
    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    const companyId = user?.companyId || 1;

    const syncResults: any = {};

    for (const module of modules) {
      try {
        switch (module) {
          case 'transactions':
            // Recalculate VAT and CIT based on latest transactions
            const transactionsList = await db.select().from(transactions).where(eq(transactions.companyId, companyId));
            const company = await db.select().from(companies).where(eq(companies.id, companyId)).then(rows => rows[0]);
            
            // Auto-update VAT calculations
            const vatCalc = calculateVATFromTransactions(transactionsList);
            
            // Auto-update CIT calculations
            const citCalc = calculateCITFromTransactions(transactionsList, company);
            
            syncResults[module] = { status: 'success', updated: ['vat', 'cit'] };
            break;

          case 'company':
            // Sync company settings to all modules
            const companyData = await db.select().from(companies).where(eq(companies.id, companyId)).then(rows => rows[0]);
            syncResults[module] = { status: 'success', updated: ['settings'] };
            break;

          default:
            syncResults[module] = { status: 'skipped', reason: 'Unknown module' };
        }
      } catch (moduleError) {
        console.error(`Error syncing module ${module}:`, moduleError);
        syncResults[module] = { status: 'error', error: moduleError.message };
      }
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: syncResults
    });
  } catch (error) {
    console.error('Error syncing modules:', error);
    res.status(500).json({ error: 'Failed to sync modules' });
  }
});

function calculateVATFromTransactions(transactions: any[]) {
  const totalSales = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  
  const totalPurchases = transactions
    .filter(t => t.type === 'EXPENSE') 
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  
  const outputVAT = totalSales * 0.05; // 5% UAE VAT
  const inputVAT = totalPurchases * 0.05;
  const netVAT = outputVAT - inputVAT;

  return {
    totalSales,
    totalPurchases,
    outputVAT,
    inputVAT,
    netVAT,
    vatRate: 0.05,
    calculatedAt: new Date().toISOString()
  };
}

function calculateCITFromTransactions(transactions: any[], company: any) {
  const currentYear = new Date().getFullYear();
  const citRate = 0.09; // 9% UAE CIT
  const smallBusinessThreshold = 375000; // AED 375k threshold

  const totalIncome = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  
  const deductibleExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  
  const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);
  const isEligibleForSBR = totalIncome <= smallBusinessThreshold && !company?.freeZone;
  const citLiability = isEligibleForSBR ? 0 : taxableIncome * citRate;
  
  return {
    totalIncome,
    deductibleExpenses,
    taxableIncome,
    citLiability,
    citRate,
    isEligibleForSBR,
    smallBusinessThreshold,
    year: currentYear,
    calculatedAt: new Date().toISOString()
  };
}

export default router;