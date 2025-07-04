/**
 * UAE Tax Calculation Utilities
 */

export interface VatCalculationParams {
  sales: number;
  purchases: number;
  exemptSales?: number;
  exemptPurchases?: number;
  vatRate?: number;
}

export interface CitCalculationParams {
  revenue: number;
  expenses: number;
  freeZone?: boolean;
  eligibleIncome?: number;
  smallBusinessThreshold?: number;
}

/**
 * Calculate VAT liability (5% standard rate)
 */
export function calculateVat(params: VatCalculationParams) {
  const { sales, purchases, exemptSales = 0, exemptPurchases = 0, vatRate = 0.05 } = params;
  
  const taxableSales = sales - exemptSales;
  const taxablePurchases = purchases - exemptPurchases;
  
  const outputVat = taxableSales * vatRate;
  const inputVat = taxablePurchases * vatRate;
  const netVatDue = Math.max(0, outputVat - inputVat);
  
  return {
    taxableSales,
    taxablePurchases,
    outputVat,
    inputVat,
    netVatDue,
    vatRate,
  };
}

/**
 * Calculate Corporate Income Tax with Small Business Relief
 */
export function calculateCit(params: CitCalculationParams) {
  const { 
    revenue, 
    expenses, 
    freeZone = false, 
    eligibleIncome = 0,
    smallBusinessThreshold = 375000 
  } = params;
  
  const netIncome = revenue - expenses;
  const citRate = 0.09; // 9% standard rate
  
  let citDue = 0;
  let smallBusinessRelief = 0;
  let taxableIncome = netIncome;
  
  // Small Business Relief - 0% on first AED 375,000
  if (netIncome <= smallBusinessThreshold) {
    citDue = 0;
    smallBusinessRelief = netIncome;
    taxableIncome = 0;
  } else {
    smallBusinessRelief = smallBusinessThreshold;
    taxableIncome = netIncome - smallBusinessThreshold;
    citDue = taxableIncome * citRate;
  }
  
  // QFZP (Qualified Free Zone Person) logic
  // If Free Zone and eligible income < AED 3m, CIT remains 0%
  const qfzpApplied = freeZone && eligibleIncome < 3000000;
  if (qfzpApplied) {
    citDue = 0;
  }
  
  return {
    netIncome,
    citRate: citRate * 100, // Return as percentage
    smallBusinessRelief,
    taxableIncome,
    citDue,
    qfzpApplied,
    freeZone,
  };
}

/**
 * Calculate monthly VAT projection based on current transactions
 */
export function projectMonthlyVat(transactions: any[]) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transactionDate);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });
  
  let totalSales = 0;
  let totalPurchases = 0;
  
  monthlyTransactions.forEach(t => {
    if (t.type === 'REVENUE') {
      totalSales += parseFloat(t.amount);
    } else if (t.type === 'EXPENSE') {
      totalPurchases += parseFloat(t.amount);
    }
  });
  
  return calculateVat({ sales: totalSales, purchases: totalPurchases });
}

/**
 * Calculate quarterly CIT projection
 */
export function projectQuarterlyCit(transactions: any[], company: any) {
  const currentQuarter = Math.floor(new Date().getMonth() / 3);
  const currentYear = new Date().getFullYear();
  
  const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
  const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0);
  
  const quarterlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transactionDate);
    return transactionDate >= quarterStart && transactionDate <= quarterEnd;
  });
  
  let totalRevenue = 0;
  let totalExpenses = 0;
  
  quarterlyTransactions.forEach(t => {
    if (t.type === 'REVENUE') {
      totalRevenue += parseFloat(t.amount);
    } else if (t.type === 'EXPENSE') {
      totalExpenses += parseFloat(t.amount);
    }
  });
  
  return calculateCit({
    revenue: totalRevenue,
    expenses: totalExpenses,
    freeZone: company?.freeZone || false,
    eligibleIncome: totalRevenue, // Simplified assumption
  });
}

/**
 * Generate tax compliance status
 */
export function getTaxComplianceStatus(vatDue: number, citDue: number, deadlines: any[]) {
  const upcomingDeadlines = deadlines.filter(d => {
    const daysUntil = Math.ceil((new Date(d.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  });
  
  let status = 'COMPLIANT';
  let risks: string[] = [];
  
  if (upcomingDeadlines.length > 0) {
    const nearestDeadline = upcomingDeadlines.reduce((nearest, current) => {
      const nearestDays = Math.ceil((new Date(nearest.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const currentDays = Math.ceil((new Date(current.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return currentDays < nearestDays ? current : nearest;
    });
    
    const daysUntilNearest = Math.ceil((new Date(nearestDeadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilNearest <= 7) {
      status = 'AT_RISK';
      risks.push(`${nearestDeadline.title} due in ${daysUntilNearest} days`);
    } else if (daysUntilNearest <= 14) {
      status = 'ATTENTION_NEEDED';
      risks.push(`${nearestDeadline.title} due in ${daysUntilNearest} days`);
    }
  }
  
  if (vatDue > 50000 || citDue > 100000) {
    status = 'ATTENTION_NEEDED';
    risks.push('High tax liability detected');
  }
  
  return {
    status,
    risks,
    upcomingDeadlines: upcomingDeadlines.length,
    totalTaxDue: vatDue + citDue,
  };
}
