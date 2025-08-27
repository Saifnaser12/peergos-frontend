// Business Logic Utilities for Peergos Tax Compliance System
// Handles all calculations, validations, and data transformations

export interface FinancialData {
  revenue: number;
  expenses: number;
  netIncome: number;
  vatDue: number;
  citDue: number;
  vatInput?: number;
  vatOutput?: number;
}

export interface TransactionData {
  amount: number;
  vatAmount: number;
  type: 'REVENUE' | 'EXPENSE';
  category: string;
  transactionDate: string;
}

// UAE Tax Constants
export const UAE_TAX_RATES = {
  VAT_RATE: 0.05, // 5%
  CIT_RATE: 0.09, // 9%
  SMALL_BUSINESS_THRESHOLD: 375000, // AED 375,000
  VAT_REGISTRATION_THRESHOLD: 187500, // AED 187,500
  DMTT_THRESHOLD: 750000000, // EUR 750M converted to AED
  DMTT_RATE: 0.15, // 15%
} as const;

export const SME_CATEGORIES = {
  MICRO: { revenue: 375000, employees: 10, description: 'Micro Business' },
  SMALL: { revenue: 3000000, employees: 50, description: 'Small Business' },
  MEDIUM: { revenue: 25000000, employees: 250, description: 'Medium Business' },
} as const;

// Format currency with proper UAE dirham formatting
export function formatCurrency(amount: number | string, showDecimals = true): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return 'AED 0';
  
  const formatter = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  
  return formatter.format(numAmount);
}

// Calculate VAT based on UAE regulations
export function calculateVAT(amount: number, includesVat = false): { netAmount: number; vatAmount: number; grossAmount: number } {
  const numAmount = Math.abs(amount);
  
  if (includesVat) {
    // Extract VAT from gross amount
    const netAmount = numAmount / (1 + UAE_TAX_RATES.VAT_RATE);
    const vatAmount = numAmount - netAmount;
    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: numAmount
    };
  } else {
    // Add VAT to net amount
    const vatAmount = numAmount * UAE_TAX_RATES.VAT_RATE;
    const grossAmount = numAmount + vatAmount;
    return {
      netAmount: numAmount,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100
    };
  }
}

// Calculate Corporate Income Tax with Small Business Relief
export function calculateCIT(netIncome: number, isQFZP = false): { citDue: number; reliefAmount: number; taxableIncome: number } {
  const income = Math.max(0, netIncome);
  
  if (isQFZP && income <= 3000000) {
    // QFZP relief for qualifying income under AED 3M
    return { citDue: 0, reliefAmount: income, taxableIncome: 0 };
  }
  
  if (income <= UAE_TAX_RATES.SMALL_BUSINESS_THRESHOLD) {
    // Small Business Relief - 0% on first AED 375,000
    return { citDue: 0, reliefAmount: income, taxableIncome: 0 };
  }
  
  // Standard 9% CIT on amount above threshold
  const taxableIncome = income - UAE_TAX_RATES.SMALL_BUSINESS_THRESHOLD;
  const citDue = taxableIncome * UAE_TAX_RATES.CIT_RATE;
  
  return {
    citDue: Math.round(citDue * 100) / 100,
    reliefAmount: UAE_TAX_RATES.SMALL_BUSINESS_THRESHOLD,
    taxableIncome: Math.round(taxableIncome * 100) / 100
  };
}

// Determine SME category based on revenue
export function getSMECategory(revenue: number): { category: keyof typeof SME_CATEGORIES; details: any } {
  if (revenue <= SME_CATEGORIES.MICRO.revenue) {
    return { category: 'MICRO', details: SME_CATEGORIES.MICRO };
  } else if (revenue <= SME_CATEGORIES.SMALL.revenue) {
    return { category: 'SMALL', details: SME_CATEGORIES.SMALL };
  } else {
    return { category: 'MEDIUM', details: SME_CATEGORIES.MEDIUM };
  }
}

// Calculate VAT registration requirement
export function getVATRegistrationStatus(quarterlyRevenue: number): {
  required: boolean;
  threshold: number;
  percentage: number;
  daysToRegister?: number;
} {
  const threshold = UAE_TAX_RATES.VAT_REGISTRATION_THRESHOLD;
  const percentage = Math.min((quarterlyRevenue / threshold) * 100, 100);
  
  if (quarterlyRevenue > threshold) {
    return {
      required: true,
      threshold,
      percentage,
      daysToRegister: 30 // Must register within 30 days
    };
  }
  
  return {
    required: false,
    threshold,
    percentage
  };
}

// Calculate comprehensive financial metrics
export function calculateFinancialMetrics(transactions: TransactionData[]): FinancialData {
  let totalRevenue = 0;
  let totalExpenses = 0;
  let vatOutput = 0; // VAT on sales
  let vatInput = 0;  // VAT on purchases
  
  transactions.forEach(transaction => {
    const amount = Math.abs(transaction.amount);
    const vatAmount = Math.abs(transaction.vatAmount || 0);
    
    if (transaction.type === 'REVENUE') {
      totalRevenue += amount;
      vatOutput += vatAmount;
    } else {
      totalExpenses += amount;
      vatInput += vatAmount;
    }
  });
  
  const netIncome = totalRevenue - totalExpenses;
  const netVatDue = Math.max(0, vatOutput - vatInput);
  const { citDue } = calculateCIT(netIncome);
  
  return {
    revenue: Math.round(totalRevenue * 100) / 100,
    expenses: Math.round(totalExpenses * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    vatDue: Math.round(netVatDue * 100) / 100,
    citDue,
    vatInput: Math.round(vatInput * 100) / 100,
    vatOutput: Math.round(vatOutput * 100) / 100
  };
}

// Validate transaction data
export function validateTransaction(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.push('Amount must be a positive number');
  }
  
  if (!data.description || data.description.trim().length < 3) {
    errors.push('Description must be at least 3 characters');
  }
  
  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  if (!data.type || !['REVENUE', 'EXPENSE'].includes(data.type)) {
    errors.push('Transaction type must be REVENUE or EXPENSE');
  }
  
  if (!data.transactionDate) {
    errors.push('Transaction date is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Calculate tax health score (0-100)
export function calculateTaxHealthScore(financial: FinancialData, compliance: {
  hasValidTRN: boolean;
  recordsUpToDate: boolean;
  filingOnTime: boolean;
  paymentOnTime: boolean;
}): { score: number; factors: any[] } {
  const factors = [];
  let score = 0;
  
  // Financial health (40 points)
  if (financial.netIncome > 0) {
    score += 20;
    factors.push({ factor: 'Positive Net Income', points: 20, status: 'good' });
  } else {
    factors.push({ factor: 'Negative Net Income', points: 0, status: 'warning' });
  }
  
  if (financial.revenue > 0) {
    score += 20;
    factors.push({ factor: 'Active Revenue Stream', points: 20, status: 'good' });
  } else {
    factors.push({ factor: 'No Revenue Recorded', points: 0, status: 'critical' });
  }
  
  // Compliance health (60 points)
  if (compliance.hasValidTRN) {
    score += 15;
    factors.push({ factor: 'Valid TRN Registration', points: 15, status: 'good' });
  } else {
    factors.push({ factor: 'Invalid TRN', points: 0, status: 'critical' });
  }
  
  if (compliance.recordsUpToDate) {
    score += 15;
    factors.push({ factor: 'Records Up to Date', points: 15, status: 'good' });
  } else {
    factors.push({ factor: 'Records Behind', points: 0, status: 'warning' });
  }
  
  if (compliance.filingOnTime) {
    score += 15;
    factors.push({ factor: 'Timely Tax Filings', points: 15, status: 'good' });
  } else {
    factors.push({ factor: 'Late Filings', points: 0, status: 'warning' });
  }
  
  if (compliance.paymentOnTime) {
    score += 15;
    factors.push({ factor: 'Timely Payments', points: 15, status: 'good' });
  } else {
    factors.push({ factor: 'Late Payments', points: 0, status: 'critical' });
  }
  
  return { score, factors };
}

// Format percentage with proper display
export function formatPercentage(value: number): string {
  if (isNaN(value)) return '0%';
  return `${Math.round(value * 100) / 100}%`;
}

// Safe number parsing with fallback
export function safeParseFloat(value: any, fallback = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

// Business expense categories for UAE market
export const UAE_EXPENSE_CATEGORIES = {
  'Office Supplies': { deductible: true, vatApplicable: true },
  'Marketing & Advertising': { deductible: true, vatApplicable: true },
  'Professional Services': { deductible: true, vatApplicable: true },
  'Travel & Transportation': { deductible: true, vatApplicable: true },
  'Equipment & Software': { deductible: true, vatApplicable: true },
  'Rent & Utilities': { deductible: true, vatApplicable: true },
  'Staff Costs': { deductible: true, vatApplicable: false },
  'Insurance': { deductible: true, vatApplicable: false },
  'Bank Charges': { deductible: true, vatApplicable: false },
  'Legal & Compliance': { deductible: true, vatApplicable: true },
} as const;

export type ExpenseCategory = keyof typeof UAE_EXPENSE_CATEGORIES;