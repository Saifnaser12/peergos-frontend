import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// UAE Chart of Accounts with tax metadata
const chartOfAccounts = [
  {
    code: '6001',
    name: 'Office Supplies',
    vatCode: 'STANDARD' as const,
    citDeductible: true,
    notes: '',
    qualifiesForQFZP: true,
  },
  {
    code: '6002',
    name: 'Utilities',
    vatCode: 'STANDARD' as const,
    citDeductible: true,
    notes: '',
    qualifiesForQFZP: true,
  },
  {
    code: '6003',
    name: 'Bank Fees',
    vatCode: 'EXEMPT' as const,
    citDeductible: true,
    notes: 'VAT-exempt financial charges',
    qualifiesForQFZP: true,
  },
  {
    code: '6004',
    name: 'Residential Rent',
    vatCode: 'EXEMPT' as const,
    citDeductible: true,
    notes: 'Article 46 VAT exemption',
    qualifiesForQFZP: true,
  },
  {
    code: '6005',
    name: 'Entertainment & Hospitality',
    vatCode: 'STANDARD' as const,
    citDeductible: false,
    notes: 'NOT CIT-deductible (Art. 33 (2)(f))',
    qualifiesForQFZP: false,
  },
  {
    code: '6006',
    name: 'Motor Vehicle (private availability)',
    vatCode: 'BLOCKED' as const,
    citDeductible: true,
    notes: 'Input VAT blocked per Cabinet Decision (52) Art. 53(1)',
    qualifiesForQFZP: true,
  },
  {
    code: '6007',
    name: 'Statutory Fines & Penalties',
    vatCode: 'N/A' as const,
    citDeductible: false,
    notes: 'Non-deductible for CIT (Art. 33 (2)(a))',
    qualifiesForQFZP: false,
  },
  {
    code: '6008',
    name: 'Charitable Donation (non-approved)',
    vatCode: 'N/A' as const,
    citDeductible: false,
    notes: 'Non-deductible for CIT (Art. 37)',
    qualifiesForQFZP: false,
  },
  {
    code: '6009',
    name: 'Qualifying Expense (QFZP)',
    vatCode: 'STANDARD' as const,
    citDeductible: true,
    notes: 'Qualifying expense for QFZP businesses',
    qualifiesForQFZP: true,
  },
  {
    code: '6010',
    name: 'Non-qualifying Expense (QFZP)',
    vatCode: 'STANDARD' as const,
    citDeductible: true,
    notes: 'Non-qualifying expense - may affect QFZP status',
    qualifiesForQFZP: false,
  },
];

async function seedChartOfAccounts() {
  try {
    console.log('Seeding UAE Chart of Accounts...');
    
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        vat_code VARCHAR(20) NOT NULL,
        cit_deductible BOOLEAN NOT NULL DEFAULT true,
        notes TEXT DEFAULT '',
        qualifies_for_qfzp BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if data already exists
    const existing = await pool.query('SELECT COUNT(*) as count FROM chart_of_accounts');
    const count = Number(existing.rows[0].count);
    
    if (count > 0) {
      console.log(`Chart of Accounts already seeded (${count} records). Skipping...`);
      return;
    }

    // Insert chart of accounts data
    for (const account of chartOfAccounts) {
      await pool.query(`
        INSERT INTO chart_of_accounts (code, name, vat_code, cit_deductible, notes, qualifies_for_qfzp)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          vat_code = EXCLUDED.vat_code,
          cit_deductible = EXCLUDED.cit_deductible,
          notes = EXCLUDED.notes,
          qualifies_for_qfzp = EXCLUDED.qualifies_for_qfzp,
          updated_at = CURRENT_TIMESTAMP
      `, [
        account.code,
        account.name,
        account.vatCode,
        account.citDeductible,
        account.notes,
        account.qualifiesForQFZP
      ]);
    }

    console.log(`✅ Successfully seeded ${chartOfAccounts.length} chart of accounts records`);
  } catch (error) {
    console.error('❌ Error seeding Chart of Accounts:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedChartOfAccounts();
}

export { seedChartOfAccounts };