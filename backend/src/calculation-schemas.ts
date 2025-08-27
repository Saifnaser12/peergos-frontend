import { z } from 'zod';
import { pgTable, serial, varchar, text, decimal, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Calculation Audit Trail Table
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

// Tax Calculation Breakdown Table
export const taxCalculationBreakdown = pgTable('tax_calculation_breakdown', {
  id: serial('id').primaryKey(),
  auditTrailId: integer('audit_trail_id').notNull(),
  stepNumber: integer('step_number').notNull(),
  stepDescription: varchar('step_description', { length: 500 }).notNull(),
  formula: varchar('formula', { length: 200 }),
  inputValues: jsonb('input_values').notNull(),
  calculation: varchar('calculation', { length: 1000 }).notNull(),
  result: decimal('result', { precision: 15, scale: 4 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('AED'),
  regulatoryNote: text('regulatory_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Calculation Summary Report Table
export const calculationSummaryReport = pgTable('calculation_summary_report', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  reportType: varchar('report_type', { length: 50 }).notNull(), // 'MONTHLY_VAT', 'ANNUAL_CIT', etc.
  reportPeriod: varchar('report_period', { length: 20 }).notNull(), // 'YYYY-MM' or 'YYYY'
  totalCalculations: integer('total_calculations').notNull(),
  totalTaxAmount: decimal('total_tax_amount', { precision: 15, scale: 2 }).notNull(),
  breakdownByType: jsonb('breakdown_by_type').notNull(),
  summaryData: jsonb('summary_data').notNull(),
  generatedBy: integer('generated_by').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  exportedAt: timestamp('exported_at'),
  exportFormat: varchar('export_format', { length: 20 }), // 'PDF', 'EXCEL', 'JSON'
  exportPath: varchar('export_path', { length: 500 }),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
});

// Amendment History Table
export const amendmentHistory = pgTable('amendment_history', {
  id: serial('id').primaryKey(),
  originalRecordId: integer('original_record_id').notNull(),
  recordType: varchar('record_type', { length: 50 }).notNull(), // 'TAX_FILING', 'TRANSACTION', etc.
  amendmentType: varchar('amendment_type', { length: 50 }).notNull(), // 'CORRECTION', 'ADDITIONAL_INFO', 'CANCELLATION'
  previousVersion: jsonb('previous_version').notNull(),
  newVersion: jsonb('new_version').notNull(),
  changesSummary: jsonb('changes_summary').notNull(),
  reason: text('reason').notNull(),
  amendedBy: integer('amended_by').notNull(),
  amendedAt: timestamp('amended_at').defaultNow().notNull(),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  ftaSubmissionRef: varchar('fta_submission_ref', { length: 100 }),
  regulatoryDeadline: timestamp('regulatory_deadline'),
  status: varchar('status', { length: 20 }).default('PENDING'), // PENDING, APPROVED, SUBMITTED, REJECTED
});

// Zod schemas for validation
export const insertCalculationAuditTrailSchema = createInsertSchema(calculationAuditTrail);
export const selectCalculationAuditTrailSchema = createSelectSchema(calculationAuditTrail);

export const insertTaxCalculationBreakdownSchema = createInsertSchema(taxCalculationBreakdown);
export const selectTaxCalculationBreakdownSchema = createSelectSchema(taxCalculationBreakdown);

export const insertCalculationSummaryReportSchema = createInsertSchema(calculationSummaryReport);
export const selectCalculationSummaryReportSchema = createSelectSchema(calculationSummaryReport);

export const insertAmendmentHistorySchema = createInsertSchema(amendmentHistory);
export const selectAmendmentHistorySchema = createSelectSchema(amendmentHistory);

// Types
export type CalculationAuditTrail = typeof calculationAuditTrail.$inferSelect;
export type InsertCalculationAuditTrail = typeof calculationAuditTrail.$inferInsert;

export type TaxCalculationBreakdown = typeof taxCalculationBreakdown.$inferSelect;
export type InsertTaxCalculationBreakdown = typeof taxCalculationBreakdown.$inferInsert;

export type CalculationSummaryReport = typeof calculationSummaryReport.$inferSelect;
export type InsertCalculationSummaryReport = typeof calculationSummaryReport.$inferInsert;

export type AmendmentHistory = typeof amendmentHistory.$inferSelect;
export type InsertAmendmentHistory = typeof amendmentHistory.$inferInsert;

// Calculation step interface for structured breakdown
export interface CalculationStep {
  stepNumber: number;
  description: string;
  formula?: string;
  inputs: Record<string, number | string>;
  calculation: string;
  result: number;
  currency: string;
  notes?: string;
  regulatoryReference?: string;
}

// Calculation result interface
export interface CalculationResult {
  totalAmount: number;
  currency: string;
  breakdown: CalculationStep[];
  method: string;
  regulatoryCompliance: {
    regulation: string;
    reference: string;
    compliance: boolean;
  };
  metadata: {
    calculatedAt: string;
    calculatedBy: number;
    version: string;
    inputs: Record<string, any>;
  };
}

// Amendment request interface
export interface AmendmentRequest {
  originalId: number;
  recordType: string;
  amendmentType: 'CORRECTION' | 'ADDITIONAL_INFO' | 'CANCELLATION';
  changes: Record<string, {
    oldValue: any;
    newValue: any;
    reason: string;
  }>;
  reason: string;
  supportingDocuments?: string[];
  requestedBy: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Export format options
export const EXPORT_FORMATS = {
  PDF: 'PDF',
  EXCEL: 'EXCEL',
  JSON: 'JSON',
  CSV: 'CSV',
  XML: 'XML'
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

// Calculation types enum
export const CALCULATION_TYPES = {
  VAT: 'VAT',
  CIT: 'CIT',
  TRANSFER_PRICING: 'TRANSFER_PRICING',
  WITHHOLDING_TAX: 'WITHHOLDING_TAX',
  EXCISE_TAX: 'EXCISE_TAX',
  CUSTOMS_DUTY: 'CUSTOMS_DUTY'
} as const;

export type CalculationType = typeof CALCULATION_TYPES[keyof typeof CALCULATION_TYPES];