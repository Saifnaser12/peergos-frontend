import { describe, it, expect } from 'vitest';
import { 
  businessInfoSchema,
  revenueDeclarationSchema,
  freeZoneLicenseSchema,
  trnUploadSchema,
  summaryReviewSchema,
  validateStep
} from '@/lib/setup-validation';

describe('Setup Validation', () => {
  describe('Business Info Validation', () => {
    it('should validate required business information', () => {
      const validData = {
        companyName: 'Test Company LLC',
        tradeLicenseNumber: 'CN-123456',
        businessActivity: 'Trading',
        establishmentDate: '2024-01-15',
        address: '123 Business Bay, Dubai, UAE',
        emirate: 'DUBAI' as const,
        contactEmail: 'test@company.com',
        contactPhone: '+971501234567',
      };

      const result = businessInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid business information', () => {
      const invalidData = {
        companyName: '', // Empty required field
        tradeLicenseNumber: 'CN-123456',
        emirate: 'Dubai',
      };

      const result = businessInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Revenue Declaration Validation', () => {
    it('should validate revenue declaration with no international sales', () => {
      const validData = {
        expectedAnnualRevenue: 500000,
        revenueCategory: 'BETWEEN_375K_3M' as const,
        mainRevenueSource: 'Consulting Services',
        businessModel: 'B2B' as const,
        hasInternationalSales: false,
      };

      const result = revenueDeclarationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate revenue declaration with international sales', () => {
      const validData = {
        expectedAnnualRevenue: 1200000,
        revenueCategory: 'BETWEEN_375K_3M' as const,
        mainRevenueSource: 'Trading and Export',
        businessModel: 'MIXED' as const,
        hasInternationalSales: true,
        internationalSalesPercentage: 25,
      };

      const result = revenueDeclarationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require international sales details when applicable', () => {
      const invalidData = {
        expectedAnnualRevenue: 800000,
        revenueCategory: 'BETWEEN_375K_3M',
        businessModel: 'B2B',
        hasInternationalSales: true,
        // Missing required international sales details
      };

      const result = revenueDeclarationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Free Zone License Validation', () => {
    it('should validate mainland license', () => {
      const validData = {
        licenseType: 'Mainland',
        licenseNumber: 'CN-789012',
        licenseIssueDate: '2024-01-15',
        licenseExpiryDate: '2025-01-14',
        isQFZP: false,
        docs: [],
      };

      const result = freeZoneLicenseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate free zone license with QFZP', () => {
      const validData = {
        licenseType: 'FreeZone',
        freeZoneName: 'DIFC',
        licenseNumber: 'DIFC-345678',
        licenseIssueDate: '2024-01-15',
        licenseExpiryDate: '2025-01-14',
        isQFZP: true,
        docs: [],
      };

      const result = freeZoneLicenseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require free zone name when license type is FreeZone', () => {
      const invalidData = {
        licenseType: 'FreeZone',
        // Missing freeZoneName
        licenseNumber: 'FZ-123456',
        licenseIssueDate: '2024-01-15',
        licenseExpiryDate: '2025-01-14',
        isQFZP: false,
        docs: [],
      };

      const result = freeZoneLicenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('TRN Upload Validation', () => {
    it('should validate TRN data when TRN is provided', () => {
      const validData = {
        hasTRN: true,
        trnNumber: '100123456789012',
        vatRegistrationDate: '2024-01-01',
        citRegistrationRequired: true,
        citRegistrationDate: '2024-01-01',
        taxAgentAppointed: false,
      };

      const result = trnUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without TRN', () => {
      const validData = {
        hasTRN: false,
        citRegistrationRequired: false,
        taxAgentAppointed: false,
      };

      const result = trnUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require tax agent name when agent is appointed', () => {
      const invalidData = {
        hasTRN: true,
        trnNumber: '100987654321098',
        vatRegistrationDate: '2024-01-01',
        citRegistrationRequired: true,
        taxAgentAppointed: true,
        // Missing taxAgentName
      };

      const result = trnUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Summary Review Validation', () => {
    it('should validate complete summary review', () => {
      const validData = {
        confirmFinancialYearEnd: '2024-12-31',
        wantsSmartReminders: true,
        agreeToTerms: true,
        readyToStart: true,
      };

      const result = summaryReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require terms agreement', () => {
      const invalidData = {
        confirmFinancialYearEnd: '2024-12-31',
        wantsSmartReminders: true,
        agreeToTerms: false, // Required to be true
        readyToStart: true,
      };

      const result = summaryReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Step Validation Function', () => {
    it('should validate each step correctly', () => {
      const businessInfo = {
        companyName: 'Test LLC',
        tradeLicenseNumber: 'CN-123456',
        businessActivity: 'Trading',
        establishmentDate: '2024-01-15',
        address: '123 Business Bay, Dubai, UAE',
        emirate: 'DUBAI' as const,
        contactEmail: 'test@company.com',
        contactPhone: '+971501234567',
      };

      const result = validateStep(1, businessInfo);
      expect(result.success).toBe(true);
    });

    it('should handle invalid step numbers', () => {
      const result = validateStep(99, {});
      expect(result.success).toBe(false);
    });
  });
});