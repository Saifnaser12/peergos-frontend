export interface POSTransaction {
  id: string;
  date: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER';
  customerReference?: string;
  terminalId?: string;
  receiptNumber: string;
  syncedAt: string;
}

export interface POSConfig {
  enabled: boolean;
  vendor: POSVendor;
  lastSyncDate?: string;
  autoSyncInterval: number; // minutes
  apiEndpoint?: string;
  credentials?: {
    apiKey?: string;
    storeId?: string;
    locationId?: string;
  };
}

export interface POSVendor {
  id: string;
  name: string;
  description: string;
  supportedRegions: string[];
  features: string[];
  integrationStatus: 'AVAILABLE' | 'BETA' | 'COMING_SOON';
  logo?: string;
}

// UAE-focused POS vendors
export const POS_VENDORS: POSVendor[] = [
  {
    id: 'omnivore',
    name: 'Omnivore POS',
    description: 'UAE restaurant management system with FTA compliance',
    supportedRegions: ['UAE', 'GCC'],
    features: ['Real-time sync', 'VAT compliance', 'Multi-location', 'Analytics'],
    integrationStatus: 'AVAILABLE',
  },
  {
    id: 'loyverse',
    name: 'Loyverse',
    description: 'Free POS system popular in UAE SMEs',
    supportedRegions: ['UAE', 'Global'],
    features: ['Cloud-based', 'Inventory management', 'Customer loyalty', 'Reports'],
    integrationStatus: 'BETA',
  },
  {
    id: 'square',
    name: 'Square POS',
    description: 'International POS with UAE payment processing',
    supportedRegions: ['UAE', 'Global'],
    features: ['Payment processing', 'E-commerce integration', 'Advanced analytics'],
    integrationStatus: 'COMING_SOON',
  },
  {
    id: 'toast',
    name: 'Toast POS',
    description: 'Restaurant technology platform expanding to UAE',
    supportedRegions: ['UAE', 'US', 'Global'],
    features: ['Restaurant focus', 'Order management', 'Staff management', 'Reporting'],
    integrationStatus: 'COMING_SOON',
  },
  {
    id: 'lightspeed',
    name: 'Lightspeed',
    description: 'Retail and restaurant POS with UAE presence',
    supportedRegions: ['UAE', 'Global'],
    features: ['Multi-channel', 'Inventory sync', 'Customer insights', 'E-commerce'],
    integrationStatus: 'BETA',
  },
];

// Mock POS transaction data
export const generateMockPOSTransactions = (count: number = 10): POSTransaction[] => {
  const items = [
    'Shawarma Plate', 'Arabic Coffee', 'Hummus & Pita', 'Grilled Chicken',
    'Mixed Grill', 'Fattoush Salad', 'Baklava', 'Fresh Juice',
    'Kabsa Rice', 'Manakish', 'Kunafa', 'Tea Set'
  ];
  
  const paymentMethods: POSTransaction['paymentMethod'][] = ['CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER'];
  
  const transactions: POSTransaction[] = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = Math.floor(Math.random() * 50) + 10;
    const netAmount = quantity * unitPrice;
    const vatAmount = netAmount * 0.05; // 5% UAE VAT
    const totalAmount = netAmount + vatAmount;
    
    transactions.push({
      id: `pos_${Date.now()}_${i}`,
      date: date.toISOString(),
      itemName: items[Math.floor(Math.random() * items.length)],
      quantity,
      unitPrice,
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      customerReference: Math.random() > 0.7 ? `CUST${Math.floor(Math.random() * 1000)}` : undefined,
      terminalId: `TERM_${Math.floor(Math.random() * 5) + 1}`,
      receiptNumber: `RCP${Date.now().toString().slice(-6)}${i}`,
      syncedAt: new Date().toISOString(),
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockPOSSync = async (vendor: string): Promise<{ success: boolean; transactions: POSTransaction[]; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Simulate occasional errors
  if (Math.random() < 0.1) {
    return {
      success: false,
      transactions: [],
      error: 'Connection timeout. Please check your POS system connectivity.'
    };
  }
  
  const transactions = generateMockPOSTransactions(Math.floor(Math.random() * 15) + 5);
  
  return {
    success: true,
    transactions,
  };
};

export const formatPaymentMethod = (method: POSTransaction['paymentMethod']): string => {
  switch (method) {
    case 'CASH':
      return 'Cash';
    case 'CARD':
      return 'Card';
    case 'DIGITAL_WALLET':
      return 'Digital Wallet';
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    default:
      return method;
  }
};

export const getPaymentMethodColor = (method: POSTransaction['paymentMethod']): string => {
  switch (method) {
    case 'CASH':
      return 'bg-green-100 text-green-800';
    case 'CARD':
      return 'bg-blue-100 text-blue-800';
    case 'DIGITAL_WALLET':
      return 'bg-purple-100 text-purple-800';
    case 'BANK_TRANSFER':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};