#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const serverless_1 = require("@neondatabase/serverless");
const schema_1 = require("../src/db/schema");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
}
// UAE Chart of Accounts - FTA Compliant
const uaeChartOfAccounts = [
    // ASSETS - Current Assets (1000-1999)
    { code: '1000', name: 'Cash and Cash Equivalents', type: 'ASSET', category: 'Current Assets' },
    { code: '1010', name: 'Petty Cash', type: 'ASSET', category: 'Current Assets' },
    { code: '1020', name: 'Bank - Current Account', type: 'ASSET', category: 'Current Assets' },
    { code: '1030', name: 'Bank - Savings Account', type: 'ASSET', category: 'Current Assets' },
    { code: '1100', name: 'Accounts Receivable - Trade', type: 'ASSET', category: 'Current Assets' },
    { code: '1110', name: 'Accounts Receivable - Other', type: 'ASSET', category: 'Current Assets' },
    { code: '1120', name: 'Allowance for Doubtful Accounts', type: 'ASSET', category: 'Current Assets' },
    { code: '1200', name: 'Inventory - Raw Materials', type: 'ASSET', category: 'Current Assets' },
    { code: '1210', name: 'Inventory - Work in Progress', type: 'ASSET', category: 'Current Assets' },
    { code: '1220', name: 'Inventory - Finished Goods', type: 'ASSET', category: 'Current Assets' },
    { code: '1300', name: 'Prepaid Expenses', type: 'ASSET', category: 'Current Assets' },
    { code: '1310', name: 'Prepaid Insurance', type: 'ASSET', category: 'Current Assets' },
    { code: '1320', name: 'Prepaid Rent', type: 'ASSET', category: 'Current Assets' },
    { code: '1400', name: 'VAT Recoverable', type: 'ASSET', category: 'Current Assets' },
    { code: '1410', name: 'Excise Tax Recoverable', type: 'ASSET', category: 'Current Assets' },
    // ASSETS - Non-Current Assets (2000-2999)
    { code: '2000', name: 'Property, Plant & Equipment', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2010', name: 'Land', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2020', name: 'Buildings', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2030', name: 'Accumulated Depreciation - Buildings', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2100', name: 'Machinery & Equipment', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2110', name: 'Accumulated Depreciation - Machinery', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2200', name: 'Furniture & Fixtures', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2210', name: 'Accumulated Depreciation - Furniture', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2300', name: 'Vehicles', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2310', name: 'Accumulated Depreciation - Vehicles', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2400', name: 'Intangible Assets', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2410', name: 'Accumulated Amortization - Intangibles', type: 'ASSET', category: 'Non-Current Assets' },
    { code: '2500', name: 'Investments - Long Term', type: 'ASSET', category: 'Non-Current Assets' },
    // LIABILITIES - Current Liabilities (3000-3999)
    { code: '3000', name: 'Accounts Payable - Trade', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3010', name: 'Accounts Payable - Other', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3100', name: 'VAT Payable', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3110', name: 'Excise Tax Payable', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3120', name: 'Corporate Income Tax Payable', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3200', name: 'Accrued Expenses', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3210', name: 'Accrued Salaries & Wages', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3220', name: 'Accrued Interest', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3300', name: 'Short Term Loans', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3310', name: 'Bank Overdraft', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3400', name: 'Unearned Revenue', type: 'LIABILITY', category: 'Current Liabilities' },
    { code: '3500', name: 'End of Service Benefits - Current', type: 'LIABILITY', category: 'Current Liabilities' },
    // LIABILITIES - Non-Current Liabilities (4000-4999)
    { code: '4000', name: 'Long Term Loans', type: 'LIABILITY', category: 'Non-Current Liabilities' },
    { code: '4100', name: 'Mortgage Payable', type: 'LIABILITY', category: 'Non-Current Liabilities' },
    { code: '4200', name: 'End of Service Benefits - Non-Current', type: 'LIABILITY', category: 'Non-Current Liabilities' },
    { code: '4300', name: 'Deferred Tax Liability', type: 'LIABILITY', category: 'Non-Current Liabilities' },
    // EQUITY (5000-5999)
    { code: '5000', name: 'Share Capital', type: 'EQUITY', category: 'Equity' },
    { code: '5100', name: 'Retained Earnings', type: 'EQUITY', category: 'Equity' },
    { code: '5200', name: 'Current Year Earnings', type: 'EQUITY', category: 'Equity' },
    { code: '5300', name: 'Additional Paid-in Capital', type: 'EQUITY', category: 'Equity' },
    { code: '5400', name: 'Treasury Stock', type: 'EQUITY', category: 'Equity' },
    { code: '5500', name: 'Other Comprehensive Income', type: 'EQUITY', category: 'Equity' },
    // REVENUE (6000-6999)
    { code: '6000', name: 'Sales Revenue - Domestic', type: 'REVENUE', category: 'Operating Revenue' },
    { code: '6010', name: 'Sales Revenue - Export', type: 'REVENUE', category: 'Operating Revenue' },
    { code: '6100', name: 'Service Revenue', type: 'REVENUE', category: 'Operating Revenue' },
    { code: '6200', name: 'Interest Income', type: 'REVENUE', category: 'Non-Operating Revenue' },
    { code: '6300', name: 'Investment Income', type: 'REVENUE', category: 'Non-Operating Revenue' },
    { code: '6400', name: 'Foreign Exchange Gain', type: 'REVENUE', category: 'Non-Operating Revenue' },
    { code: '6500', name: 'Other Income', type: 'REVENUE', category: 'Non-Operating Revenue' },
    { code: '6600', name: 'Gain on Sale of Assets', type: 'REVENUE', category: 'Non-Operating Revenue' },
    // COST OF GOODS SOLD (7000-7999)
    { code: '7000', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'Cost of Sales' },
    { code: '7100', name: 'Direct Materials', type: 'EXPENSE', category: 'Cost of Sales' },
    { code: '7200', name: 'Direct Labor', type: 'EXPENSE', category: 'Cost of Sales' },
    { code: '7300', name: 'Manufacturing Overhead', type: 'EXPENSE', category: 'Cost of Sales' },
    { code: '7400', name: 'Freight In', type: 'EXPENSE', category: 'Cost of Sales' },
    // OPERATING EXPENSES (8000-8999)
    { code: '8000', name: 'Salaries & Wages', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8100', name: 'Employee Benefits', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8110', name: 'End of Service Benefits', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8200', name: 'Rent Expense', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8300', name: 'Utilities', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8400', name: 'Insurance Expense', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8500', name: 'Depreciation Expense', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8600', name: 'Amortization Expense', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8700', name: 'Professional Fees', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8710', name: 'Legal Fees', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8720', name: 'Audit Fees', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8800', name: 'Marketing & Advertising', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8900', name: 'Travel & Entertainment', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8910', name: 'Office Supplies', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8920', name: 'Telephone & Internet', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8930', name: 'Repairs & Maintenance', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8940', name: 'Training & Development', type: 'EXPENSE', category: 'Operating Expenses' },
    { code: '8950', name: 'Bank Charges', type: 'EXPENSE', category: 'Operating Expenses' },
    // NON-OPERATING EXPENSES (9000-9999)
    { code: '9000', name: 'Interest Expense', type: 'EXPENSE', category: 'Non-Operating Expenses' },
    { code: '9100', name: 'Foreign Exchange Loss', type: 'EXPENSE', category: 'Non-Operating Expenses' },
    { code: '9200', name: 'Loss on Sale of Assets', type: 'EXPENSE', category: 'Non-Operating Expenses' },
    { code: '9300', name: 'Bad Debt Expense', type: 'EXPENSE', category: 'Non-Operating Expenses' },
    { code: '9900', name: 'Corporate Income Tax Expense', type: 'EXPENSE', category: 'Tax Expenses' }
];
async function seedChartOfAccounts() {
    console.log('🌱 Starting UAE Chart of Accounts seeding...');
    try {
        const pool = new serverless_1.Pool({ connectionString: DATABASE_URL });
        const db = (0, neon_serverless_1.drizzle)(pool);
        // Clear existing accounts
        await db.delete(schema_1.chartOfAccounts);
        console.log('🗑️  Cleared existing chart of accounts');
        // Insert UAE Chart of Accounts
        await db.insert(schema_1.chartOfAccounts).values(uaeChartOfAccounts);
        const insertedCount = uaeChartOfAccounts.length;
        console.log(`✅ Inserted ${insertedCount} accounts`);
        console.log('🇦🇪 UAE FTA-compliant Chart of Accounts seeded successfully');
        // Close the connection
        await pool.end();
        return insertedCount;
    }
    catch (error) {
        console.error('❌ Error seeding Chart of Accounts:', error);
        throw error;
    }
}
// Run seeding if called directly
if (require.main === module) {
    seedChartOfAccounts()
        .then((count) => {
        console.log(`🎯 Seeding completed: ${count} accounts inserted`);
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
}
exports.default = seedChartOfAccounts;
