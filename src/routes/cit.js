import { Router } from 'express';

const router = Router();

// UAE CIT configuration
const CIT_CONFIG = {
  standardRate: 0.09,
  smallBusinessThreshold: 3000000, // AED 3M
  qfzpRate: 0.0, // Qualified Free Zone Person
  minimumTax: 0
};

// Calculate CIT
router.post('/calculate', (req, res) => {
  try {
    const {
      revenue = 0,
      expenses = 0,
      isSmallBusiness = false,
      isQFZP = false,
      period = '2024'
    } = req.body;
    
    const taxableIncome = Math.max(0, revenue - expenses);
    
    let citRate = CIT_CONFIG.standardRate;
    let reliefApplied = false;
    
    // Apply small business relief
    if (isSmallBusiness && revenue <= CIT_CONFIG.smallBusinessThreshold) {
      // Small Business Relief - same rate but different treatment
      reliefApplied = true;
    }
    
    // Apply QFZP rate
    if (isQFZP) {
      citRate = CIT_CONFIG.qfzpRate;
    }
    
    const citDue = Math.max(CIT_CONFIG.minimumTax, taxableIncome * citRate);
    
    const calculation = {
      period,
      inputs: {
        revenue,
        expenses,
        taxableIncome,
        isSmallBusiness,
        isQFZP
      },
      calculations: {
        citRate,
        citDue,
        reliefApplied
      },
      regulations: {
        standardRate: CIT_CONFIG.standardRate,
        smallBusinessThreshold: CIT_CONFIG.smallBusinessThreshold,
        qfzpRate: CIT_CONFIG.qfzpRate
      },
      calculatedAt: new Date().toISOString()
    };
    
    res.json(calculation);
  } catch (error) {
    console.error('CIT calculation error:', error);
    res.status(500).json({ error: 'CIT calculation failed' });
  }
});

// Get CIT return data
router.get('/returns/:year', (req, res) => {
  const { year } = req.params;
  
  // Mock CIT return data
  const citReturn = {
    year,
    dueDate: '2025-03-31',
    status: 'pending',
    summary: {
      totalRevenue: 2500000,
      totalExpenses: 1800000,
      taxableIncome: 700000,
      citRate: 0.09,
      citDue: 63000,
      reliefApplied: true
    },
    submittedAt: null,
    submittedBy: null
  };
  
  res.json(citReturn);
});

// Submit CIT return
router.post('/returns/:year/submit', (req, res) => {
  const { year } = req.params;
  
  res.json({
    success: true,
    year,
    submittedAt: new Date().toISOString(),
    confirmationNumber: `CIT-${year}-${Date.now()}`,
    message: 'CIT return submitted successfully'
  });
});

export default router;