import { Router } from 'express';

const router = Router();

// UAE tax configuration for audit trails
const UAE_TAX_CONFIG = {
  vat: {
    standardRate: 0.05,
    zeroRatedSupplies: ['exports', 'medical', 'education'],
    exemptSupplies: ['residential_rent', 'local_transport']
  },
  cit: {
    standardRate: 0.09,
    smallBusinessThreshold: 3000000,
    qfzpRate: 0.0
  }
};

// Generate calculation audit trail
router.post('/generate', (req, res) => {
  try {
    const {
      type, // 'VAT' or 'CIT'
      companyId = 1,
      period,
      inputs
    } = req.body;
    
    if (!type || !period || !inputs) {
      return res.status(400).json({
        error: 'Missing required fields: type, period, inputs'
      });
    }
    
    let auditTrail;
    
    if (type === 'VAT') {
      auditTrail = generateVATAudit(companyId, period, inputs);
    } else if (type === 'CIT') {
      auditTrail = generateCITAudit(companyId, period, inputs);
    } else {
      return res.status(400).json({
        error: 'Invalid calculation type. Must be VAT or CIT'
      });
    }
    
    res.json({
      success: true,
      auditTrail,
      message: `${type} calculation audit generated successfully`
    });
  } catch (error) {
    console.error('Audit generation error:', error);
    res.status(500).json({ error: 'Failed to generate audit trail' });
  }
});

// Get audit trail by ID
router.get('/:calculationId', (req, res) => {
  const { calculationId } = req.params;
  
  // Mock audit trail data
  const mockAudit = {
    calculationId,
    type: 'VAT',
    companyId: 1,
    period: 'Q1-2025',
    totalAmount: 3150,
    steps: [
      {
        step: 1,
        description: 'Calculate Standard-Rated Sales',
        calculation: 'Total Sales - Exempt Sales - Zero-Rated Sales',
        amount: 105000,
        regulation: 'UAE VAT Law Article 8'
      },
      {
        step: 2,
        description: 'Calculate Output VAT',
        calculation: 'Standard-Rated Sales × 5%',
        amount: 5250,
        regulation: 'UAE VAT Law Article 25'
      },
      {
        step: 3,
        description: 'Calculate Input VAT',
        calculation: 'Deductible Expenses × 5%',
        amount: 2100,
        regulation: 'UAE VAT Law Article 53'
      },
      {
        step: 4,
        description: 'Calculate Net VAT',
        calculation: 'Output VAT - Input VAT',
        amount: 3150,
        regulation: 'UAE VAT Law Article 65'
      }
    ],
    metadata: {
      calculatedAt: new Date().toISOString(),
      calculatedBy: 1,
      inputs: {
        revenue: 120000,
        expenses: 42000,
        exemptSales: 10000,
        zeroRatedSales: 5000
      },
      regulations: ['UAE VAT Law Article 8', 'UAE VAT Law Article 25'],
      version: '1.0.0'
    }
  };
  
  res.json(mockAudit);
});

// Helper functions
function generateVATAudit(companyId, period, inputs) {
  const {
    revenue = 0,
    expenses = 0,
    exemptSales = 0,
    zeroRatedSales = 0
  } = inputs;
  
  const standardRatedSales = revenue - exemptSales - zeroRatedSales;
  const outputVAT = standardRatedSales * UAE_TAX_CONFIG.vat.standardRate;
  const inputVAT = expenses * UAE_TAX_CONFIG.vat.standardRate;
  const netVAT = Math.max(0, outputVAT - inputVAT);
  
  return {
    calculationId: `VAT-${Date.now()}`,
    type: 'VAT',
    companyId,
    period,
    totalAmount: netVAT,
    steps: [
      {
        step: 1,
        description: 'Calculate Standard-Rated Sales',
        calculation: `${revenue} - ${exemptSales} - ${zeroRatedSales}`,
        amount: standardRatedSales,
        regulation: 'UAE VAT Law Article 8'
      },
      {
        step: 2,
        description: 'Calculate Output VAT',
        calculation: `${standardRatedSales} × ${UAE_TAX_CONFIG.vat.standardRate}`,
        amount: outputVAT,
        regulation: 'UAE VAT Law Article 25'
      },
      {
        step: 3,
        description: 'Calculate Input VAT',
        calculation: `${expenses} × ${UAE_TAX_CONFIG.vat.standardRate}`,
        amount: inputVAT,
        regulation: 'UAE VAT Law Article 53'
      },
      {
        step: 4,
        description: 'Calculate Net VAT',
        calculation: `${outputVAT} - ${inputVAT}`,
        amount: netVAT,
        regulation: 'UAE VAT Law Article 65'
      }
    ],
    metadata: {
      calculatedAt: new Date(),
      calculatedBy: 1,
      inputs,
      regulations: ['UAE VAT Law Article 8', 'UAE VAT Law Article 25', 'UAE VAT Law Article 53'],
      version: '1.0.0'
    }
  };
}

function generateCITAudit(companyId, period, inputs) {
  const {
    revenue = 0,
    expenses = 0,
    isSmallBusiness = false,
    isQFZP = false
  } = inputs;
  
  const taxableIncome = Math.max(0, revenue - expenses);
  const citRate = isQFZP ? UAE_TAX_CONFIG.cit.qfzpRate : UAE_TAX_CONFIG.cit.standardRate;
  const citDue = taxableIncome * citRate;
  
  return {
    calculationId: `CIT-${Date.now()}`,
    type: 'CIT',
    companyId,
    period,
    totalAmount: citDue,
    steps: [
      {
        step: 1,
        description: 'Calculate Taxable Income',
        calculation: `${revenue} - ${expenses}`,
        amount: taxableIncome,
        regulation: 'UAE CIT Law Article 12'
      },
      {
        step: 2,
        description: 'Apply Tax Rate',
        calculation: `${taxableIncome} × ${citRate}`,
        amount: citDue,
        regulation: isQFZP ? 'UAE CIT Law Article 17' : 'UAE CIT Law Article 3',
        notes: isQFZP ? 'QFZP qualification applied' : isSmallBusiness ? 'Small business relief considered' : undefined
      }
    ],
    metadata: {
      calculatedAt: new Date(),
      calculatedBy: 1,
      inputs,
      regulations: ['UAE CIT Law Article 12', isQFZP ? 'UAE CIT Law Article 17' : 'UAE CIT Law Article 3'],
      version: '1.0.0'
    }
  };
}

export default router;