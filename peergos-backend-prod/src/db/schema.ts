import { pgTable, text, serial, integer, boolean, decimal, timestamp, json, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("SME_CLIENT"), // ADMIN, ACCOUNTANT, ASSISTANT, SME_CLIENT
  isActive: boolean("is_active").default(true),
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company/Tenant Information
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trn: text("trn"), // Tax Registration Number
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  industry: text("industry"),
  emirate: text("emirate"), // UAE Emirate
  freeZone: boolean("free_zone").default(false),
  vatRegistered: boolean("vat_registered").default(false),
  citRegistrationRequired: boolean("cit_registration_required").default(true),
  qfzpStatus: boolean("qfzp_status").default(false), // Qualifying Free Zone Person
  expectedAnnualRevenue: decimal("expected_annual_revenue", { precision: 15, scale: 2 }).default("0"),
  hasInternationalSales: boolean("has_international_sales").default(false),
  internationalSalesPercentage: integer("international_sales_percentage").default(0),
  accountingMethod: text("accounting_method").default("cash"), // cash or accrual
  financialYearEnd: text("financial_year_end").default("12-31"), // MM-DD format
  setupCompleted: boolean("setup_completed").default(false),
  setupCompletedAt: timestamp("setup_completed_at"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#1976d2"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Accounting Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: text("type").notNull(), // REVENUE, EXPENSE
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }).default("0"),
  transactionDate: timestamp("transaction_date").notNull(),
  attachments: text("attachments").array(),
  status: text("status").default("PROCESSED"), // DRAFT, PROCESSED, CANCELLED
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tax Filings
export const taxFilings = pgTable("tax_filings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: text("type").notNull(), // VAT, CIT
  period: text("period").notNull(), // Q1_2024, FY_2024, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").default("DRAFT"), // DRAFT, SUBMITTED, APPROVED, REJECTED
  calculations: json("calculations"), // Detailed tax calculations
  totalTax: decimal("total_tax", { precision: 15, scale: 2 }).default("0"),
  submittedAt: timestamp("submitted_at"),
  submittedBy: integer("submitted_by"),
  ftaReference: text("fta_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientAddress: text("client_address"),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  items: json("items").notNull(), // Array of invoice items
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  status: text("status").default("DRAFT"), // DRAFT, SENT, PAID, OVERDUE
  xmlGenerated: boolean("xml_generated").default(false),
  qrCode: text("qr_code"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications/Reminders
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id"),
  type: text("type").notNull(), // DEADLINE_REMINDER, TAX_FILING_DUE, INVOICE_OVERDUE
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("MEDIUM"), // HIGH, MEDIUM, LOW
  isRead: boolean("is_read").default(false),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit Notes
export const creditNotes = pgTable("credit_notes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  creditNoteNumber: text("credit_note_number").notNull(),
  originalInvoiceId: integer("original_invoice_id"),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientAddress: text("client_address"),
  issueDate: timestamp("issue_date").notNull(),
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  status: text("status").default("DRAFT"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Debit Notes
export const debitNotes = pgTable("debit_notes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  debitNoteNumber: text("debit_note_number").notNull(),
  originalInvoiceId: integer("original_invoice_id"),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientAddress: text("client_address"),
  issueDate: timestamp("issue_date").notNull(),
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  status: text("status").default("DRAFT"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// KPI Data
export const kpiData = pgTable("kpi_data", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  period: text("period").notNull(), // YYYY-MM format
  revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0"),
  expenses: decimal("expenses", { precision: 15, scale: 2 }).default("0"),
  vatLiability: decimal("vat_liability", { precision: 15, scale: 2 }).default("0"),
  citLiability: decimal("cit_liability", { precision: 15, scale: 2 }).default("0"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chart of Accounts
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  category: text("category").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transfer Pricing Documentation  
export const transferPricingDocumentation = pgTable("transfer_pricing_documentation", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: text("type").notNull(), // MASTER_FILE, LOCAL_FILE, ECONOMIC_ANALYSIS
  status: text("status").default("DRAFT"), // DRAFT, SUBMITTED, APPROVED
  data: jsonb("data").notNull(),
  period: text("period").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertTaxFilingSchema = createInsertSchema(taxFilings).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCreditNoteSchema = createInsertSchema(creditNotes).omit({
  id: true,
  createdAt: true,
});

export const insertDebitNoteSchema = createInsertSchema(debitNotes).omit({
  id: true,
  createdAt: true,
});

export const insertTransferPricingDocumentationSchema = createInsertSchema(transferPricingDocumentation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TaxFiling = typeof taxFilings.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type CreditNote = typeof creditNotes.$inferSelect;
export type DebitNote = typeof debitNotes.$inferSelect;
export type KpiData = typeof kpiData.$inferSelect;
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type TransferPricingDocumentation = typeof transferPricingDocumentation.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertTaxFiling = z.infer<typeof insertTaxFilingSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertCreditNote = z.infer<typeof insertCreditNoteSchema>;
export type InsertDebitNote = z.infer<typeof insertDebitNoteSchema>;
export type InsertTransferPricingDocumentation = z.infer<typeof insertTransferPricingDocumentationSchema>;