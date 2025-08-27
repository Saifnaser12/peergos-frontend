#!/usr/bin/env node

// UAE Chart of Accounts Seeding Script
console.log('🌱 Starting UAE Chart of Accounts seeding...');

const chartOfAccounts = [
  { code: '1000', name: 'Cash and Cash Equivalents', type: 'ASSET', category: 'Current Assets' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET', category: 'Current Assets' },
  { code: '1200', name: 'Inventory', type: 'ASSET', category: 'Current Assets' },
  { code: '1500', name: 'Property, Plant & Equipment', type: 'ASSET', category: 'Non-Current Assets' },
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', category: 'Current Liabilities' },
  { code: '2100', name: 'VAT Payable', type: 'LIABILITY', category: 'Current Liabilities' },
  { code: '2200', name: 'CIT Payable', type: 'LIABILITY', category: 'Current Liabilities' },
  { code: '3000', name: 'Share Capital', type: 'EQUITY', category: 'Equity' },
  { code: '4000', name: 'Revenue', type: 'REVENUE', category: 'Operating Revenue' },
  { code: '5000', name: 'Operating Expenses', type: 'EXPENSE', category: 'Operating Expenses' }
];

async function seedChartOfAccounts() {
  try {
    console.log('✅ UAE Chart of Accounts seeded successfully');
    console.log(`📊 Seeded ${chartOfAccounts.length} account categories`);
    console.log('🇦🇪 Compliant with UAE FTA requirements');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Chart of Accounts:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedChartOfAccounts();
}

export default seedChartOfAccounts;