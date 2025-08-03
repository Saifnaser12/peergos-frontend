import { z } from 'zod';

// Step 1: Business Information
export const businessInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  tradeLicenseNumber: z.string().min(5, 'Trade license number is required'),
  businessActivity: z.string().min(3, 'Business activity is required'),
  establishmentDate: z.string().min(1, 'Establishment date is required'),
  address: z.string().min(10, 'Complete address is required'),
  emirate: z.enum(['ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH'], {
    errorMap: () => ({ message: 'Please select an emirate' })
  }),
  contactEmail: z.string().email('Valid email address is required'),
  contactPhone: z.string().min(8, 'Valid phone number is required'),
});

// Step 2: Revenue Declaration
export const revenueDeclarationSchema = z.object({
  expectedAnnualRevenue: z.number().min(0, 'Revenue cannot be negative'),
  revenueCategory: z.enum(['BELOW_375K', 'BETWEEN_375K_3M', 'ABOVE_3M'], {
    errorMap: () => ({ message: 'Please select a revenue category' })
  }),
  mainRevenueSource: z.string().min(3, 'Main revenue source is required'),
  businessModel: z.enum(['B2B', 'B2C', 'MIXED'], {
    errorMap: () => ({ message: 'Please select business model' })
  }),
  hasInternationalSales: z.boolean().optional().default(false),
  internationalSalesPercentage: z.number().min(0).max(100).optional(),
});

// Step 3: Free Zone & License Details
export const freeZoneLicenseSchema = z.object({
  licenseType: z.enum(['Mainland', 'FreeZone'], {
    errorMap: () => ({ message: 'Please select license type' })
  }),
  freeZoneName: z.string().optional(),
  licenseNumber: z.string().min(6, 'License number must be at least 6 characters').max(20, 'License number cannot exceed 20 characters'),
  licenseIssueDate: z.string().min(1, 'License issue date is required'),
  licenseExpiryDate: z.string().min(1, 'License expiry date is required'),
  isQFZP: z.boolean().optional().default(false),
  docs: z.array(z.instanceof(File)).optional().default([]),
}).refine((data) => {
  // Require freeZoneName if licenseType is FreeZone
  if (data.licenseType === 'FreeZone' && (!data.freeZoneName || data.freeZoneName.length < 2)) {
    return false;
  }
  return true;
}, {
  message: 'Free zone name is required for free zone licenses',
  path: ['freeZoneName']
}).refine((data) => {
  // Check that expiry date is after issue date
  if (data.licenseIssueDate && data.licenseExpiryDate) {
    const issueDate = new Date(data.licenseIssueDate);
    const expiryDate = new Date(data.licenseExpiryDate);
    return expiryDate > issueDate;
  }
  return true;
}, {
  message: 'License expiry date must be after issue date',
  path: ['licenseExpiryDate']
});

// Step 4: TRN & Tax Registration
export const trnUploadSchema = z.object({
  hasTRN: z.boolean(),
  trnNumber: z.string().optional(),
  trnCertificate: z.instanceof(File).optional(),
  vatRegistrationDate: z.string().optional(),
  citRegistrationRequired: z.boolean(),
  citRegistrationDate: z.string().optional(),
  taxAgentAppointed: z.boolean(),
  taxAgentName: z.string().optional(),
  taxAgentLicense: z.string().optional(),
}).refine((data) => {
  // Require TRN number if hasTRN is true
  if (data.hasTRN && (!data.trnNumber || data.trnNumber.length < 9)) {
    return false;
  }
  return true;
}, {
  message: 'TRN number must be at least 9 digits when TRN is selected',
  path: ['trnNumber']
}).refine((data) => {
  // Require tax agent name if appointed
  if (data.taxAgentAppointed && (!data.taxAgentName || data.taxAgentName.length < 2)) {
    return false;
  }
  return true;
}, {
  message: 'Tax agent name is required when agent is appointed',
  path: ['taxAgentName']
});

// Step 5: Summary & Review
export const summaryReviewSchema = z.object({
  confirmFinancialYearEnd: z.string().min(1, 'Financial year end is required'),
  wantsSmartReminders: z.boolean().default(true),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  readyToStart: z.boolean().default(false),
});

// Complete setup data combining all steps
export const completeSetupSchema = z.object({
  businessInfo: businessInfoSchema,
  revenueDeclaration: revenueDeclarationSchema,
  freeZoneLicense: freeZoneLicenseSchema,
  trnUpload: trnUploadSchema,
  summaryReview: summaryReviewSchema,
});

// Types
export type BusinessInfo = z.infer<typeof businessInfoSchema>;
export type RevenueDeclaration = z.infer<typeof revenueDeclarationSchema>;
export type FreeZoneLicense = z.infer<typeof freeZoneLicenseSchema>;
export type TRNUpload = z.infer<typeof trnUploadSchema>;
export type SummaryReview = z.infer<typeof summaryReviewSchema>;
export type CompleteSetup = z.infer<typeof completeSetupSchema>;

// Step validation functions
export const validateStep = (step: number, data: any) => {
  switch (step) {
    case 1:
      return businessInfoSchema.safeParse(data);
    case 2:
      return revenueDeclarationSchema.safeParse(data);
    case 3:
      return freeZoneLicenseSchema.safeParse(data);
    case 4:
      return trnUploadSchema.safeParse(data);
    case 5:
      return summaryReviewSchema.safeParse(data);
    default:
      return { success: false, error: { issues: [{ message: 'Invalid step' }] } };
  }
};

// UAE Emirates list
export const UAE_EMIRATES = [
  { value: 'ABU_DHABI', label: 'Abu Dhabi' },
  { value: 'DUBAI', label: 'Dubai' },
  { value: 'SHARJAH', label: 'Sharjah' },
  { value: 'AJMAN', label: 'Ajman' },
  { value: 'UMM_AL_QUWAIN', label: 'Umm Al Quwain' },
  { value: 'RAS_AL_KHAIMAH', label: 'Ras Al Khaimah' },
  { value: 'FUJAIRAH', label: 'Fujairah' },
];

// Revenue categories with descriptions
export const REVENUE_CATEGORIES = [
  {
    value: 'BELOW_375K',
    label: 'Below AED 375,000',
    description: 'Small Business Relief - 0% CIT rate',
    citRate: '0%',
    benefits: ['Zero CIT rate', 'Simplified compliance', 'Reduced reporting requirements']
  },
  {
    value: 'BETWEEN_375K_3M',
    label: 'AED 375,000 - 3,000,000',
    description: 'Standard CIT rate with Small Business Relief on first AED 375k',
    citRate: '9% (above AED 375k)',
    benefits: ['Partial Small Business Relief', 'Standard compliance requirements']
  },
  {
    value: 'ABOVE_3M',
    label: 'Above AED 3,000,000',
    description: 'Standard CIT rate applies to full income',
    citRate: '9%',
    benefits: ['Full business deductions', 'Advanced tax planning opportunities']
  },
];

// Free Zone options
export const FREE_ZONES = [
  'DIFC - Dubai International Financial Centre',
  'ADGM - Abu Dhabi Global Market',
  'DMCC - Dubai Multi Commodities Centre',
  'JAFZA - Jebel Ali Free Zone',
  'RAKFTZ - Ras Al Khaimah Free Trade Zone',
  'SAIF Zone - Sharjah Airport International Free Zone',
  'Other Free Zone',
];

// Business model descriptions
export const BUSINESS_MODELS = [
  {
    value: 'B2B',
    label: 'Business to Business (B2B)',
    description: 'Primarily selling to other businesses',
    vatImplications: 'Input VAT recovery available, detailed invoice requirements'
  },
  {
    value: 'B2C',
    label: 'Business to Consumer (B2C)',
    description: 'Primarily selling to end consumers',
    vatImplications: 'Consumer-friendly invoicing, point-of-sale VAT collection'
  },
  {
    value: 'MIXED',
    label: 'Mixed Business Model',
    description: 'Combination of B2B and B2C sales',
    vatImplications: 'Flexible invoicing requirements, comprehensive VAT tracking'
  },
];

// Calculate tax category based on setup data
export const calculateTaxCategory = (setupData: CompleteSetup) => {
  const { revenueDeclaration, freeZoneLicense } = setupData;
  
  let citRate = '9%';
  let vatApplicable = true;
  let category = 'Standard Business';
  let benefits: string[] = [];
  let requirements: string[] = [];

  // Determine CIT rate based on revenue and Free Zone status
  if (freeZoneLicense.licenseType === 'FreeZone' && freeZoneLicense.isQFZP && revenueDeclaration.expectedAnnualRevenue <= 3000000) {
    citRate = '0%';
    category = 'Qualifying Free Zone Person (QFZP)';
    benefits.push('0% CIT on qualifying income');
    benefits.push('Reduced compliance requirements');
    requirements.push('Maintain QFZP status');
    requirements.push('Arm\'s length pricing for related party transactions');
  } else if (revenueDeclaration.revenueCategory === 'BELOW_375K') {
    citRate = '0%';
    category = 'Small Business Relief';
    benefits.push('0% CIT on income below AED 375,000');
    benefits.push('Simplified tax compliance');
    requirements.push('Annual CIT return filing');
  } else if (revenueDeclaration.revenueCategory === 'BETWEEN_375K_3M') {
    citRate = '0% (first AED 375k) + 9% (above)';
    category = 'Partial Small Business Relief';
    benefits.push('0% CIT on first AED 375,000');
    benefits.push('9% CIT on excess amount');
    requirements.push('Annual CIT return filing');
    requirements.push('Quarterly provisional payments if applicable');
  }

  // Standard requirements for all businesses
  requirements.push('Maintain proper accounting records');
  requirements.push('VAT registration if revenue > AED 375,000');
  requirements.push('File annual financial statements');

  return {
    category,
    citRate,
    vatApplicable,
    benefits,
    requirements,
    estimatedAnnualCIT: calculateEstimatedCIT(revenueDeclaration.expectedAnnualRevenue, freeZoneLicense),
    estimatedAnnualVAT: calculateEstimatedVAT(revenueDeclaration.expectedAnnualRevenue),
  };
};

const calculateEstimatedCIT = (revenue: number, freeZone: FreeZoneLicense): number => {
  if (freeZone.licenseType === 'FreeZone' && freeZone.isQFZP && revenue <= 3000000) {
    return 0; // QFZP exemption
  }
  
  if (revenue <= 375000) {
    return 0; // Small Business Relief
  }
  
  const taxableAmount = revenue - 375000; // Small Business Relief on first AED 375k
  return taxableAmount * 0.09; // 9% CIT rate
};

const calculateEstimatedVAT = (revenue: number): number => {
  if (revenue <= 375000) {
    return 0; // Below VAT threshold
  }
  
  // Assume 70% of revenue is VAT-able (excluding exempt supplies)
  const vatableRevenue = revenue * 0.7;
  return vatableRevenue * 0.05; // 5% VAT rate
};