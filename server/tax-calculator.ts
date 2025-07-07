import { Transaction, Company } from '@shared/schema';

export interface TaxCalculationRequest {
  companyId: number;
  type: 'CIT' | 'VAT';
  startDate?: string;
  endDate?: string;
  period?: string;
}

export interface TaxCalculationResult {
  type: 'CIT' | 'VAT';
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  taxableBase: number;
  taxOwed: number;
  taxRate: number;
  explanation: string;
  breakdown: {
    revenueCategories: Record<string, number>;
    expenseCategories: Record<string, number>;
    exemptions: Record<string, number>;
    deductions: Record<string, number>;
  };
  freeZoneStatus?: {
    isEligible: boolean;
    exemptAmount: number;
    explanation: string;
  };
  smallBusinessRelief?: {
    isEligible: boolean;
    exemptAmount: number;
    explanation: string;
  };
}

export class TaxCalculator {
  // UAE VAT Standard Rate
  private static readonly UAE_VAT_RATE = 0.05; // 5% - TODO: Import from centralized config
  
  // UAE CIT Rates
  private static readonly UAE_CIT_STANDARD_RATE = 0.09; // 9% - TODO: Import from centralized config
  private static readonly UAE_CIT_SMALL_BUSINESS_THRESHOLD = 375000; // AED 375,000 - TODO: Import from centralized config  
  private static readonly UAE_FREE_ZONE_THRESHOLD = 3000000; // AED 3,000,000 - TODO: Import from centralized config

  static calculateVAT(
    transactions: Transaction[], 
    company: Company, 
    request: TaxCalculationRequest
  ): TaxCalculationResult {
    const { startDate, endDate, period = 'Current Period' } = request;
    
    // Filter transactions by date range if provided
    const filteredTransactions = this.filterTransactionsByDate(transactions, startDate, endDate);
    
    // Separate revenue and expenses
    const revenueTransactions = filteredTransactions.filter(t => t.type === 'REVENUE');
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'EXPENSE');
    
    // Calculate totals
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // VAT calculations
    const outputVAT = totalRevenue * this.UAE_VAT_RATE;
    const inputVAT = totalExpenses * this.UAE_VAT_RATE;
    const vatOwed = Math.max(0, outputVAT - inputVAT);
    
    // Revenue breakdown by category
    const revenueCategories = this.categorizeTransactions(revenueTransactions);
    const expenseCategories = this.categorizeTransactions(expenseTransactions);
    
    // Generate explanation
    const explanation = this.generateVATExplanation({
      totalRevenue,
      totalExpenses,
      outputVAT,
      inputVAT,
      vatOwed,
      company
    });

    return {
      type: 'VAT',
      period,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      taxableBase: totalRevenue,
      taxOwed: vatOwed,
      taxRate: this.UAE_VAT_RATE,
      explanation,
      breakdown: {
        revenueCategories,
        expenseCategories,
        exemptions: {},
        deductions: { inputVAT }
      }
    };
  }

  static calculateCIT(
    transactions: Transaction[], 
    company: Company, 
    request: TaxCalculationRequest
  ): TaxCalculationResult {
    const { startDate, endDate, period = 'Current Period' } = request;
    
    // Filter transactions by date range if provided
    const filteredTransactions = this.filterTransactionsByDate(transactions, startDate, endDate);
    
    // Separate revenue and expenses
    const revenueTransactions = filteredTransactions.filter(t => t.type === 'REVENUE');
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'EXPENSE');
    
    // Calculate totals
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    
    // Determine taxable base and applicable rates
    let taxableBase = Math.max(0, netIncome);
    let taxOwed = 0;
    let taxRate = this.UAE_CIT_STANDARD_RATE;
    
    // Small Business Relief (0% on first AED 375,000)
    const smallBusinessRelief = this.calculateSmallBusinessRelief(taxableBase);
    
    // Free Zone exemption check
    const freeZoneStatus = this.calculateFreeZoneExemption(company, taxableBase);
    
    // Apply exemptions and calculate tax
    if (freeZoneStatus.isEligible && taxableBase <= this.UAE_FREE_ZONE_THRESHOLD) {
      // Full Free Zone exemption
      taxOwed = 0;
      taxRate = 0;
    } else if (smallBusinessRelief.isEligible) {
      // Apply Small Business Relief
      const taxableAfterRelief = Math.max(0, taxableBase - this.UAE_CIT_SMALL_BUSINESS_THRESHOLD);
      taxOwed = taxableAfterRelief * this.UAE_CIT_STANDARD_RATE;
    } else {
      // Standard CIT rate
      taxOwed = taxableBase * this.UAE_CIT_STANDARD_RATE;
    }
    
    // Revenue and expense breakdown
    const revenueCategories = this.categorizeTransactions(revenueTransactions);
    const expenseCategories = this.categorizeTransactions(expenseTransactions);
    
    // Generate explanation
    const explanation = this.generateCITExplanation({
      totalRevenue,
      totalExpenses,
      netIncome,
      taxableBase,
      taxOwed,
      taxRate,
      company,
      smallBusinessRelief,
      freeZoneStatus
    });

    return {
      type: 'CIT',
      period,
      totalRevenue,
      totalExpenses,
      netIncome,
      taxableBase,
      taxOwed,
      taxRate,
      explanation,
      breakdown: {
        revenueCategories,
        expenseCategories,
        exemptions: freeZoneStatus.isEligible ? { freeZone: freeZoneStatus.exemptAmount } : {},
        deductions: smallBusinessRelief.isEligible ? { smallBusinessRelief: smallBusinessRelief.exemptAmount } : {}
      },
      freeZoneStatus,
      smallBusinessRelief
    };
  }

  private static filterTransactionsByDate(
    transactions: Transaction[], 
    startDate?: string, 
    endDate?: string
  ): Transaction[] {
    if (!startDate && !endDate) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      if (startDate && transactionDate < new Date(startDate)) return false;
      if (endDate && transactionDate > new Date(endDate)) return false;
      
      return true;
    });
  }

  private static categorizeTransactions(transactions: Transaction[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + transaction.amount;
    });
    
    return categories;
  }

  private static calculateSmallBusinessRelief(netIncome: number) {
    const isEligible = netIncome > 0;
    const exemptAmount = Math.min(netIncome, this.UAE_CIT_SMALL_BUSINESS_THRESHOLD);
    
    return {
      isEligible,
      exemptAmount: isEligible ? exemptAmount : 0,
      explanation: isEligible 
        ? `Small Business Relief applied: 0% CIT on first AED ${this.UAE_CIT_SMALL_BUSINESS_THRESHOLD.toLocaleString()}`
        : 'No Small Business Relief applicable'
    };
  }

  private static calculateFreeZoneExemption(company: Company, netIncome: number) {
    const isEligible = company.freeZone === true;
    const exemptAmount = isEligible && netIncome <= this.UAE_FREE_ZONE_THRESHOLD ? netIncome : 0;
    
    return {
      isEligible,
      exemptAmount,
      explanation: isEligible
        ? netIncome <= this.UAE_FREE_ZONE_THRESHOLD
          ? `Free Zone exemption: 0% CIT on qualifying income under AED ${this.UAE_FREE_ZONE_THRESHOLD.toLocaleString()}`
          : `Partial Free Zone exemption: Income exceeds AED ${this.UAE_FREE_ZONE_THRESHOLD.toLocaleString()} threshold`
        : 'Company is not registered in a UAE Free Zone'
    };
  }

  private static generateVATExplanation(params: {
    totalRevenue: number;
    totalExpenses: number;
    outputVAT: number;
    inputVAT: number;
    vatOwed: number;
    company: Company;
  }): string {
    const { totalRevenue, totalExpenses, outputVAT, inputVAT, vatOwed, company } = params;
    
    return `VAT Calculation for ${company.name}:

📊 Revenue Analysis:
• Total Revenue: AED ${totalRevenue.toLocaleString()}
• Output VAT (5%): AED ${outputVAT.toLocaleString()}

📊 Expense Analysis:
• Total Expenses: AED ${totalExpenses.toLocaleString()}
• Input VAT (5%): AED ${inputVAT.toLocaleString()}

💰 VAT Summary:
• Output VAT: AED ${outputVAT.toLocaleString()}
• Less: Input VAT: AED ${inputVAT.toLocaleString()}
• Net VAT ${vatOwed > 0 ? 'Payable' : 'Refundable'}: AED ${Math.abs(vatOwed).toLocaleString()}

🔍 Compliance Notes:
• Standard VAT rate of 5% applied per UAE Federal Decree-Law No. 8 of 2017
• ${vatOwed > 0 ? 'Payment due by 28th of following month' : 'Refund can be claimed on VAT201 return'}
• Maintain proper tax invoices and records for FTA audit requirements`;
  }

  private static generateCITExplanation(params: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    taxableBase: number;
    taxOwed: number;
    taxRate: number;
    company: Company;
    smallBusinessRelief: any;
    freeZoneStatus: any;
  }): string {
    const { 
      totalRevenue, 
      totalExpenses, 
      netIncome, 
      taxableBase, 
      taxOwed, 
      taxRate, 
      company, 
      smallBusinessRelief, 
      freeZoneStatus 
    } = params;
    
    return `Corporate Income Tax Calculation for ${company.name}:

📊 Financial Performance:
• Total Revenue: AED ${totalRevenue.toLocaleString()}
• Total Expenses: AED ${totalExpenses.toLocaleString()}
• Net Income: AED ${netIncome.toLocaleString()}

🎯 Tax Calculation:
• Taxable Base: AED ${taxableBase.toLocaleString()}
• Applicable Rate: ${(taxRate * 100).toFixed(1)}%
• CIT Payable: AED ${taxOwed.toLocaleString()}

${freeZoneStatus.isEligible ? `🏢 Free Zone Status: ${freeZoneStatus.explanation}` : ''}

${smallBusinessRelief.isEligible ? `🎁 Small Business Relief: ${smallBusinessRelief.explanation}` : ''}

🔍 Compliance Notes:
• Based on UAE Federal Decree-Law No. 47 of 2022
• Annual return filing deadline: Within 9 months of financial year-end
• Tax payment due: Within 9 months of financial year-end
• Maintain proper accounting records in accordance with IFRS standards`;
  }
}