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
  reportingYear: varchar("reporting_year", { length: 4 }).notNull(),
  reportingPeriod: varchar("reporting_period", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // DRAFT, SUBMITTED, REVIEWED, APPROVED
  data: jsonb("data").notNull(), // Store the full transfer pricing data
  submittedAt: timestamp("submitted_at"),
  submittedBy: integer("submitted_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integrations table for external systems
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // ACCOUNTING_SOFTWARE, ERP, BANKING, E_COMMERCE, CUSTOM
  apiUrl: text("api_url"),
  apiKey: text("api_key"),
  webhookUrl: text("webhook_url"),
  settings: jsonb("settings"),
  status: text("status").default("INACTIVE"), // ACTIVE, INACTIVE, ERROR
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sync Jobs table for data synchronization
export const syncJobs = pgTable("sync_jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  integrationId: integer("integration_id"),
  type: text("type").notNull(), // FULL_SYNC, INCREMENTAL_SYNC, CUSTOM
  status: text("status").default("PENDING"), // PENDING, RUNNING, COMPLETED, FAILED
  dataType: text("data_type"), // transactions, invoices, customers, etc.
  recordsProcessed: integer("records_processed").default(0),
  recordsTotal: integer("records_total").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export Jobs table for data export operations
export const exportJobs = pgTable("export_jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  format: text("format").notNull(), // CSV, XLSX, JSON, XML, PDF
  dataType: text("data_type").notNull(), // TRANSACTIONS, INVOICES, ACCOUNTS, etc.
  filters: jsonb("filters"),
  status: text("status").default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED
  downloadUrl: text("download_url"),
  expiresAt: timestamp("expires_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Import Jobs table for data import operations
export const importJobs = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  dataType: text("data_type").notNull(), // transactions, invoices, customers
  status: text("status").default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED
  recordsTotal: integer("records_total").default(0),
  recordsProcessed: integer("records_processed").default(0),
  recordsFailed: integer("records_failed").default(0),
  validationErrors: jsonb("validation_errors"),
  processedData: jsonb("processed_data"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhooks table for webhook management
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: text("events").array(), // Array of event types
  isActive: boolean("is_active").default(true),
  secret: text("secret"),
  headers: jsonb("headers"),
  retryPolicy: jsonb("retry_policy"),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhook Deliveries table for tracking webhook deliveries
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").notNull(),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  retryCount: integer("retry_count").default(0),
  status: text("status").default("PENDING"), // PENDING, DELIVERED, FAILED
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sync Conflicts table for data synchronization conflicts
export const syncConflicts = pgTable("sync_conflicts", {
  id: serial("id").primaryKey(),
  syncJobId: integer("sync_job_id").notNull(),
  entityType: text("entity_type").notNull(), // transaction, invoice, customer
  entityId: text("entity_id").notNull(),
  conflictType: text("conflict_type").notNull(), // DUPLICATE, UPDATE_CONFLICT, VALIDATION_ERROR
  localData: jsonb("local_data"),
  remoteData: jsonb("remote_data"),
  resolution: text("resolution"), // USE_LOCAL, USE_REMOTE, MERGE, SKIP
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calculation Audit Trail table from calculation-schemas.ts
export const calculationAuditTrail = pgTable('calculation_audit_trail', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  userId: integer('user_id').notNull(),
  calculationType: varchar('calculation_type', { length: 50 }).notNull(), // 'VAT', 'CIT', 'TRANSFER_PRICING'
  referenceId: integer('reference_id'), // Reference to transaction, filing, etc.
  calculationVersion: varchar('calculation_version', { length: 20 }).notNull(),
  inputData: jsonb('input_data').notNull(), // Original input parameters
  calculationSteps: jsonb('calculation_steps').notNull(), // Step-by-step breakdown
  finalResult: jsonb('final_result').notNull(), // Final calculation result
  methodUsed: varchar('method_used', { length: 100 }).notNull(), // Calculation method/formula
  regulatoryReference: varchar('regulatory_reference', { length: 200 }), // FTA regulation reference
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  isAmendment: boolean('is_amendment').default(false),
  originalCalculationId: integer('original_calculation_id'), // For amendments
  notes: text('notes'),
  validatedBy: integer('validated_by'), // User who validated
  validatedAt: timestamp('validated_at'),
  status: varchar('status', { length: 20 }).default('ACTIVE'), // ACTIVE, SUPERSEDED, CANCELLED
});

// Tax Calculation Breakdown table
export const taxCalculationBreakdown = pgTable('tax_calculation_breakdown', {
  id: serial('id').primaryKey(),
  calculationId: integer('calculation_id').notNull(), // References calculation_audit_trail
  stepNumber: integer('step_number').notNull(),
  description: text('description').notNull(),
  formula: text('formula'),
  inputs: jsonb('inputs').notNull(),
  calculation: text('calculation').notNull(),
  result: decimal('result', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('AED'),
  notes: text('notes'),
  regulatoryReference: varchar('regulatory_reference', { length: 200 }),
});

// CIT Return Calculations table
export const citReturnCalculations = pgTable('cit_return_calculations', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  taxYear: varchar('tax_year', { length: 4 }).notNull(),
  filingPeriod: varchar('filing_period', { length: 20 }).notNull(),
  accountingIncome: decimal('accounting_income', { precision: 15, scale: 2 }).notNull(),
  
  // Add backs
  nonDeductibleExpenses: decimal('non_deductible_expenses', { precision: 15, scale: 2 }).default('0'),
  depreciation: decimal('depreciation', { precision: 15, scale: 2 }).default('0'),
  provisionsReversals: decimal('provisions_reversals', { precision: 15, scale: 2 }).default('0'),
  penaltiesFines: decimal('penalties_fines', { precision: 15, scale: 2 }).default('0'),
  entertainmentExpenses: decimal('entertainment_expenses', { precision: 15, scale: 2 }).default('0'),
  excessiveSalaries: decimal('excessive_salaries', { precision: 15, scale: 2 }).default('0'),
  otherAddBacks: decimal('other_add_backs', { precision: 15, scale: 2 }).default('0'),
  
  // Deductions
  acceleratedDepreciation: decimal('accelerated_depreciation', { precision: 15, scale: 2 }).default('0'),
  researchDevelopment: decimal('research_development', { precision: 15, scale: 2 }).default('0'),
  capitalAllowances: decimal('capital_allowances', { precision: 15, scale: 2 }).default('0'),
  businessProvisions: decimal('business_provisions', { precision: 15, scale: 2 }).default('0'),
  carryForwardLosses: decimal('carry_forward_losses', { precision: 15, scale: 2 }).default('0'),
  otherDeductions: decimal('other_deductions', { precision: 15, scale: 2 }).default('0'),
  
  // Free Zone Information
  isFreeZone: boolean('is_free_zone').default(false),
  freeZoneName: varchar('free_zone_name', { length: 100 }),
  qualifyingIncome: decimal('qualifying_income', { precision: 15, scale: 2 }).default('0'),
  nonQualifyingIncome: decimal('non_qualifying_income', { precision: 15, scale: 2 }).default('0'),
  
  // Installments
  q1Paid: decimal('q1_paid', { precision: 15, scale: 2 }).default('0'),
  q2Paid: decimal('q2_paid', { precision: 15, scale: 2 }).default('0'),
  q3Paid: decimal('q3_paid', { precision: 15, scale: 2 }).default('0'),
  q4Paid: decimal('q4_paid', { precision: 15, scale: 2 }).default('0'),
  
  // Other fields
  withholdingCredits: decimal('withholding_credits', { precision: 15, scale: 2 }).default('0'),
  penaltiesInterest: decimal('penalties_interest', { precision: 15, scale: 2 }).default('0'),
  
  // Calculated results
  totalAddBacks: decimal('total_add_backs', { precision: 15, scale: 2 }).default('0'),
  totalDeductions: decimal('total_deductions', { precision: 15, scale: 2 }).default('0'),
  taxableIncome: decimal('taxable_income', { precision: 15, scale: 2 }).default('0'),
  citLiability: decimal('cit_liability', { precision: 15, scale: 2 }).default('0'),
  applicableRate: decimal('applicable_rate', { precision: 5, scale: 4 }).default('0.09'),
  reliefApplied: decimal('relief_applied', { precision: 15, scale: 2 }).default('0'),
  installmentsPaid: decimal('installments_paid', { precision: 15, scale: 2 }).default('0'),
  netTaxDue: decimal('net_tax_due', { precision: 15, scale: 2 }).default('0'),
  refundDue: decimal('refund_due', { precision: 15, scale: 2 }).default('0'),
  
  // Declaration
  accurateComplete: boolean('accurate_complete').default(false),
  authorizedSignatory: boolean('authorized_signatory').default(false),
  
  status: varchar('status', { length: 20 }).default('DRAFT'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Document Management System (matching the main system exactly)
export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(), // Size in bytes
  type: text("type").notNull(), // MIME type
  category: text("category").notNull(), // TRN_CERTIFICATE, INVOICES_RECEIPTS, etc.
  companyId: integer("company_id").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  url: text("url").notNull(), // Object storage URL
  objectPath: text("object_path").notNull(), // Internal object storage path
  status: text("status").default("ACTIVE"), // ACTIVE, ARCHIVED, DELETED
  tags: text("tags").array(), // Searchable tags
  description: text("description"),
  
  // Compliance tracking
  isRequired: boolean("is_required").default(false),
  expiryDate: timestamp("expiry_date"), // For certificates that expire
  
  uploadedAt: timestamp("uploaded_at").defaultNow(),
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

// Extended CIT Return schema with detailed calculations
export const citReturnCalculationsSchema = z.object({
  // Basic Information
  taxYear: z.string(),
  filingPeriod: z.string(),
  accountingIncome: z.number(),
  
  // Tax Adjustments
  addBacks: z.object({
    nonDeductibleExpenses: z.number().optional(),
    depreciation: z.number().optional(),
    provisionsReversals: z.number().optional(),
    penaltiesFines: z.number().optional(),
    entertainmentExpenses: z.number().optional(),
    excessiveSalaries: z.number().optional(),
    other: z.number().optional(),
  }),
  
  deductions: z.object({
    acceleratedDepreciation: z.number().optional(),
    researchDevelopment: z.number().optional(),
    capitalAllowances: z.number().optional(),
    businessProvisions: z.number().optional(),
    carryForwardLosses: z.number().optional(),
    other: z.number().optional(),
  }),
  
  // Free Zone Information
  isFreeZone: z.boolean(),
  freeZoneName: z.string().optional(),
  qualifyingIncome: z.number().optional(),
  nonQualifyingIncome: z.number().optional(),
  
  // Quarterly Installments
  installments: z.object({
    q1Paid: z.number().optional(),
    q2Paid: z.number().optional(),
    q3Paid: z.number().optional(),
    q4Paid: z.number().optional(),
  }),
  
  // Withholding Tax Credits and penalties
  withholdingCredits: z.number().optional(),
  penaltiesInterest: z.number().optional(),
  
  // Calculated results
  calculation: z.object({
    accountingIncome: z.number(),
    totalAddBacks: z.number(),
    totalDeductions: z.number(),
    taxableIncome: z.number(),
    citLiability: z.number(),
    applicableRate: z.number(),
    reliefApplied: z.number(),
    installmentsPaid: z.number(),
    withholdingCredits: z.number(),
    penaltiesInterest: z.number(),
    netTaxDue: z.number(),
    refundDue: z.number(),
  }),
  
  // Declaration
  declaration: z.object({
    accurateComplete: z.boolean(),
    authorizedSignatory: z.boolean(),
  }),
});

// Create insert schemas for all tables
export const insertTransferPricingDocumentationSchema = createInsertSchema(transferPricingDocumentation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncJobSchema = createInsertSchema(syncJobs).omit({
  id: true,
  createdAt: true,
});

export const insertExportJobSchema = createInsertSchema(exportJobs).omit({
  id: true,
  createdAt: true,
});

export const insertImportJobSchema = createInsertSchema(importJobs).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({
  id: true,
  createdAt: true,
});

export const insertSyncConflictSchema = createInsertSchema(syncConflicts).omit({
  id: true,
  createdAt: true,
});

export const insertCalculationAuditTrailSchema = createInsertSchema(calculationAuditTrail).omit({
  id: true,
  timestamp: true,
});

export const insertTaxCalculationBreakdownSchema = createInsertSchema(taxCalculationBreakdown).omit({
  id: true,
});

export const insertCitReturnCalculationsSchema = createInsertSchema(citReturnCalculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
}).extend({
  expiryDate: z.coerce.date().optional(),
});

// Type exports for all tables
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
export type Integration = typeof integrations.$inferSelect;
export type SyncJob = typeof syncJobs.$inferSelect;
export type ExportJob = typeof exportJobs.$inferSelect;
export type ImportJob = typeof importJobs.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type SyncConflict = typeof syncConflicts.$inferSelect;
export type CalculationAuditTrail = typeof calculationAuditTrail.$inferSelect;
export type TaxCalculationBreakdown = typeof taxCalculationBreakdown.$inferSelect;
export type CitReturnCalculations = typeof citReturnCalculations.$inferSelect;
export type Document = typeof documentsTable.$inferSelect;

// Insert type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertTaxFiling = z.infer<typeof insertTaxFilingSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertCreditNote = z.infer<typeof insertCreditNoteSchema>;
export type InsertDebitNote = z.infer<typeof insertDebitNoteSchema>;
export type InsertTransferPricingDocumentation = z.infer<typeof insertTransferPricingDocumentationSchema>;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type InsertSyncJob = z.infer<typeof insertSyncJobSchema>;
export type InsertExportJob = z.infer<typeof insertExportJobSchema>;
export type InsertImportJob = z.infer<typeof insertImportJobSchema>;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
export type InsertSyncConflict = z.infer<typeof insertSyncConflictSchema>;
export type InsertCalculationAuditTrail = z.infer<typeof insertCalculationAuditTrailSchema>;
export type InsertTaxCalculationBreakdown = z.infer<typeof insertTaxCalculationBreakdownSchema>;
export type InsertCitReturnCalculations = z.infer<typeof insertCitReturnCalculationsSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;