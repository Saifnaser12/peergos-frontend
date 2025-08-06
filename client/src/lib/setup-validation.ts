export const UAE_EMIRATES = [
  { code: 'AUH', name: 'Abu Dhabi' },
  { code: 'DXB', name: 'Dubai' },
  { code: 'SHJ', name: 'Sharjah' },
  { code: 'AJM', name: 'Ajman' },
  { code: 'UMQ', name: 'Umm Al Quwain' },
  { code: 'RAK', name: 'Ras Al Khaimah' },
  { code: 'FUJ', name: 'Fujairah' },
];

export const ACCOUNTING_METHODS = [
  { value: 'cash', label: 'Cash Basis', description: 'Record transactions when cash is received/paid' },
  { value: 'accrual', label: 'Accrual Basis', description: 'Record transactions when they occur' },
];

export const REVENUE_CATEGORIES = [
  { value: 'UNDER_375K', label: 'Under AED 375,000', threshold: 375000 },
  { value: 'BETWEEN_375K_3M', label: 'AED 375,000 - 3,000,000', threshold: 3000000 },
  { value: 'ABOVE_3M', label: 'Above AED 3,000,000', threshold: Number.MAX_SAFE_INTEGER },
];

export const BUSINESS_MODELS = [
  { value: 'B2B', label: 'Business to Business (B2B)' },
  { value: 'B2C', label: 'Business to Consumer (B2C)' },
  { value: 'MIXED', label: 'Mixed B2B & B2C' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'SERVICES', label: 'Professional Services' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'TRADING', label: 'Trading & Distribution' },
];

export const SETUP_VALIDATION_RULES = {
  VAT_THRESHOLD: 375000, // AED 375,000
  CASH_BASIS_LIMIT: 3000000, // AED 3,000,000
  MIN_REVENUE: 0,
  MAX_INTERNATIONAL_PERCENTAGE: 100,
};

// Auto-configuration logic based on UAE tax thresholds
export const autoConfigureTaxSettings = (expectedRevenue: number) => {
  return {
    vatRequired: expectedRevenue > SETUP_VALIDATION_RULES.VAT_THRESHOLD,
    accountingMethod: expectedRevenue < SETUP_VALIDATION_RULES.CASH_BASIS_LIMIT ? 'cash' : 'accrual',
    citRequired: true, // All UAE companies require CIT registration
  };
};

// Validation schemas for setup steps
import { z } from 'zod';

export const companyInfoSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  trn: z.string().regex(/^\d{15}$/, 'TRN must be exactly 15 digits'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  emirate: z.string().optional(),
  industry: z.string().optional(),
});

export const revenueThresholdSchema = z.object({
  expectedAnnualRevenue: z.number().min(0, 'Revenue cannot be negative'),
  hasInternationalSales: z.boolean(),
  internationalPercentage: z.number().min(0).max(100).optional(),
});

export const revenueDeclarationSchema = z.object({
  expectedAnnualRevenue: z.number().min(0, 'Revenue cannot be negative'),
  revenueCategory: z.string().optional(),
  mainRevenueSource: z.string().optional(),
  businessModel: z.string().optional(),
  hasInternationalSales: z.boolean(),
  internationalSalesPercentage: z.number().min(0).max(100).optional(),
});

export const taxRegistrationSchema = z.object({
  vatRegistered: z.boolean(),
  citRegistrationRequired: z.boolean(),
  freeZone: z.boolean(),
  qfzpStatus: z.boolean(),
});

export const accountingBasisSchema = z.object({
  accountingMethod: z.enum(['cash', 'accrual']),
  financialYearEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date'),
  autoConfigured: z.boolean().optional(),
});

export const freeZoneLicenseSchema = z.object({
  freeZone: z.boolean(),
  freeZoneName: z.string().optional(),
  qfzpStatus: z.boolean(),
  licenseActivity: z.string().optional(),
  licenseExpiry: z.string().optional(),
});

export const trnUploadSchema = z.object({
  trnCertificate: z.string().optional(),
  vatCertificate: z.string().optional(),
  tradeLicense: z.string().optional(),
  additionalDocuments: z.array(z.string()).optional(),
});

export const summaryReviewSchema = z.object({
  confirmAccuracy: z.boolean(),
  acceptTerms: z.boolean(),
  setupCompleted: z.boolean().default(false),
});

export const setupDataSchema = z.object({
  companyInfo: companyInfoSchema,
  revenueThreshold: revenueThresholdSchema,
  taxRegistration: taxRegistrationSchema,
  accountingBasis: accountingBasisSchema,
});

// Type exports
export type CompanyInfo = z.infer<typeof companyInfoSchema>;
export type RevenueThreshold = z.infer<typeof revenueThresholdSchema>;
export type RevenueDeclaration = z.infer<typeof revenueDeclarationSchema>;
export type TaxRegistration = z.infer<typeof taxRegistrationSchema>;
export type AccountingBasis = z.infer<typeof accountingBasisSchema>;
export type FreeZoneLicense = z.infer<typeof freeZoneLicenseSchema>;
export type TrnUpload = z.infer<typeof trnUploadSchema>;
export type SummaryReview = z.infer<typeof summaryReviewSchema>;
export type SetupData = z.infer<typeof setupDataSchema>;

// Tax category calculation helper
export const calculateTaxCategory = (revenue: number) => {
  if (revenue < SETUP_VALIDATION_RULES.VAT_THRESHOLD) {
    return {
      category: 'UNDER_VAT_THRESHOLD',
      vatRequired: false,
      accountingMethod: 'cash',
      description: 'Below VAT registration threshold'
    };
  } else if (revenue < SETUP_VALIDATION_RULES.CASH_BASIS_LIMIT) {
    return {
      category: 'VAT_REGISTERED_CASH',
      vatRequired: true,
      accountingMethod: 'cash',
      description: 'VAT registered with cash accounting'
    };
  } else {
    return {
      category: 'VAT_REGISTERED_ACCRUAL',
      vatRequired: true,
      accountingMethod: 'accrual',
      description: 'VAT registered with accrual accounting'
    };
  }
};

// Step validation helper
export const validateStep = (stepNumber: number, data: any): boolean => {
  try {
    switch (stepNumber) {
      case 1:
        return companyInfoSchema.safeParse(data).success;
      case 2:
        return revenueDeclarationSchema.safeParse(data).success;
      case 3:
        return freeZoneLicenseSchema.safeParse(data).success;
      case 4:
        return trnUploadSchema.safeParse(data).success;
      case 5:
        return summaryReviewSchema.safeParse(data).success;
      default:
        return false;
    }
  } catch {
    return false;
  }
};