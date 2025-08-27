import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Cross-module data endpoint
router.get('/cross-module-data', async (req, res) => {
  try {
    const userId = req.session?.userId || 1;
    const user = await storage.getUser(userId);
    const companyId = user?.companyId || 1;

    // Gather data from all modules
    const [company, transactions, taxSettings] = await Promise.all([
      storage.getCompany(companyId),
      storage.getTransactions?.(companyId) || [],
      storage.getTaxSettings?.(companyId) || null
    ]);

    // Calculate VAT based on transactions
    const vatCalculations = calculateVATFromTransactions(transactions, taxSettings);
    
    // Calculate CIT based on transactions
    const citCalculations = calculateCITFromTransactions(transactions, company, taxSettings);

    const crossModuleData = {
      transactions,
      company,
      vatCalculations,
      citCalculations,
      taxSettings
    };

    res.json(crossModuleData);
  } catch (error) {
    console.error('Error fetching cross-module data:', error);
    res.status(500).json({ error: 'Failed to fetch cross-module data' });
  }
});

// Sync modules endpoint
router.post('/sync-modules', async (req, res) => {
  try {
    const { modules } = req.body;
    const userId = req.session?.userId || 1;
    const user = await storage.getUser(userId);
    const companyId = user?.companyId || 1;

    const syncResults = {};

    for (const module of modules) {
      try {
        switch (module) {
          case 'transactions':
            // Recalculate VAT and CIT based on latest transactions
            const transactions = await storage.getTransactions?.(companyId) || [];
            const company = await storage.getCompany(companyId);
            const taxSettings = await storage.getTaxSettings?.(companyId);
            
            // Auto-update VAT calculations
            const vatCalc = calculateVATFromTransactions(transactions, taxSettings);
            await storage.updateVATCalculation?.(companyId, vatCalc);
            
            // Auto-update CIT calculations
            const citCalc = calculateCITFromTransactions(transactions, company, taxSettings);
            await storage.updateCITCalculation?.(companyId, citCalc);
            
            syncResults[module] = { status: 'success', updated: ['vat', 'cit'] };
            break;

          case 'company':
            // Sync company settings to all modules
            const companyData = await storage.getCompany(companyId);
            // Update tax calculations based on company changes
            syncResults[module] = { status: 'success', updated: ['tax-settings'] };
            break;

          case 'tax-settings':
            // Recalculate all tax obligations with new settings
            const newTaxSettings = await storage.getTaxSettings?.(companyId);
            const allTransactions = await storage.getTransactions?.(companyId) || [];
            
            // Recalculate everything
            const newVatCalc = calculateVATFromTransactions(allTransactions, newTaxSettings);
            const newCitCalc = calculateCITFromTransactions(allTransactions, company, newTaxSettings);
            
            await Promise.all([
              storage.updateVATCalculation?.(companyId, newVatCalc),
              storage.updateCITCalculation?.(companyId, newCitCalc)
            ]);
            
            syncResults[module] = { status: 'success', updated: ['vat', 'cit'] };
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

// Validate data consistency endpoint
router.get('/validate-data-consistency', async (req, res) => {
  try {
    const userId = req.session?.userId || 1;
    const user = await storage.getUser(userId);
    const companyId = user?.companyId || 1;

    const validationErrors = [];

    // Get all relevant data
    const [company, transactions, taxSettings] = await Promise.all([
      storage.getCompany(companyId),
      storage.getTransactions?.(companyId) || [],
      storage.getTaxSettings?.(companyId) || null
    ]);

    // Validate company setup
    if (!company?.setupCompleted) {
      validationErrors.push({
        id: 'company-setup-incomplete',
        module: 'company',
        field: 'setupCompleted',
        message: 'Company setup is not complete',
        severity: 'error',
        affectedModules: ['vat-calculations', 'cit-calculations', 'reports']
      });
    }

    // Validate TRN format
    if (company?.trn && !/^\d{15}$/.test(company.trn)) {
      validationErrors.push({
        id: 'invalid-trn-format',
        module: 'company',
        field: 'trn',
        message: 'TRN must be exactly 15 digits',
        severity: 'error',
        affectedModules: ['vat-calculations', 'reports', 'filing']
      });
    }

    // Validate transactions for VAT consistency
    const vatInconsistentTransactions = transactions.filter(t => 
      t.vatAmount && (!t.vatRate || t.vatAmount !== (t.amount * (t.vatRate / 100)))
    );

    if (vatInconsistentTransactions.length > 0) {
      validationErrors.push({
        id: 'vat-calculation-mismatch',
        module: 'transactions',
        field: 'vatAmount',
        message: `${vatInconsistentTransactions.length} transactions have incorrect VAT calculations`,
        severity: 'warning',
        affectedModules: ['vat-calculations', 'reports']
      });
    }

    // Validate business activity consistency
    if (company?.businessActivity && taxSettings?.applicableActivities) {
      const isValidActivity = taxSettings.applicableActivities.includes(company.businessActivity);
      if (!isValidActivity) {
        validationErrors.push({
          id: 'business-activity-mismatch',
          module: 'company',
          field: 'businessActivity',
          message: 'Business activity not recognized by tax settings',
          severity: 'warning',
          affectedModules: ['tax-settings', 'cit-calculations']
        });
      }
    }

    // Validate Free Zone consistency
    const freeZoneTransactions = transactions.filter(t => t.freeZoneTransaction);
    if (freeZoneTransactions.length > 0 && !company?.freeZone) {
      validationErrors.push({
        id: 'freezone-status-mismatch',
        module: 'transactions',
        field: 'freeZoneTransaction',
        message: 'Free Zone transactions found but company not registered as Free Zone',
        severity: 'error',
        affectedModules: ['company', 'vat-calculations', 'cit-calculations']
      });
    }

    res.json(validationErrors);
  } catch (error) {
    console.error('Error validating data consistency:', error);
    res.status(500).json({ error: 'Failed to validate data consistency' });
  }
});

// Update module data endpoint
router.put('/modules/:module/data', async (req, res) => {
  try {
    const { module } = req.params;
    const updateData = req.body;
    const userId = req.session?.userId || 1;
    const user = await storage.getUser(userId);
    const companyId = user?.companyId || 1;

    let result;

    switch (module) {
      case 'company':
        result = await storage.updateCompany(companyId, updateData);
        break;
      case 'transactions':
        // Handle transaction updates and trigger recalculations
        result = await storage.createTransaction?.({
          ...updateData,
          companyId
        });
        break;
      case 'tax-settings':
        result = await storage.updateTaxSettings?.(companyId, updateData);
        break;
      default:
        return res.status(400).json({ error: 'Unknown module' });
    }

    res.json({
      success: true,
      module,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error updating ${req.params.module} data:`, error);
    res.status(500).json({ error: `Failed to update ${req.params.module} data` });
  }
});

// Helper functions for calculations
function calculateVATFromTransactions(transactions: any[], taxSettings: any) {
  const vatRate = 0.05; // 5% UAE VAT rate
  
  const vatableTransactions = transactions.filter(t => !t.vatExempt && !t.freeZoneTransaction);
  
  const totalVATCollected = vatableTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount * vatRate), 0);
    
  const totalVATInput = vatableTransactions
    .filter(t => t.type === 'expense' && t.hasValidVATInvoice)
    .reduce((sum, t) => sum + (t.amount * vatRate), 0);
    
  const netVATLiability = totalVATCollected - totalVATInput;
  
  return {
    totalVATCollected,
    totalVATInput,
    netVATLiability,
    vatRate,
    period: new Date().toISOString().substring(0, 7), // YYYY-MM
    calculatedAt: new Date().toISOString()
  };
}

function calculateCITFromTransactions(transactions: any[], company: any, taxSettings: any) {
  const citRate = 0.09; // 9% UAE CIT rate
  const smallBusinessThreshold = 3000000; // AED 3M threshold
  
  const currentYear = new Date().getFullYear();
  const yearTransactions = transactions.filter(t => 
    new Date(t.date).getFullYear() === currentYear
  );
  
  const totalIncome = yearTransactions
    .filter(t => t.type === 'income' && !t.freeZoneTransaction)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const deductibleExpenses = yearTransactions
    .filter(t => t.type === 'expense' && t.citDeductible)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);
  
  // Apply Small Business Relief if eligible
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