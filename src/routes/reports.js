import { Router } from 'express';

const router = Router();

// Generate P&L report
router.get('/profit-loss', (req, res) => {
  const { period = 'Q1-2025' } = req.query;
  
  const mockPL = {
    period,
    generatedAt: new Date().toISOString(),
    currency: 'AED',
    revenue: {
      sales: 120000,
      services: 35000,
      other: 5000,
      total: 160000
    },
    expenses: {
      costOfSales: 45000,
      operatingExpenses: 28000,
      administrativeExpenses: 12000,
      total: 85000
    },
    grossProfit: 75000,
    operatingProfit: 47000,
    netProfit: 47000,
    taxes: {
      vatDue: 3150,
      citDue: 4230
    }
  };
  
  res.json(mockPL);
});

// Generate Balance Sheet
router.get('/balance-sheet', (req, res) => {
  const { asOfDate = '2025-03-31' } = req.query;
  
  const mockBS = {
    asOfDate,
    generatedAt: new Date().toISOString(),
    currency: 'AED',
    assets: {
      current: {
        cash: 85000,
        accountsReceivable: 32000,
        inventory: 18000,
        total: 135000
      },
      nonCurrent: {
        equipment: 45000,
        furniture: 12000,
        total: 57000
      },
      totalAssets: 192000
    },
    liabilities: {
      current: {
        accountsPayable: 18000,
        vatPayable: 3150,
        citPayable: 4230,
        total: 25380
      },
      nonCurrent: {
        longTermDebt: 25000,
        total: 25000
      },
      totalLiabilities: 50380
    },
    equity: {
      paidInCapital: 100000,
      retainedEarnings: 41620,
      totalEquity: 141620
    }
  };
  
  res.json(mockBS);
});

// Generate Cash Flow Statement
router.get('/cash-flow', (req, res) => {
  const { period = 'Q1-2025' } = req.query;
  
  const mockCF = {
    period,
    generatedAt: new Date().toISOString(),
    currency: 'AED',
    operating: {
      netIncome: 47000,
      adjustments: {
        depreciation: 2000,
        accountsReceivableChange: -5000,
        accountsPayableChange: 3000
      },
      netOperatingCashFlow: 47000
    },
    investing: {
      equipmentPurchases: -8000,
      netInvestingCashFlow: -8000
    },
    financing: {
      loanProceeds: 0,
      loanRepayments: -2000,
      netFinancingCashFlow: -2000
    },
    netCashFlow: 37000,
    beginningCash: 48000,
    endingCash: 85000
  };
  
  res.json(mockCF);
});

// Generate tax summary report
router.get('/tax-summary', (req, res) => {
  const { year = '2024' } = req.query;
  
  const mockTaxSummary = {
    year,
    generatedAt: new Date().toISOString(),
    currency: 'AED',
    vat: {
      quarters: [
        { period: 'Q1', outputVAT: 4200, inputVAT: 1800, netVAT: 2400 },
        { period: 'Q2', outputVAT: 4800, inputVAT: 2100, netVAT: 2700 },
        { period: 'Q3', outputVAT: 5100, inputVAT: 2250, netVAT: 2850 },
        { period: 'Q4', outputVAT: 5250, inputVAT: 2100, netVAT: 3150 }
      ],
      annual: {
        totalOutputVAT: 19350,
        totalInputVAT: 8250,
        totalNetVAT: 11100
      }
    },
    cit: {
      annualRevenue: 640000,
      annualExpenses: 340000,
      taxableIncome: 300000,
      citRate: 0.09,
      citDue: 27000,
      reliefApplied: false
    },
    compliance: {
      vatReturnsSubmitted: 4,
      vatReturnsPending: 0,
      citReturnSubmitted: false,
      citReturnDue: '2025-03-31'
    }
  };
  
  res.json(mockTaxSummary);
});

export default router;