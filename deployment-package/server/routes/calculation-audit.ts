import express, { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// UAE tax rates and thresholds (centralized configuration)
const UAE_TAX_CONFIG = {
  vat: {
    standardRate: 0.05,
    zeroRatedSupplies: ['exports', 'medical', 'education'],
    exemptSupplies: ['residential_rent', 'local_transport']
  },
  cit: {
    standardRate: 0.09,
    smallBusinessThreshold: 3000000, // AED 3M
    smallBusinessRate: 0.09,
    qfzpRate: 0.0, // Qualified Free Zone Person
    minimumTax: 0
  },
  thresholds: {
    vatRegistrationMandatory: 375000, // AED 375K
    vatRegistrationVoluntary: 187500 // AED 187.5K
  }
};

interface CalculationStep {
  step: number;
  description: string;
  calculation: string;
  amount: number;
  notes?: string;
  regulation?: string;
}

interface AuditTrail {
  calculationId: string;
  type: 'VAT' | 'CIT';
  companyId: number;
  period: string;
  totalAmount: number;
  steps: CalculationStep[];
  metadata: {
    calculatedAt: Date;
    calculatedBy: number;
    inputs: Record<string, any>;
    regulations: string[];
    version: string;
  };
}

// VAT Calculation Audit
function generateVATAudit(
  companyId: number,
  period: string,
  transactions: any[],
  userId: number
): AuditTrail {
  const steps: CalculationStep[] = [];
  let stepNumber = 1;

  // Step 1: Filter VAT-applicable transactions
  const vatTransactions = transactions.filter(t => 
    t.vatAmount && parseFloat(t.vatAmount) > 0
  );

  steps.push({
    step: stepNumber++,
    description: 'Identify VAT-applicable transactions',
    calculation: `Total transactions: ${transactions.length}, VAT-applicable: ${vatTransactions.length}`,
    amount: vatTransactions.length,
    notes: 'Filtered transactions with VAT amounts > 0',
    regulation: 'UAE VAT Law Article 8'
  });

  // Step 2: Calculate output VAT (sales)
  const outputVAT = vatTransactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.vatAmount || '0'), 0);

  steps.push({
    step: stepNumber++,
    description: 'Calculate Output VAT (Sales)',
    calculation: `${vatTransactions.filter(t => t.type === 'REVENUE').length} revenue transactions × VAT rate`,
    amount: outputVAT,
    notes: `Standard VAT rate applied: ${UAE_TAX_CONFIG.vat.standardRate * 100}%`,
    regulation: 'UAE VAT Law Article 24'
  });

  // Step 3: Calculate input VAT (purchases)
  const inputVAT = vatTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.vatAmount || '0'), 0);

  steps.push({
    step: stepNumber++,
    description: 'Calculate Input VAT (Purchases)',
    calculation: `${vatTransactions.filter(t => t.type === 'EXPENSE').length} expense transactions × VAT rate`,
    amount: inputVAT,
    notes: 'VAT on business expenses eligible for recovery',
    regulation: 'UAE VAT Law Article 53'
  });

  // Step 4: Net VAT calculation
  const netVAT = outputVAT - inputVAT;

  steps.push({
    step: stepNumber++,
    description: 'Calculate Net VAT Position',
    calculation: `Output VAT (${outputVAT.toFixed(2)}) - Input VAT (${inputVAT.toFixed(2)})`,
    amount: netVAT,
    notes: netVAT > 0 ? 'VAT payable to FTA' : 'VAT refund due from FTA',
    regulation: 'UAE VAT Law Article 60'
  });

  // Step 5: Compliance checks
  const totalRevenue = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  const registrationRequired = totalRevenue > UAE_TAX_CONFIG.thresholds.vatRegistrationMandatory;

  steps.push({
    step: stepNumber++,
    description: 'VAT Registration Compliance Check',
    calculation: `Annual revenue: ${totalRevenue.toFixed(2)} vs threshold: ${UAE_TAX_CONFIG.thresholds.vatRegistrationMandatory}`,
    amount: totalRevenue,
    notes: registrationRequired ? 'VAT registration mandatory' : 'VAT registration voluntary',
    regulation: 'UAE VAT Law Article 63'
  });

  return {
    calculationId: `VAT_${companyId}_${period}_${Date.now()}`,
    type: 'VAT',
    companyId,
    period,
    totalAmount: netVAT,
    steps,
    metadata: {
      calculatedAt: new Date(),
      calculatedBy: userId,
      inputs: {
        totalTransactions: transactions.length,
        vatTransactions: vatTransactions.length,
        totalRevenue,
        outputVAT,
        inputVAT
      },
      regulations: [
        'UAE VAT Law Federal Decree-Law No. 8 of 2017',
        'UAE VAT Executive Regulation',
        'FTA VAT Guide'
      ],
      version: '2025.1'
    }
  };
}

// CIT Calculation Audit
function generateCITAudit(
  companyId: number,
  period: string,
  transactions: any[],
  userId: number,
  companyInfo: any = {}
): AuditTrail {
  const steps: CalculationStep[] = [];
  let stepNumber = 1;

  // Step 1: Calculate gross revenue
  const grossRevenue = transactions
    .filter(t => t.type === 'REVENUE')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  steps.push({
    step: stepNumber++,
    description: 'Calculate Gross Revenue',
    calculation: `Sum of all revenue transactions: ${transactions.filter(t => t.type === 'REVENUE').length} transactions`,
    amount: grossRevenue,
    notes: 'Total business income before deductions',
    regulation: 'UAE CIT Law Article 12'
  });

  // Step 2: Calculate allowable deductions
  const allowableExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  steps.push({
    step: stepNumber++,
    description: 'Calculate Allowable Business Deductions',
    calculation: `Sum of allowable expense transactions: ${transactions.filter(t => t.type === 'EXPENSE').length} transactions`,
    amount: allowableExpenses,
    notes: 'Business expenses wholly and exclusively for business purposes',
    regulation: 'UAE CIT Law Article 28'
  });

  // Step 3: Calculate taxable income
  const taxableIncome = Math.max(0, grossRevenue - allowableExpenses);

  steps.push({
    step: stepNumber++,
    description: 'Calculate Taxable Income',
    calculation: `Gross Revenue (${grossRevenue.toFixed(2)}) - Allowable Deductions (${allowableExpenses.toFixed(2)})`,
    amount: taxableIncome,
    notes: 'Net profit subject to CIT after allowable deductions',
    regulation: 'UAE CIT Law Article 11'
  });

  // Step 4: Apply small business relief
  const isSmallBusiness = grossRevenue <= UAE_TAX_CONFIG.cit.smallBusinessThreshold;
  let applicableRate = UAE_TAX_CONFIG.cit.standardRate;
  let reliefAmount = 0;

  if (isSmallBusiness) {
    reliefAmount = Math.min(taxableIncome, UAE_TAX_CONFIG.cit.smallBusinessThreshold) * UAE_TAX_CONFIG.cit.standardRate;
    steps.push({
      step: stepNumber++,
      description: 'Apply Small Business Relief',
      calculation: `Revenue ≤ ${UAE_TAX_CONFIG.cit.smallBusinessThreshold.toLocaleString()} AED - Relief available`,
      amount: reliefAmount,
      notes: 'First AED 375,000 of taxable income eligible for relief',
      regulation: 'UAE CIT Law Article 21'
    });
  }

  // Step 5: Calculate CIT liability
  let citLiability;
  if (isSmallBusiness && taxableIncome <= 375000) {
    citLiability = 0; // Full relief
  } else if (isSmallBusiness) {
    citLiability = (taxableIncome - 375000) * applicableRate;
  } else {
    citLiability = taxableIncome * applicableRate;
  }

  steps.push({
    step: stepNumber++,
    description: 'Calculate Corporate Income Tax Liability',
    calculation: isSmallBusiness 
      ? `(${taxableIncome.toFixed(2)} - 375,000) × ${(applicableRate * 100).toFixed(1)}%`
      : `${taxableIncome.toFixed(2)} × ${(applicableRate * 100).toFixed(1)}%`,
    amount: citLiability,
    notes: `CIT rate: ${(applicableRate * 100).toFixed(1)}%${isSmallBusiness ? ' (with small business relief)' : ''}`,
    regulation: 'UAE CIT Law Article 20'
  });

  // Step 6: QFZP qualification check
  const isQFZP = companyInfo.isQualifiedFreezone || false;
  if (isQFZP) {
    steps.push({
      step: stepNumber++,
      description: 'Qualified Free Zone Person (QFZP) Assessment',
      calculation: 'Qualifying income subject to 0% CIT rate',
      amount: 0,
      notes: 'Qualifying income from qualifying activities in qualifying free zones',
      regulation: 'UAE CIT Law Article 22'
    });
    citLiability = 0;
  }

  return {
    calculationId: `CIT_${companyId}_${period}_${Date.now()}`,
    type: 'CIT',
    companyId,
    period,
    totalAmount: citLiability,
    steps,
    metadata: {
      calculatedAt: new Date(),
      calculatedBy: userId,
      inputs: {
        grossRevenue,
        allowableExpenses,
        taxableIncome,
        isSmallBusiness,
        isQFZP,
        applicableRate
      },
      regulations: [
        'UAE CIT Law Federal Decree-Law No. 47 of 2022',
        'UAE CIT Executive Regulation',
        'FTA CIT Guide'
      ],
      version: '2025.1'
    }
  };
}

// Get calculation audit trail
router.get('/audit/:type/:period', async (req, res) => {
  try {
    const { type, period } = req.params;
    const companyId = 1; // Mock company ID
    const userId = 1; // Mock user ID

    if (!['VAT', 'CIT'].includes(type.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid calculation type. Must be VAT or CIT.' });
    }

    // Get transactions for the period
    const transactions = await storage.getTransactions(companyId);
    
    // Filter transactions for the specific period
    const periodTransactions = transactions.filter(t => {
      const transactionMonth = new Date(t.transactionDate).toISOString().slice(0, 7);
      return transactionMonth === period;
    });

    let auditTrail: AuditTrail;

    if (type.toUpperCase() === 'VAT') {
      auditTrail = generateVATAudit(companyId, period, periodTransactions, userId);
    } else {
      // Get company info for CIT calculation
      const companyInfo = { isQualifiedFreezone: false }; // Mock data
      auditTrail = generateCITAudit(companyId, period, periodTransactions, userId, companyInfo);
    }

    res.json(auditTrail);
  } catch (error: any) {
    console.error('Error generating calculation audit:', error);
    res.status(500).json({ message: error.message || 'Failed to generate calculation audit' });
  }
});

// Get calculation history
router.get('/history/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const companyId = 1; // Mock company ID

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

// Get tax configuration
router.get('/config', async (req, res) => {
  try {
    res.json({
      uaeTaxConfig: UAE_TAX_CONFIG,
      lastUpdated: '2025-01-01',
      version: '2025.1',
      regulations: {
        vat: {
          law: 'Federal Decree-Law No. 8 of 2017',
          effectiveDate: '2018-01-01',
          lastAmendment: '2023-12-31'
        },
        cit: {
          law: 'Federal Decree-Law No. 47 of 2022',
          effectiveDate: '2023-06-01',
          lastAmendment: '2024-12-31'
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching tax configuration:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch tax configuration' });
  }
});

// Validate calculation
router.post('/validate', async (req, res) => {
  try {
    const { type, period, expectedAmount } = req.body;
    const companyId = 1; // Mock company ID
    const userId = 1; // Mock user ID

    if (!['VAT', 'CIT'].includes(type.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid calculation type. Must be VAT or CIT.' });
    }

    // Get transactions for validation
    const transactions = await storage.getTransactions(companyId);
    const periodTransactions = transactions.filter(t => {
      const transactionMonth = new Date(t.transactionDate).toISOString().slice(0, 7);
      return transactionMonth === period;
    });

    // Generate audit trail for validation
    let auditTrail: AuditTrail;
    if (type.toUpperCase() === 'VAT') {
      auditTrail = generateVATAudit(companyId, period, periodTransactions, userId);
    } else {
      const companyInfo = { isQualifiedFreezone: false };
      auditTrail = generateCITAudit(companyId, period, periodTransactions, userId, companyInfo);
    }

    const calculatedAmount = auditTrail.totalAmount;
    const difference = Math.abs(calculatedAmount - parseFloat(expectedAmount || '0'));
    const tolerance = 0.01; // 1 fils tolerance

    const isValid = difference <= tolerance;

    res.json({
      isValid,
      expectedAmount: parseFloat(expectedAmount || '0'),
      calculatedAmount,
      difference,
      tolerance,
      auditTrail: isValid ? null : auditTrail, // Only return audit trail if validation fails
      message: isValid 
        ? 'Calculation validated successfully' 
        : `Calculation mismatch detected. Difference: ${difference.toFixed(2)} AED`
    });
  } catch (error: any) {
    console.error('Error validating calculation:', error);
    res.status(500).json({ message: error.message || 'Failed to validate calculation' });
  }
});

export default router;