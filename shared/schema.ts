import { pgTable, text, serial, integer, boolean, decimal, timestamp, json, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import calculation schemas
export * from './calculation-schemas';

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
  freeZone: boolean("free_zone").default(false),
  vatRegistered: boolean("vat_registered").default(false),
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
  reason: text("reason").notNull(),
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("DRAFT"),
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
  reason: text("reason").notNull(),
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("DRAFT"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// KPI/Dashboard Data
export const kpiData = pgTable("kpi_data", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  period: text("period").notNull(), // YYYY-MM format
  revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0"),
  expenses: decimal("expenses", { precision: 15, scale: 2 }).default("0"),
  netIncome: decimal("net_income", { precision: 15, scale: 2 }).default("0"),
  vatDue: decimal("vat_due", { precision: 15, scale: 2 }).default("0"),
  citDue: decimal("cit_due", { precision: 15, scale: 2 }).default("0"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// Create insert schemas
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
}).extend({
  transactionDate: z.coerce.date(),
});

export const insertTaxFilingSchema = createInsertSchema(taxFilings).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  submittedAt: z.coerce.date().optional(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
}).extend({
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  scheduledFor: z.coerce.date().optional(),
});

export const insertCreditNoteSchema = createInsertSchema(creditNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  issueDate: z.coerce.date(),
});

export const insertDebitNoteSchema = createInsertSchema(debitNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  issueDate: z.coerce.date(),
});

export const insertKpiDataSchema = createInsertSchema(kpiData).omit({
  id: true,
  calculatedAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TaxFiling = typeof taxFilings.$inferSelect;
export type InsertTaxFiling = z.infer<typeof insertTaxFilingSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CreditNote = typeof creditNotes.$inferSelect;
export type InsertCreditNote = z.infer<typeof insertCreditNoteSchema>;
export type DebitNote = typeof debitNotes.$inferSelect;
export type InsertDebitNote = z.infer<typeof insertDebitNoteSchema>;
export type KpiData = typeof kpiData.$inferSelect;
export type InsertKpiData = z.infer<typeof insertKpiDataSchema>;

// Chart of Accounts table
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  vatCode: varchar("vat_code", { length: 20 }).notNull(),
  citDeductible: boolean("cit_deductible").notNull().default(true),
  notes: text("notes").default(""),
  qualifiesForQFZP: boolean("qualifies_for_qfzp").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChartOfAccountSchema = createInsertSchema(chartOfAccounts);
export type InsertChartOfAccount = z.infer<typeof insertChartOfAccountSchema>;
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;

// Document Management System
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

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
}).extend({
  expiryDate: z.coerce.date().optional(),
});

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

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

// CIT Return specific types
export type CitReturnCalculations = z.infer<typeof citReturnCalculationsSchema>;

// Transfer Pricing table
export const transferPricingDocumentation = pgTable("transfer_pricing_documentation", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  reportingYear: varchar("reporting_year", { length: 4 }).notNull(),
  reportingPeriod: varchar("reporting_period", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // DRAFT, SUBMITTED, REVIEWED, APPROVED
  data: jsonb("data").notNull(), // Store the full transfer pricing data
  submittedAt: timestamp("submitted_at"),
  submittedBy: integer("submitted_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTransferPricingDocumentationSchema = createInsertSchema(transferPricingDocumentation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  submittedAt: z.coerce.date().optional(),
  reviewedAt: z.coerce.date().optional(),
});

export type TransferPricingDocumentation = typeof transferPricingDocumentation.$inferSelect;
export type InsertTransferPricingDocumentation = z.infer<typeof insertTransferPricingDocumentationSchema>;

// Integrations Tables for API connectivity
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
  lastTestDate: timestamp("last_test_date"),
  testResult: jsonb("test_result"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syncJobs = pgTable("sync_jobs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull(),
  direction: text("direction").notNull(), // IMPORT, EXPORT, BIDIRECTIONAL
  dataTypes: text("data_types").array().notNull(),
  status: text("status").notNull(), // PENDING, RUNNING, COMPLETED, COMPLETED_WITH_CONFLICTS, FAILED, CANCELLED
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  recordsProcessed: integer("records_processed").default(0),
  recordsSuccess: integer("records_success").default(0),
  recordsError: integer("records_error").default(0),
  errorMessage: text("error_message"),
  triggeredBy: integer("triggered_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exportJobs = pgTable("export_jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  config: jsonb("config").notNull(),
  status: text("status").notNull(), // PROCESSING, COMPLETED, FAILED
  filename: text("filename"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const importJobs = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  dataType: text("data_type").notNull(),
  config: jsonb("config").notNull(),
  status: text("status").notNull(), // PROCESSING, COMPLETED, VALIDATED, FAILED
  totalRows: integer("total_rows").default(0),
  validRows: integer("valid_rows").default(0),
  errorRows: integer("error_rows").default(0),
  validationErrors: jsonb("validation_errors"),
  processingErrors: jsonb("processing_errors"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: text("events").array().notNull(),
  isActive: boolean("is_active").default(true),
  secret: text("secret").notNull(),
  headers: jsonb("headers"),
  retryPolicy: jsonb("retry_policy"),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").notNull(),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull(), // PENDING, SUCCESS, FAILED
  statusCode: integer("status_code"),
  responseTime: integer("response_time"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  deliveredAt: timestamp("delivered_at"),
  lastRetryAt: timestamp("last_retry_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syncConflicts = pgTable("sync_conflicts", {
  id: serial("id").primaryKey(),
  syncJobId: integer("sync_job_id").notNull(),
  recordId: text("record_id").notNull(),
  conflictType: text("conflict_type").notNull(), // DATA_MISMATCH, DUPLICATE_RECORD, MISSING_DEPENDENCY
  field: text("field"),
  sourceValue: jsonb("source_value"),
  targetValue: jsonb("target_value"),
  status: text("status").default("PENDING"), // PENDING, RESOLVED
  resolution: jsonb("resolution"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Integration types
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;
export type SyncJob = typeof syncJobs.$inferSelect;
export type InsertSyncJob = typeof syncJobs.$inferInsert;
export type ExportJob = typeof exportJobs.$inferSelect;
export type InsertExportJob = typeof exportJobs.$inferInsert;
export type ImportJob = typeof importJobs.$inferSelect;
export type InsertImportJob = typeof importJobs.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = typeof webhookDeliveries.$inferInsert;
export type SyncConflict = typeof syncConflicts.$inferSelect;
export type InsertSyncConflict = typeof syncConflicts.$inferInsert;
