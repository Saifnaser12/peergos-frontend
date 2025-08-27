import { formatCurrency } from './business-logic';

export interface CompanyInfo {
  name: string;
  trn: string;
  licenseNumber: string;
  address: string;
  isFreeZone: boolean;
  freeZoneName?: string;
  accountingBasis: 'cash' | 'accrual';
  fiscalYearEnd: string;
}

export interface Transaction {
  id: number;
  type: 'REVENUE' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY';
  category: string;
  description: string;
  amount: number;
  transactionDate: string;
  vatAmount?: number;
  isVatApplicable: boolean;
}

export interface OpeningBalance {
  account: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY';
  amount: number;
  description?: string;
}

export interface IncomeStatementData {
  revenue: {
    operatingRevenue: number;
    otherIncome: number;
    totalRevenue: number;
  };
  expenses: {
    costOfSales: number;
    operatingExpenses: number;
    administrativeExpenses: number;
    financeExpenses: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  netIncome: number;
  grossProfit: number;
  operatingProfit: number;
}

export interface BalanceSheetData {
  assets: {
    currentAssets: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      prepaidExpenses: number;
      otherCurrentAssets: number;
      totalCurrentAssets: number;
    };
    nonCurrentAssets: {
      propertyPlantEquipment: number;
      intangibleAssets: number;
      investments: number;
      otherNonCurrentAssets: number;
      totalNonCurrentAssets: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      shortTermLoans: number;
      accruedExpenses: number;
      taxPayable: number;
      otherCurrentLiabilities: number;
      totalCurrentLiabilities: number;
    };
    nonCurrentLiabilities: {
      longTermLoans: number;
      provisions: number;
      otherNonCurrentLiabilities: number;
      totalNonCurrentLiabilities: number;
    };
    totalLiabilities: number;
  };
  equity: {
    shareCapital: number;
    retainedEarnings: number;
    currentYearEarnings: number;
    otherReserves: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface CashFlowData {
  operatingActivities: {
    netIncome: number;
    adjustments: {
      depreciation: number;
      changeInReceivables: number;
      changeInInventory: number;
      changeInPayables: number;
      otherAdjustments: number;
    };
    netCashFromOperating: number;
  };
  investingActivities: {
    purchaseOfAssets: number;
    saleOfAssets: number;
    investments: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    borrowings: number;
    repayments: number;
    dividends: number;
    shareCapital: number;
    netCashFromFinancing: number;
  };
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
}

export interface FinancialStatements {
  companyInfo: CompanyInfo;
  period: {
    startDate: string;
    endDate: string;
  };
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
  notes: string[];
  generationDate: string;
}

// UAE FTA Standard Chart of Accounts mapping
export const UAE_ACCOUNT_CATEGORIES = {
  REVENUE: {
    'OPERATING_REVENUE': 'Sales Revenue',
    'SERVICE_REVENUE': 'Service Revenue',
    'OTHER_INCOME': 'Other Income',
    'FINANCE_INCOME': 'Finance Income',
  },
  EXPENSE: {
    'COST_OF_SALES': 'Cost of Sales',
    'SALARIES': 'Salaries and Benefits',
    'RENT': 'Rent and Utilities',
    'PROFESSIONAL_FEES': 'Professional Fees',
    'MARKETING': 'Marketing and Advertising',
    'TRAVEL': 'Travel and Entertainment',
    'OFFICE_EXPENSES': 'Office and Administrative',
    'FINANCE_COSTS': 'Finance Costs',
    'DEPRECIATION': 'Depreciation',
    'OTHER_EXPENSES': 'Other Expenses',
  },
  ASSET: {
    'CASH': 'Cash and Bank',
    'ACCOUNTS_RECEIVABLE': 'Accounts Receivable',
    'INVENTORY': 'Inventory',
    'PREPAID': 'Prepaid Expenses',
    'FIXED_ASSETS': 'Property, Plant & Equipment',
    'INTANGIBLE': 'Intangible Assets',
    'INVESTMENTS': 'Investments',
  },
  LIABILITY: {
    'ACCOUNTS_PAYABLE': 'Accounts Payable',
    'LOANS': 'Loans and Borrowings',
    'ACCRUED': 'Accrued Expenses',
    'TAX_PAYABLE': 'Tax Payable',
    'PROVISIONS': 'Provisions',
  },
  EQUITY: {
    'SHARE_CAPITAL': 'Share Capital',
    'RETAINED_EARNINGS': 'Retained Earnings',
    'RESERVES': 'Reserves',
  }
};

export class FinancialStatementsGenerator {
  private transactions: Transaction[];
  private openingBalances: OpeningBalance[];
  private companyInfo: CompanyInfo;

  constructor(
    transactions: Transaction[],
    openingBalances: OpeningBalance[],
    companyInfo: CompanyInfo
  ) {
    this.transactions = transactions;
    this.openingBalances = openingBalances;
    this.companyInfo = companyInfo;
  }

  generateIncomeStatement(startDate: string, endDate: string): IncomeStatementData {
    const periodTransactions = this.getTransactionsInPeriod(startDate, endDate);
    
    const revenue = this.calculateRevenue(periodTransactions);
    const expenses = this.calculateExpenses(periodTransactions);
    
    const grossProfit = revenue.operatingRevenue - expenses.costOfSales;
    const operatingProfit = grossProfit - expenses.operatingExpenses - expenses.administrativeExpenses;
    const netIncome = revenue.totalRevenue - expenses.totalExpenses;

    return {
      revenue,
      expenses,
      grossProfit,
      operatingProfit,
      netIncome,
    };
  }

  generateBalanceSheet(asOfDate: string): BalanceSheetData {
    const transactionsToDate = this.getTransactionsToDate(asOfDate);
    
    const assets = this.calculateAssets(transactionsToDate);
    const liabilities = this.calculateLiabilities(transactionsToDate);
    const equity = this.calculateEquity(transactionsToDate);

    return {
      assets,
      liabilities,
      equity,
      totalLiabilitiesAndEquity: liabilities.totalLiabilities + equity.totalEquity,
    };
  }

  generateCashFlow(startDate: string, endDate: string): CashFlowData {
    const incomeStatement = this.generateIncomeStatement(startDate, endDate);
    const openingBS = this.generateBalanceSheet(startDate);
    const closingBS = this.generateBalanceSheet(endDate);

    const operatingActivities = {
      netIncome: incomeStatement.netIncome,
      adjustments: {
        depreciation: this.getDepreciationForPeriod(startDate, endDate),
        changeInReceivables: closingBS.assets.currentAssets.accountsReceivable - openingBS.assets.currentAssets.accountsReceivable,
        changeInInventory: closingBS.assets.currentAssets.inventory - openingBS.assets.currentAssets.inventory,
        changeInPayables: closingBS.liabilities.currentLiabilities.accountsPayable - openingBS.liabilities.currentLiabilities.accountsPayable,
        otherAdjustments: 0,
      },
      netCashFromOperating: 0,
    };

    operatingActivities.netCashFromOperating = 
      operatingActivities.netIncome +
      operatingActivities.adjustments.depreciation -
      operatingActivities.adjustments.changeInReceivables -
      operatingActivities.adjustments.changeInInventory +
      operatingActivities.adjustments.changeInPayables +
      operatingActivities.adjustments.otherAdjustments;

    const investingActivities = {
      purchaseOfAssets: this.getAssetPurchases(startDate, endDate),
      saleOfAssets: this.getAssetSales(startDate, endDate),
      investments: this.getInvestmentChanges(startDate, endDate),
      netCashFromInvesting: 0,
    };

    investingActivities.netCashFromInvesting = 
      investingActivities.saleOfAssets - 
      investingActivities.purchaseOfAssets - 
      investingActivities.investments;

    const financingActivities = {
      borrowings: this.getBorrowings(startDate, endDate),
      repayments: this.getRepayments(startDate, endDate),
      dividends: this.getDividends(startDate, endDate),
      shareCapital: this.getShareCapitalChanges(startDate, endDate),
      netCashFromFinancing: 0,
    };

    financingActivities.netCashFromFinancing = 
      financingActivities.borrowings - 
      financingActivities.repayments - 
      financingActivities.dividends + 
      financingActivities.shareCapital;

    const netCashFlow = 
      operatingActivities.netCashFromOperating + 
      investingActivities.netCashFromInvesting + 
      financingActivities.netCashFromFinancing;

    return {
      operatingActivities,
      investingActivities,
      financingActivities,
      netCashFlow,
      openingCash: openingBS.assets.currentAssets.cash,
      closingCash: openingBS.assets.currentAssets.cash + netCashFlow,
    };
  }

  generateStandardNotes(): string[] {
    const isFreeZone = this.companyInfo.isFreeZone;
    const basis = this.companyInfo.accountingBasis;

    return [
      "1. CORPORATE INFORMATION",
      `${this.companyInfo.name} (the "Company") is a ${isFreeZone ? 'Free Zone ' : ''}company incorporated in the United Arab Emirates. The Company is engaged in ${this.getBusinessActivity()}.`,
      
      "2. BASIS OF PREPARATION",
      `These financial statements have been prepared in accordance with UAE Federal Decree Law No. 32 of 2021 on Commercial Companies and applicable UAE Financial Reporting Standards. The Company follows the ${basis} basis of accounting as permitted for ${this.getSMECategory()} under UAE FTA regulations.`,
      
      "3. SIGNIFICANT ACCOUNTING POLICIES",
      "Revenue Recognition: Revenue is recognized when performance obligations are satisfied and control is transferred to the customer.",
      "Expenses: Expenses are recognized when incurred in accordance with the matching principle.",
      
      "4. TAXATION",
      `The Company is subject to UAE Corporate Income Tax at ${this.getCITRate()}% as applicable to ${this.getSMECategory()}. ${isFreeZone ? 'As a Free Zone entity, the Company may be eligible for certain tax exemptions under the Qualifying Free Zone Person provisions.' : ''}`,
      
      "5. SUBSEQUENT EVENTS",
      "There are no material subsequent events that require disclosure or adjustment to these financial statements.",
      
      "6. APPROVAL OF FINANCIAL STATEMENTS",
      `These financial statements were approved by the management on ${new Date().toLocaleDateString('en-AE')}.`
    ];
  }

  private getTransactionsInPeriod(startDate: string, endDate: string): Transaction[] {
    return this.transactions.filter(t => {
      const transDate = new Date(t.transactionDate);
      return transDate >= new Date(startDate) && transDate <= new Date(endDate);
    });
  }

  private getTransactionsToDate(asOfDate: string): Transaction[] {
    return this.transactions.filter(t => 
      new Date(t.transactionDate) <= new Date(asOfDate)
    );
  }

  private calculateRevenue(transactions: Transaction[]) {
    const revenueTransactions = transactions.filter(t => t.type === 'REVENUE');
    
    const operatingRevenue = revenueTransactions
      .filter(t => ['OPERATING_REVENUE', 'SERVICE_REVENUE'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const otherIncome = revenueTransactions
      .filter(t => ['OTHER_INCOME', 'FINANCE_INCOME'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalRevenue = operatingRevenue + otherIncome;

    return { operatingRevenue, otherIncome, totalRevenue };
  }

  private calculateExpenses(transactions: Transaction[]) {
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
    
    const costOfSales = expenseTransactions
      .filter(t => t.category === 'COST_OF_SALES')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const operatingExpenses = expenseTransactions
      .filter(t => ['SALARIES', 'RENT', 'MARKETING', 'TRAVEL'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const administrativeExpenses = expenseTransactions
      .filter(t => ['PROFESSIONAL_FEES', 'OFFICE_EXPENSES'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const financeExpenses = expenseTransactions
      .filter(t => t.category === 'FINANCE_COSTS')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const otherExpenses = expenseTransactions
      .filter(t => ['DEPRECIATION', 'OTHER_EXPENSES'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = costOfSales + operatingExpenses + administrativeExpenses + financeExpenses + otherExpenses;

    return {
      costOfSales,
      operatingExpenses,
      administrativeExpenses,
      financeExpenses,
      otherExpenses,
      totalExpenses,
    };
  }

  private calculateAssets(transactions: Transaction[]) {
    const assetTransactions = transactions.filter(t => t.type === 'ASSET');
    
    // Current Assets
    const cash = this.getBalanceForCategory('CASH', assetTransactions);
    const accountsReceivable = this.getBalanceForCategory('ACCOUNTS_RECEIVABLE', assetTransactions);
    const inventory = this.getBalanceForCategory('INVENTORY', assetTransactions);
    const prepaidExpenses = this.getBalanceForCategory('PREPAID', assetTransactions);
    const otherCurrentAssets = 0;
    const totalCurrentAssets = cash + accountsReceivable + inventory + prepaidExpenses + otherCurrentAssets;

    // Non-Current Assets
    const propertyPlantEquipment = this.getBalanceForCategory('FIXED_ASSETS', assetTransactions);
    const intangibleAssets = this.getBalanceForCategory('INTANGIBLE', assetTransactions);
    const investments = this.getBalanceForCategory('INVESTMENTS', assetTransactions);
    const otherNonCurrentAssets = 0;
    const totalNonCurrentAssets = propertyPlantEquipment + intangibleAssets + investments + otherNonCurrentAssets;

    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    return {
      currentAssets: {
        cash,
        accountsReceivable,
        inventory,
        prepaidExpenses,
        otherCurrentAssets,
        totalCurrentAssets,
      },
      nonCurrentAssets: {
        propertyPlantEquipment,
        intangibleAssets,
        investments,
        otherNonCurrentAssets,
        totalNonCurrentAssets,
      },
      totalAssets,
    };
  }

  private calculateLiabilities(transactions: Transaction[]) {
    const liabilityTransactions = transactions.filter(t => t.type === 'LIABILITY');
    
    // Current Liabilities
    const accountsPayable = this.getBalanceForCategory('ACCOUNTS_PAYABLE', liabilityTransactions);
    const shortTermLoans = this.getBalanceForCategory('LOANS', liabilityTransactions);
    const accruedExpenses = this.getBalanceForCategory('ACCRUED', liabilityTransactions);
    const taxPayable = this.getBalanceForCategory('TAX_PAYABLE', liabilityTransactions);
    const otherCurrentLiabilities = 0;
    const totalCurrentLiabilities = accountsPayable + shortTermLoans + accruedExpenses + taxPayable + otherCurrentLiabilities;

    // Non-Current Liabilities
    const longTermLoans = 0; // Would need separate categorization
    const provisions = this.getBalanceForCategory('PROVISIONS', liabilityTransactions);
    const otherNonCurrentLiabilities = 0;
    const totalNonCurrentLiabilities = longTermLoans + provisions + otherNonCurrentLiabilities;

    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    return {
      currentLiabilities: {
        accountsPayable,
        shortTermLoans,
        accruedExpenses,
        taxPayable,
        otherCurrentLiabilities,
        totalCurrentLiabilities,
      },
      nonCurrentLiabilities: {
        longTermLoans,
        provisions,
        otherNonCurrentLiabilities,
        totalNonCurrentLiabilities,
      },
      totalLiabilities,
    };
  }

  private calculateEquity(transactions: Transaction[]) {
    const equityTransactions = transactions.filter(t => t.type === 'EQUITY');
    
    const shareCapital = this.getBalanceForCategory('SHARE_CAPITAL', equityTransactions);
    const retainedEarnings = this.getBalanceForCategory('RETAINED_EARNINGS', equityTransactions);
    const currentYearEarnings = 0; // Would be calculated from current year P&L
    const otherReserves = this.getBalanceForCategory('RESERVES', equityTransactions);
    
    const totalEquity = shareCapital + retainedEarnings + currentYearEarnings + otherReserves;

    return {
      shareCapital,
      retainedEarnings,
      currentYearEarnings,
      otherReserves,
      totalEquity,
    };
  }

  private getBalanceForCategory(category: string, transactions: Transaction[]): number {
    const openingBalance = this.openingBalances
      .filter(ob => ob.account === category)
      .reduce((sum, ob) => sum + ob.amount, 0);
    
    const transactionBalance = transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return openingBalance + transactionBalance;
  }

  private getDepreciationForPeriod(startDate: string, endDate: string): number {
    return this.getTransactionsInPeriod(startDate, endDate)
      .filter(t => t.category === 'DEPRECIATION')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getAssetPurchases(startDate: string, endDate: string): number {
    return this.getTransactionsInPeriod(startDate, endDate)
      .filter(t => t.type === 'ASSET' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getAssetSales(startDate: string, endDate: string): number {
    return this.getTransactionsInPeriod(startDate, endDate)
      .filter(t => t.type === 'ASSET' && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  private getInvestmentChanges(startDate: string, endDate: string): number {
    return this.getTransactionsInPeriod(startDate, endDate)
      .filter(t => t.category === 'INVESTMENTS')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getBorrowings(startDate: string, endDate: string): number {
    return this.getTransactionsInPeriod(startDate, endDate)
      .filter(t => t.category === 'LOANS' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getRepayments(startDate: string, endDate: string): number {
    return this.getTransactionsInPeriod(startDate, endDate)
      .filter(t => t.category === 'LOANS' && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  private getDividends(startDate: string, endDate: string): number {
    return 0; // Would need specific dividend transactions
  }

  private getShareCapitalChanges(startDate: string, endDate: string): number {
    return this.getTransactionsInPeriod(startDate, endDate)
      .filter(t => t.category === 'SHARE_CAPITAL')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getBusinessActivity(): string {
    // This could be derived from company info or transaction analysis
    return "various business activities as per trade license";
  }

  private getSMECategory(): string {
    // This should come from the tax classification context
    return "Small and Medium Enterprise";
  }

  private getCITRate(): number {
    // This should come from the tax classification context
    return 9; // Default rate, could be 0 for small businesses
  }
}