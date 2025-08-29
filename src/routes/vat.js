import { Router } from 'express';

const router = Router();

// UAE VAT configuration
const VAT_CONFIG = {
  standardRate: 0.05,
  registrationThresholds: {
    mandatory: 375000, // AED 375K
    voluntary: 187500  // AED 187.5K
  },
  zeroRatedSupplies: ['exports', 'medical', 'education'],
  exemptSupplies: ['residential_rent', 'local_transport']
};

// Calculate VAT
router.post('/calculate', (req, res) => {
  try {
    const { 
      revenue = 0, 
      expenses = 0, 
      exemptSales = 0,
      zeroRatedSales = 0,
      period = 'Q1-2025'
    } = req.body;
    
    const standardRatedSales = Math.max(0, revenue - exemptSales - zeroRatedSales);
    const outputVAT = standardRatedSales * VAT_CONFIG.standardRate;
    const inputVAT = expenses * VAT_CONFIG.standardRate;
    const netVAT = Math.max(0, outputVAT - inputVAT);
    
    const calculation = {
      period,
      inputs: {
        revenue,
        expenses,
        exemptSales,
        zeroRatedSales,
        standardRatedSales
      },
      calculations: {
        outputVAT,
        inputVAT,
        netVAT
      },
      vatRate: VAT_CONFIG.standardRate,
      calculatedAt: new Date().toISOString()
    };
    
    res.json(calculation);
  } catch (error) {
    console.error('VAT calculation error:', error);
    res.status(500).json({ error: 'VAT calculation failed' });
  }
});

// Get VAT return data
router.get('/returns/:period', (req, res) => {
  const { period } = req.params;
  
  // Mock VAT return data
  const vatReturn = {
    period,
    dueDate: '2025-01-28',
    status: 'pending',
    summary: {
      totalSales: 120000,
      exemptSales: 10000,
      zeroRatedSales: 5000,
      standardRatedSales: 105000,
      outputVAT: 5250,
      inputVAT: 2100,
      netVAT: 3150
    },
    submittedAt: null,
    submittedBy: null
  };
  
  res.json(vatReturn);
});

// Submit VAT return
router.post('/returns/:period/submit', (req, res) => {
  const { period } = req.params;
  
  res.json({
    success: true,
    period,
    submittedAt: new Date().toISOString(),
    confirmationNumber: `VAT-${period}-${Date.now()}`,
    message: 'VAT return submitted successfully'
  });
});

export default router;