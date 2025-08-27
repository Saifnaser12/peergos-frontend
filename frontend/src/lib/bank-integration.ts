export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  debitAmount?: number;
  creditAmount: number;
  balance: number;
  reference: string;
  category?: string;
  linkedExpenseId?: string;
  matchStatus: 'MATCHED' | 'UNMATCHED' | 'PARTIAL' | 'REVIEW_NEEDED';
  confidence?: number;
  importedAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  currency: string;
  accountType: 'CURRENT' | 'SAVINGS' | 'BUSINESS';
  balance: number;
  lastSyncDate?: string;
  isConnected: boolean;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  supplier?: string;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}

// UAE banks commonly used by SMEs
export const UAE_BANKS = [
  {
    id: 'enbd',
    name: 'Emirates NBD',
    logo: '🏦',
    openBankingStatus: 'AVAILABLE',
    features: ['Real-time sync', 'Multi-account', 'Transaction categorization']
  },
  {
    id: 'adcb',
    name: 'Abu Dhabi Commercial Bank',
    logo: '🏦',
    openBankingStatus: 'BETA',
    features: ['Secure API', 'Transaction history', 'Balance monitoring']
  },
  {
    id: 'fab',
    name: 'First Abu Dhabi Bank',
    logo: '🏦',
    openBankingStatus: 'AVAILABLE',
    features: ['Real-time notifications', 'Multi-currency', 'Analytics']
  },
  {
    id: 'mashreq',
    name: 'Mashreq Bank',
    logo: '🏦',
    openBankingStatus: 'COMING_SOON',
    features: ['Business accounts', 'Transaction tagging', 'Export tools']
  },
  {
    id: 'rakbank',
    name: 'RAK Bank',
    logo: '🏦',
    openBankingStatus: 'BETA',
    features: ['SME focused', 'Quick sync', 'Expense tracking']
  },
];

// Generate mock bank transactions
export const generateMockBankTransactions = (count: number = 20): BankTransaction[] => {
  const descriptions = [
    'TAQA BILL PAYMENT',
    'DEWA ELECTRICITY PAYMENT',
    'ETISALAT TELECOM',
    'SALARY TRANSFER EMIRATES NBD',
    'OFFICE RENT PAYMENT',
    'ADNOC FUEL PURCHASE',
    'CARREFOUR SUPPLIES',
    'RESTAURANT REVENUE',
    'CONSULTING FEE RECEIVED',
    'BANK CHARGES',
    'VAT PAYMENT TO FTA',
    'EQUIPMENT PURCHASE',
    'MARKETING SERVICES',
    'INSURANCE PREMIUM',
    'SOFTWARE SUBSCRIPTION'
  ];

  const transactions: BankTransaction[] = [];
  let runningBalance = 50000; // Starting balance

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const isCredit = Math.random() > 0.6; // 40% chance of credit (income)
    const amount = Math.floor(Math.random() * 5000) + 100;
    
    if (isCredit) {
      runningBalance += amount;
    } else {
      runningBalance -= amount;
    }

    // Determine match status
    let matchStatus: BankTransaction['matchStatus'] = 'UNMATCHED';
    let confidence: number | undefined;
    
    if (Math.random() > 0.4) { // 60% chance of some matching
      if (Math.random() > 0.7) {
        matchStatus = 'MATCHED';
        confidence = 0.95;
      } else if (Math.random() > 0.5) {
        matchStatus = 'PARTIAL';
        confidence = 0.75;
      } else {
        matchStatus = 'REVIEW_NEEDED';
        confidence = 0.45;
      }
    }

    transactions.push({
      id: `bank_${Date.now()}_${i}`,
      date: date.toISOString(),
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      debitAmount: isCredit ? undefined : amount,
      creditAmount: isCredit ? amount : 0,
      balance: Math.round(runningBalance * 100) / 100,
      reference: `TXN${Date.now().toString().slice(-8)}${i}`,
      category: isCredit ? 'REVENUE' : 'EXPENSE',
      matchStatus,
      confidence,
      importedAt: new Date().toISOString(),
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate mock expense records for matching
export const generateMockExpenseRecords = (count: number = 15): ExpenseRecord[] => {
  const suppliers = [
    'TAQA', 'DEWA', 'Etisalat', 'ADNOC', 'Carrefour',
    'Office Rental LLC', 'Marketing Agency', 'Insurance Co',
    'Software Provider', 'Equipment Supplier'
  ];

  const categories = [
    'Utilities', 'Telecommunications', 'Fuel', 'Office Supplies',
    'Rent', 'Marketing', 'Insurance', 'Software', 'Equipment'
  ];

  const records: ExpenseRecord[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    records.push({
      id: `exp_${Date.now()}_${i}`,
      date: date.toISOString(),
      description: `${supplier} - ${category}`,
      amount: Math.floor(Math.random() * 5000) + 100,
      category,
      supplier,
      status: Math.random() > 0.7 ? 'PAID' : Math.random() > 0.5 ? 'APPROVED' : 'PENDING',
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockBankSync = async (bankId: string): Promise<{ success: boolean; transactions: BankTransaction[]; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  
  // Simulate occasional errors
  if (Math.random() < 0.15) {
    return {
      success: false,
      transactions: [],
      error: 'Bank connection failed. Please verify your Open Banking consent is active.'
    };
  }
  
  const transactions = generateMockBankTransactions(Math.floor(Math.random() * 25) + 10);
  
  return {
    success: true,
    transactions,
  };
};

export const getMatchStatusColor = (status: BankTransaction['matchStatus']): string => {
  switch (status) {
    case 'MATCHED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PARTIAL':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'REVIEW_NEEDED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'UNMATCHED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getMatchStatusIcon = (status: BankTransaction['matchStatus']): string => {
  switch (status) {
    case 'MATCHED':
      return '✅';
    case 'PARTIAL':
      return '🔶';
    case 'REVIEW_NEEDED':
      return '⚠️';
    case 'UNMATCHED':
      return '❌';
    default:
      return '❓';
  }
};

export const findPotentialMatches = (bankTransaction: BankTransaction, expenseRecords: ExpenseRecord[]): ExpenseRecord[] => {
  const bankDate = new Date(bankTransaction.date);
  const amount = bankTransaction.debitAmount || 0;
  
  return expenseRecords
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      const daysDiff = Math.abs((bankDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
      const amountDiff = Math.abs(amount - expense.amount) / expense.amount;
      
      // Match within 7 days and 10% amount difference
      return daysDiff <= 7 && amountDiff <= 0.1;
    })
    .sort((a, b) => {
      const aDateDiff = Math.abs(new Date(a.date).getTime() - bankDate.getTime());
      const bDateDiff = Math.abs(new Date(b.date).getTime() - bankDate.getTime());
      return aDateDiff - bDateDiff;
    })
    .slice(0, 3); // Return top 3 matches
};