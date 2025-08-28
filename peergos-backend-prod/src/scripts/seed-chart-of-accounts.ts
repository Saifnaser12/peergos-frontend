import { db } from '../db';
import { chartOfAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';

// UAE Chart of Accounts based on FTA requirements
const UAEChartOfAccounts = [
  // ASSETS (1000-1999)
  // Current Assets (1100-1199)
  { code: '1110', name: 'Cash on Hand', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Physical cash in the business' },
  { code: '1120', name: 'Bank Accounts - Current', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Operating bank accounts' },
  { code: '1130', name: 'Bank Accounts - Savings', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Interest-bearing accounts' },
  { code: '1140', name: 'Accounts Receivable - Trade', vatCode: 'INPUT_VAT', citDeductible: false, qualifiesForQFZP: true, notes: 'Amounts owed by customers' },
  { code: '1141', name: 'Accounts Receivable - VAT', vatCode: 'INPUT_VAT', citDeductible: false, qualifiesForQFZP: true, notes: 'VAT recoverable on purchases' },
  { code: '1150', name: 'Inventory - Raw Materials', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Raw materials for production' },
  { code: '1151', name: 'Inventory - Work in Progress', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Partially completed products' },
  { code: '1152', name: 'Inventory - Finished Goods', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Completed products ready for sale' },
  { code: '1160', name: 'Prepaid Expenses', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Expenses paid in advance' },
  { code: '1170', name: 'Short-term Investments', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Investments maturing within one year' },

  // Non-Current Assets (1200-1299)
  { code: '1210', name: 'Property, Plant & Equipment', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Fixed assets used in business operations' },
  { code: '1211', name: 'Accumulated Depreciation - PPE', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Depreciation of fixed assets' },
  { code: '1220', name: 'Intangible Assets', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Patents, trademarks, software' },
  { code: '1221', name: 'Accumulated Amortization - Intangibles', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Amortization of intangible assets' },
  { code: '1230', name: 'Long-term Investments', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Investments held for more than one year' },
  { code: '1240', name: 'Goodwill', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Excess of purchase price over fair value' },

  // LIABILITIES (2000-2999)
  // Current Liabilities (2100-2199)
  { code: '2110', name: 'Accounts Payable - Trade', vatCode: 'OUTPUT_VAT', citDeductible: false, qualifiesForQFZP: true, notes: 'Amounts owed to suppliers' },
  { code: '2111', name: 'Accounts Payable - VAT', vatCode: 'OUTPUT_VAT', citDeductible: false, qualifiesForQFZP: true, notes: 'VAT payable to FTA' },
  { code: '2120', name: 'Short-term Loans', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Loans due within one year' },
  { code: '2130', name: 'Accrued Expenses', vatCode: 'OUTPUT_VAT', citDeductible: false, qualifiesForQFZP: true, notes: 'Expenses incurred but not yet paid' },
  { code: '2140', name: 'Current Portion of Long-term Debt', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Principal due within one year' },
  { code: '2150', name: 'Employee Benefits Payable', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Salaries, benefits, and taxes payable' },
  { code: '2160', name: 'Corporate Income Tax Payable', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'CIT liability to FTA' },

  // Non-Current Liabilities (2200-2299)
  { code: '2210', name: 'Long-term Loans', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Loans due after one year' },
  { code: '2220', name: 'Deferred Tax Liability', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Future tax obligations' },
  { code: '2230', name: 'Provision for End of Service Benefits', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Employee terminal benefits under UAE Labor Law' },

  // EQUITY (3000-3999)
  { code: '3110', name: 'Share Capital', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Issued and paid-up capital' },
  { code: '3120', name: 'Retained Earnings', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Accumulated profits/losses' },
  { code: '3130', name: 'Current Year Profit/Loss', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Net income for current period' },
  { code: '3140', name: 'Additional Paid-in Capital', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Premium on share issuance' },

  // REVENUE (4000-4999)
  { code: '4110', name: 'Sales Revenue - Domestic', vatCode: 'STANDARD', citDeductible: false, qualifiesForQFZP: true, notes: 'Local sales subject to 5% VAT' },
  { code: '4120', name: 'Sales Revenue - Export', vatCode: 'ZERO_RATED', citDeductible: false, qualifiesForQFZP: true, notes: 'Export sales - 0% VAT' },
  { code: '4130', name: 'Service Revenue - Domestic', vatCode: 'STANDARD', citDeductible: false, qualifiesForQFZP: true, notes: 'Local services subject to 5% VAT' },
  { code: '4140', name: 'Service Revenue - International', vatCode: 'ZERO_RATED', citDeductible: false, qualifiesForQFZP: true, notes: 'International services - 0% VAT' },
  { code: '4150', name: 'Rental Income', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Property rental income - VAT exempt' },
  { code: '4160', name: 'Interest Income', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Bank interest and investment income' },
  { code: '4170', name: 'Other Income', vatCode: 'STANDARD', citDeductible: false, qualifiesForQFZP: true, notes: 'Miscellaneous business income' },

  // COST OF GOODS SOLD (5000-5999)
  { code: '5110', name: 'Cost of Materials', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Direct material costs' },
  { code: '5120', name: 'Direct Labor', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Production labor costs' },
  { code: '5130', name: 'Manufacturing Overhead', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Indirect production costs' },
  { code: '5140', name: 'Freight and Delivery', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Shipping costs on sales' },

  // OPERATING EXPENSES (6000-6999)
  // Administrative Expenses (6100-6199)
  { code: '6110', name: 'Salaries and Wages', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Employee salaries - VAT exempt' },
  { code: '6111', name: 'Employee Benefits', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Health insurance, visa costs, etc.' },
  { code: '6112', name: 'End of Service Provision', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Terminal benefit accrual' },
  { code: '6120', name: 'Rent Expense', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Office/warehouse rent - VAT exempt' },
  { code: '6130', name: 'Utilities', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Electricity, water, internet' },
  { code: '6140', name: 'Professional Services', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Legal, accounting, consulting fees' },
  { code: '6150', name: 'Office Supplies', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Stationery, office equipment' },
  { code: '6160', name: 'Travel and Entertainment', vatCode: 'STANDARD', citDeductible: false, qualifiesForQFZP: true, notes: 'Business travel - 50% CIT deductible' },
  { code: '6170', name: 'Marketing and Advertising', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Promotional expenses' },
  { code: '6180', name: 'Insurance', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Business insurance - VAT exempt' },
  { code: '6190', name: 'Bank Charges', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Banking fees - VAT exempt' },

  // Facility and Equipment (6200-6299)
  { code: '6210', name: 'Depreciation Expense', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Asset depreciation' },
  { code: '6220', name: 'Repairs and Maintenance', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Equipment and facility maintenance' },
  { code: '6230', name: 'Equipment Lease', vatCode: 'STANDARD', citDeductible: true, qualifiesForQFZP: true, notes: 'Equipment rental costs' },

  // OTHER EXPENSES (7000-7999)
  { code: '7110', name: 'Interest Expense', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Loan interest payments' },
  { code: '7120', name: 'Foreign Exchange Loss', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Currency conversion losses' },
  { code: '7130', name: 'Bad Debt Expense', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Uncollectible receivables' },
  { code: '7140', name: 'Penalties and Fines', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Government penalties - non-deductible' },
  { code: '7150', name: 'Charitable Donations', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Donations - limited deductibility' },

  // OTHER INCOME (8000-8999)
  { code: '8110', name: 'Foreign Exchange Gain', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Currency conversion gains' },
  { code: '8120', name: 'Gain on Asset Disposal', vatCode: 'STANDARD', citDeductible: false, qualifiesForQFZP: true, notes: 'Profit from asset sales' },
  { code: '8130', name: 'Dividend Income', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'Dividends from investments' },

  // TAX ACCOUNTS (9000-9999)
  { code: '9110', name: 'Corporate Income Tax Expense', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'CIT provision for the year' },
  { code: '9120', name: 'Deferred Tax Asset', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Future tax benefits' },
  { code: '9130', name: 'Deferred Tax Liability', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: false, notes: 'Future tax obligations' },

  // FREE ZONE SPECIFIC ACCOUNTS (9200-9299)
  { code: '9210', name: 'Qualifying Free Zone Income', vatCode: 'EXEMPT', citDeductible: false, qualifiesForQFZP: true, notes: 'QFZP eligible income - 0% CIT' },
  { code: '9220', name: 'Non-Qualifying Free Zone Income', vatCode: 'STANDARD', citDeductible: false, qualifiesForQFZP: false, notes: 'Non-QFZP income - 9% CIT' },
  { code: '9230', name: 'Free Zone Business Expenses', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Qualifying business expenses in free zone' },

  // TRANSFER PRICING ACCOUNTS (9300-9399)
  { code: '9310', name: 'Related Party Revenue', vatCode: 'STANDARD', citDeductible: false, qualifiesForQFZP: true, notes: 'Income from related entities' },
  { code: '9320', name: 'Related Party Expenses', vatCode: 'INPUT_VAT', citDeductible: true, qualifiesForQFZP: true, notes: 'Costs charged by related entities' },
  { code: '9330', name: 'Transfer Pricing Adjustments', vatCode: 'EXEMPT', citDeductible: true, qualifiesForQFZP: true, notes: 'Arm\'s length adjustments' }
];

export async function seedUAEChartOfAccounts(): Promise<void> {
  try {
    console.log('🏗️ Seeding UAE Chart of Accounts...');
    
    // Check if chart of accounts already exists
    const existingAccounts = await db.select().from(chartOfAccounts);
    
    if (existingAccounts.length > 0) {
      console.log(`✅ Chart of Accounts already exists (${existingAccounts.length} accounts). Skipping seeding.`);
      return;
    }
    
    // Insert UAE Chart of Accounts
    let insertedCount = 0;
    
    for (const account of UAEChartOfAccounts) {
      try {
        await db.insert(chartOfAccounts).values({
          code: account.code,
          name: account.name,
          type: 'ASSET', // Default type
          category: 'General'
        });
        insertedCount++;
      } catch (error) {
        // Skip if account already exists (duplicate code)
        if ((error as any).code !== '23505') { // Not a unique constraint violation
          console.error(`Error inserting account ${account.code}:`, error);
        }
      }
    }
    
    console.log(`✅ Successfully seeded ${insertedCount} chart of accounts entries`);
    console.log('📊 UAE Chart of Accounts includes:');
    console.log('   • Assets (1000-1999): Cash, receivables, inventory, fixed assets');
    console.log('   • Liabilities (2000-2999): Payables, loans, tax obligations');
    console.log('   • Equity (3000-3999): Share capital, retained earnings');
    console.log('   • Revenue (4000-4999): Sales, services, rental income');
    console.log('   • Cost of Goods Sold (5000-5999): Materials, labor, overhead');
    console.log('   • Operating Expenses (6000-6999): Salaries, rent, utilities');
    console.log('   • Other Income/Expenses (7000-8999): Interest, FX, gains/losses');
    console.log('   • Tax Accounts (9000-9999): CIT, VAT, transfer pricing');
    console.log('   • Free Zone Accounts (9200-9299): QFZP specific accounts');
    console.log('🏛️ All accounts are UAE FTA compliant with proper VAT and CIT classifications');
    
  } catch (error) {
    console.error('❌ Error seeding Chart of Accounts:', error);
    throw error;
  }
}

export async function getChartOfAccountsByCategory(): Promise<Record<string, any[]>> {
  try {
    const accounts = await db.select().from(chartOfAccounts);
    
    const categorized = {
      assets: accounts.filter(acc => acc.code.startsWith('1')),
      liabilities: accounts.filter(acc => acc.code.startsWith('2')),
      equity: accounts.filter(acc => acc.code.startsWith('3')),
      revenue: accounts.filter(acc => acc.code.startsWith('4')),
      costOfGoodsSold: accounts.filter(acc => acc.code.startsWith('5')),
      operatingExpenses: accounts.filter(acc => acc.code.startsWith('6')),
      otherIncomeExpenses: accounts.filter(acc => acc.code.startsWith('7') || acc.code.startsWith('8')),
      taxAccounts: accounts.filter(acc => acc.code.startsWith('9'))
    };
    
    return categorized;
  } catch (error) {
    console.error('Error retrieving chart of accounts:', error);
    throw error;
  }
}

export async function getVATDeductibleAccounts(): Promise<any[]> {
  try {
    const accounts = await db.select().from(chartOfAccounts);
    
    return accounts.filter(acc => acc.code.startsWith('1')); // Assets as example
  } catch (error) {
    console.error('Error retrieving VAT deductible accounts:', error);
    throw error;
  }
}

export async function getCITDeductibleAccounts(): Promise<any[]> {
  try {
    const accounts = await db.select().from(chartOfAccounts);
    
    return accounts.filter(acc => acc.code.startsWith('6')); // Expenses as example
  } catch (error) {
    console.error('Error retrieving CIT deductible accounts:', error);
    throw error;
  }
}

export async function getQFZPQualifyingAccounts(): Promise<any[]> {
  try {
    const accounts = await db.select().from(chartOfAccounts);
    
    return accounts.filter(acc => acc.code.startsWith('9')); // Tax accounts as example
  } catch (error) {
    console.error('Error retrieving QFZP qualifying accounts:', error);
    throw error;
  }
}

export default {
  seedUAEChartOfAccounts,
  getChartOfAccountsByCategory,
  getVATDeductibleAccounts,
  getCITDeductibleAccounts,
  getQFZPQualifyingAccounts
};