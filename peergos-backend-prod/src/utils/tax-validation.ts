import { z } from 'zod';

// UAE Tax Validation Utilities
export class UAETaxValidation {
  
  // Validate UAE TRN (Tax Registration Number)
  static validateTRN(trn: string): { isValid: boolean; error?: string } {
    if (!trn) {
      return { isValid: false, error: 'TRN is required' };
    }
    
    // Remove any spaces or special characters
    const cleanTRN = trn.replace(/\D/g, '');
    
    if (cleanTRN.length !== 15) {
      return { isValid: false, error: 'TRN must be exactly 15 digits' };
    }
    
    if (!/^\d{15}$/.test(cleanTRN)) {
      return { isValid: false, error: 'TRN must contain only numbers' };
    }
    
    // UAE TRN checksum validation (simplified)
    const checksum = this.calculateTRNChecksum(cleanTRN);
    if (!checksum.isValid) {
      return { isValid: false, error: 'Invalid TRN checksum' };
    }
    
    return { isValid: true };
  }
  
  // Validate UAE business entity types
  static validateBusinessEntity(entityType: string): { isValid: boolean; error?: string } {
    const validEntityTypes = [
      'LLC', // Limited Liability Company
      'PJSC', // Public Joint Stock Company
      'PJSC', // Private Joint Stock Company
      'SP', // Sole Proprietorship
      'PARTNERSHIP',
      'BRANCH', // Foreign Company Branch
      'REP_OFFICE', // Representative Office
      'FZ_ENTITY', // Free Zone Entity
      'GOVERNMENT',
      'NGO' // Non-Governmental Organization
    ];
    
    if (!validEntityTypes.includes(entityType.toUpperCase())) {
      return { 
        isValid: false, 
        error: `Invalid business entity type. Must be one of: ${validEntityTypes.join(', ')}` 
      };
    }
    
    return { isValid: true };
  }
  
  // Validate Emirates (UAE States)
  static validateEmirate(emirate: string): { isValid: boolean; error?: string } {
    const validEmirates = [
      'ABU_DHABI',
      'DUBAI', 
      'SHARJAH',
      'AJMAN',
      'UMMAL_QUWAIN',
      'RAS_AL_KHAIMAH',
      'FUJAIRAH'
    ];
    
    if (!validEmirates.includes(emirate.toUpperCase())) {
      return { 
        isValid: false, 
        error: `Invalid emirate. Must be one of: ${validEmirates.join(', ')}` 
      };
    }
    
    return { isValid: true };
  }
  
  // Validate UAE free zones
  static validateFreeZone(freeZone: string): { isValid: boolean; isQualifyingFreeZone: boolean; error?: string } {
    const qualifyingFreeZones = [
      'ADGM', // Abu Dhabi Global Market
      'DIFC', // Dubai International Financial Centre
      'DMCC', // Dubai Multi Commodities Centre
      'JAFZA', // Jebel Ali Free Zone
      'SAIF_ZONE', // Sharjah Airport International Free Zone
      'RAKEZ', // Ras Al Khaimah Economic Zone
      'FUJAIRAH_FREE_ZONE',
      'ADCB_FREE_ZONE',
      'MASDAR_CITY'
    ];
    
    const allFreeZones = [
      ...qualifyingFreeZones,
      'EXPO_2020',
      'DUBAI_DESIGN_DISTRICT',
      'MEDIA_CITY',
      'INTERNET_CITY',
      'KNOWLEDGE_VILLAGE'
    ];
    
    if (!allFreeZones.includes(freeZone.toUpperCase())) {
      return { 
        isValid: false, 
        isQualifyingFreeZone: false,
        error: `Invalid free zone. Must be one of: ${allFreeZones.join(', ')}` 
      };
    }
    
    return { 
      isValid: true, 
      isQualifyingFreeZone: qualifyingFreeZones.includes(freeZone.toUpperCase()) 
    };
  }
  
  // Validate VAT registration requirements
  static validateVATRegistration(annualRevenue: number, voluntaryRegistration: boolean = false): {
    registrationRequired: boolean;
    eligible: boolean;
    threshold: number;
    message: string;
  } {
    const mandatoryThreshold = 375000; // AED 375,000
    const voluntaryThreshold = 187500; // AED 187,500
    
    if (annualRevenue >= mandatoryThreshold) {
      return {
        registrationRequired: true,
        eligible: true,
        threshold: mandatoryThreshold,
        message: 'VAT registration is mandatory'
      };
    }
    
    if (annualRevenue >= voluntaryThreshold) {
      return {
        registrationRequired: false,
        eligible: true,
        threshold: voluntaryThreshold,
        message: 'Eligible for voluntary VAT registration'
      };
    }
    
    return {
      registrationRequired: false,
      eligible: false,
      threshold: voluntaryThreshold,
      message: 'Not eligible for VAT registration'
    };
  }
  
  // Validate CIT thresholds
  static validateCITLiability(taxableIncome: number): {
    citLiable: boolean;
    rate: number;
    threshold: number;
    eligibleForSmallBusinessRelief: boolean;
    message: string;
  } {
    const citThreshold = 375000; // AED 375,000
    const smallBusinessThreshold = 3000000; // AED 3,000,000
    
    if (taxableIncome <= citThreshold) {
      return {
        citLiable: false,
        rate: 0,
        threshold: citThreshold,
        eligibleForSmallBusinessRelief: false,
        message: 'Below CIT threshold - no tax liability'
      };
    }
    
    if (taxableIncome <= smallBusinessThreshold) {
      return {
        citLiable: true,
        rate: 0, // 0% for small business relief
        threshold: citThreshold,
        eligibleForSmallBusinessRelief: true,
        message: 'Eligible for Small Business Relief - 0% CIT rate'
      };
    }
    
    return {
      citLiable: true,
      rate: 0.09, // 9% standard rate
      threshold: citThreshold,
      eligibleForSmallBusinessRelief: false,
      message: 'Standard CIT rate applies - 9%'
    };
  }
  
  // Validate tax period formats
  static validateTaxPeriod(period: string, type: 'VAT' | 'CIT'): { isValid: boolean; error?: string } {
    if (type === 'VAT') {
      // VAT periods: Q1-2024, Q2-2024, etc.
      const vatPeriodRegex = /^Q[1-4]-\d{4}$/;
      if (!vatPeriodRegex.test(period)) {
        return { 
          isValid: false, 
          error: 'VAT period must be in format Q1-2024, Q2-2024, etc.' 
        };
      }
    } else if (type === 'CIT') {
      // CIT periods: 2024, 2025, etc. (annual)
      const citPeriodRegex = /^\d{4}$/;
      if (!citPeriodRegex.test(period)) {
        return { 
          isValid: false, 
          error: 'CIT period must be a 4-digit year (e.g., 2024)' 
        };
      }
      
      const year = parseInt(period);
      const currentYear = new Date().getFullYear();
      if (year < 2018 || year > currentYear + 1) {
        return { 
          isValid: false, 
          error: `CIT year must be between 2018 and ${currentYear + 1}` 
        };
      }
    }
    
    return { isValid: true };
  }
  
  // Validate UAE accounting standards compliance
  static validateAccountingStandards(standard: string): { isValid: boolean; error?: string } {
    const validStandards = [
      'IFRS', // International Financial Reporting Standards
      'UAE_GAAP', // UAE Generally Accepted Accounting Principles
      'US_GAAP', // US Generally Accepted Accounting Principles (for certain entities)
      'AAOIFI' // For Islamic financial institutions
    ];
    
    if (!validStandards.includes(standard.toUpperCase())) {
      return { 
        isValid: false, 
        error: `Invalid accounting standard. Must be one of: ${validStandards.join(', ')}` 
      };
    }
    
    return { isValid: true };
  }
  
  // Validate filing deadlines
  static validateFilingDeadline(filingDate: Date, dueDate: Date, type: 'VAT' | 'CIT'): {
    isOnTime: boolean;
    daysLate: number;
    penaltyApplicable: boolean;
    message: string;
  } {
    const diffTime = filingDate.getTime() - dueDate.getTime();
    const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysLate <= 0) {
      return {
        isOnTime: true,
        daysLate: 0,
        penaltyApplicable: false,
        message: 'Filed on time'
      };
    }
    
    // UAE penalty structure
    let penaltyRate = 0;
    if (type === 'VAT') {
      penaltyRate = daysLate <= 30 ? 0.1 : 0.2; // 10% for first 30 days, 20% thereafter
    } else if (type === 'CIT') {
      penaltyRate = 0.1; // 10% for CIT late filing
    }
    
    return {
      isOnTime: false,
      daysLate,
      penaltyApplicable: true,
      message: `Filed ${daysLate} days late - ${penaltyRate * 100}% penalty applicable`
    };
  }
  
  // Calculate TRN checksum (simplified implementation)
  private static calculateTRNChecksum(trn: string): { isValid: boolean; checksum?: number } {
    // Simplified checksum validation
    // In real implementation, this would use UAE FTA's official algorithm
    const digits = trn.split('').map(Number);
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index + 1);
    }, 0);
    
    const checksum = sum % 97;
    
    // For demo purposes, consider valid if checksum is not 1
    return {
      isValid: checksum !== 1,
      checksum
    };
  }
}

// Zod schemas for validation
export const UAETRNSchema = z.string().refine(
  (trn) => UAETaxValidation.validateTRN(trn).isValid,
  {
    message: "Invalid UAE TRN format. Must be 15 digits."
  }
);

export const UAEBusinessEntitySchema = z.string().refine(
  (entity) => UAETaxValidation.validateBusinessEntity(entity).isValid,
  {
    message: "Invalid UAE business entity type."
  }
);

export const UAEEmirateSchema = z.string().refine(
  (emirate) => UAETaxValidation.validateEmirate(emirate).isValid,
  {
    message: "Invalid UAE emirate."
  }
);

export const UAEFreeZoneSchema = z.string().refine(
  (freeZone) => UAETaxValidation.validateFreeZone(freeZone).isValid,
  {
    message: "Invalid UAE free zone."
  }
);

export const UAETaxPeriodSchema = (type: 'VAT' | 'CIT') => 
  z.string().refine(
    (period) => UAETaxValidation.validateTaxPeriod(period, type).isValid,
    {
      message: `Invalid ${type} tax period format.`
    }
  );

export default UAETaxValidation;