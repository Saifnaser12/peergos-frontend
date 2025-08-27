import { describe, it, expect } from 'vitest';
import { calculateTaxCategory } from '@/lib/setup-validation';

describe('Tax Calculators', () => {
  describe('CIT Calculator', () => {
    it('should apply Small Business Relief for revenue ≤ AED 375k', () => {
      const setupData = {
        businessInfo: {
          companyName: 'Test LLC',
          tradeLicenseNumber: 'CN-123456',
          emirate: 'Dubai',
          businessActivity: 'Trading',
        },
        revenueDeclaration: {
          expectedAnnualRevenue: 300000,
          revenueCategory: 'BELOW_375K' as const,
          businessModel: 'B2B' as const,
          hasInternationalSales: false,
        },
        freeZoneLicense: {
          licenseType: 'Mainland' as const,
          licenseNumber: 'ML-789',
          licenseIssueDate: '2024-01-01',
          licenseExpiryDate: '2025-12-31',
          isQFZP: false,
          docs: [],
        },
        trnUpload: {
          hasTRN: false,
          citRegistrationRequired: false,
          taxAgentAppointed: false,
        },
        summaryReview: {
          confirmFinancialYearEnd: '2024-12-31',
          wantsSmartReminders: true,
          agreeToTerms: true,
          readyToStart: true,
        },
      };

      const result = calculateTaxCategory(setupData);
      
      expect(result.citRate).toBe('0%');
      expect(result.category).toBe('Small Business Relief');
      expect(result.estimatedAnnualCIT).toBe(0);
    });

    it('should apply QFZP exemption for Free Zone businesses', () => {
      const setupData = {
        businessInfo: {
          companyName: 'FZ Trading LLC',
          tradeLicenseNumber: 'FZ-123456',
          emirate: 'Dubai',
          businessActivity: 'Trading',
        },
        revenueDeclaration: {
          expectedAnnualRevenue: 2000000,
          revenueCategory: 'BETWEEN_375K_3M' as const,
          businessModel: 'B2B' as const,
          hasInternationalSales: true,
        },
        freeZoneLicense: {
          licenseType: 'FreeZone' as const,
          freeZoneName: 'DIFC',
          licenseNumber: 'DIFC-789',
          licenseIssueDate: '2024-01-01',
          licenseExpiryDate: '2025-12-31',
          isQFZP: true,
          docs: [],
        },
        trnUpload: {
          hasTRN: true,
          trnNumber: '100123456789012',
          citRegistrationRequired: true,
          taxAgentAppointed: false,
        },
        summaryReview: {
          confirmFinancialYearEnd: '2024-12-31',
          wantsSmartReminders: true,
          agreeToTerms: true,
          readyToStart: true,
        },
      };

      const result = calculateTaxCategory(setupData);
      
      expect(result.citRate).toBe('0%');
      expect(result.category).toBe('Qualifying Free Zone Person (QFZP)');
      expect(result.estimatedAnnualCIT).toBe(0);
    });

    it('should apply partial Small Business Relief for revenue between 375k-3M', () => {
      const setupData = {
        businessInfo: {
          companyName: 'Medium Business LLC',
          tradeLicenseNumber: 'CN-654321',
          emirate: 'Abu Dhabi',
          businessActivity: 'Services',
        },
        revenueDeclaration: {
          expectedAnnualRevenue: 800000,
          revenueCategory: 'BETWEEN_375K_3M' as const,
          businessModel: 'B2C' as const,
          hasInternationalSales: false,
        },
        freeZoneLicense: {
          licenseType: 'Mainland' as const,
          licenseNumber: 'ML-456',
          licenseIssueDate: '2024-01-01',
          licenseExpiryDate: '2025-12-31',
          isQFZP: false,
          docs: [],
        },
        trnUpload: {
          hasTRN: true,
          trnNumber: '100987654321098',
          citRegistrationRequired: true,
          taxAgentAppointed: true,
          taxAgentName: 'Test Tax Agent',
          taxAgentLicense: 'TA-123',
        },
        summaryReview: {
          confirmFinancialYearEnd: '2024-12-31',
          wantsSmartReminders: true,
          agreeToTerms: true,
          readyToStart: true,
        },
      };

      const result = calculateTaxCategory(setupData);
      
      expect(result.citRate).toBe('0% (first AED 375k) + 9% (above)');
      expect(result.category).toBe('Partial Small Business Relief');
      // (800,000 - 375,000) * 0.09 = 38,250
      expect(result.estimatedAnnualCIT).toBe(38250);
    });
  });

  describe('VAT Calculator', () => {
    it('should calculate 5% VAT on eligible revenue', () => {
      const setupData = {
        businessInfo: {
          companyName: 'VAT Business LLC',
          tradeLicenseNumber: 'CN-111222',
          emirate: 'Dubai',
          businessActivity: 'Retail',
        },
        revenueDeclaration: {
          expectedAnnualRevenue: 1000000,
          revenueCategory: 'BETWEEN_375K_3M' as const,
          businessModel: 'B2C' as const,
          hasInternationalSales: false,
        },
        freeZoneLicense: {
          licenseType: 'Mainland' as const,
          licenseNumber: 'ML-333',
          licenseIssueDate: '2024-01-01',
          licenseExpiryDate: '2025-12-31',
          isQFZP: false,
          docs: [],
        },
        trnUpload: {
          hasTRN: true,
          trnNumber: '100555666777888',
          citRegistrationRequired: true,
          taxAgentAppointed: false,
        },
        summaryReview: {
          confirmFinancialYearEnd: '2024-12-31',
          wantsSmartReminders: true,
          agreeToTerms: true,
          readyToStart: true,
        },
      };

      const result = calculateTaxCategory(setupData);
      
      // 70% of revenue is VATable, 5% VAT
      // 1,000,000 * 0.7 * 0.05 = 35,000
      expect(result.estimatedAnnualVAT).toBe(35000);
    });

    it('should not apply VAT for revenue below threshold', () => {
      const setupData = {
        businessInfo: {
          companyName: 'Small Business LLC',
          tradeLicenseNumber: 'CN-999888',
          emirate: 'Sharjah',
          businessActivity: 'Consulting',
        },
        revenueDeclaration: {
          expectedAnnualRevenue: 200000,
          revenueCategory: 'BELOW_375K' as const,
          businessModel: 'B2B' as const,
          hasInternationalSales: false,
        },
        freeZoneLicense: {
          licenseType: 'Mainland' as const,
          licenseNumber: 'ML-777',
          licenseIssueDate: '2024-01-01',
          licenseExpiryDate: '2025-12-31',
          isQFZP: false,
          docs: [],
        },
        trnUpload: {
          hasTRN: false,
          citRegistrationRequired: false,
          taxAgentAppointed: false,
        },
        summaryReview: {
          confirmFinancialYearEnd: '2024-12-31',
          wantsSmartReminders: true,
          agreeToTerms: true,
          readyToStart: true,
        },
      };

      const result = calculateTaxCategory(setupData);
      
      expect(result.estimatedAnnualVAT).toBe(0);
    });
  });
});