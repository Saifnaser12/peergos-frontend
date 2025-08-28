import { pgTable, text, varchar, decimal, timestamp, integer, boolean, serial } from 'drizzle-orm/pg-core';

// UAE Chart of Accounts
export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: text('name').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Companies
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  trn: varchar('trn', { length: 15 }).unique(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }).default('AE'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Transactions
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id),
  accountId: integer('account_id').references(() => chartOfAccounts.id),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal('vat_amount', { precision: 15, scale: 2 }).default('0'),
  transactionDate: timestamp('transaction_date').notNull(),
  reference: varchar('reference', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;