/**
 * UAE Tax Rules and Rate Configuration
 * 
 * Centralized configuration for all UAE tax rates and thresholds.
 * These values can be updated from an Admin Panel in the future.
 */

export interface CITRules {
  exemptionThreshold: number;
  standardRate: number;
  freeZoneRate: number;
  smallBusinessReliefThreshold: number;
  freeZoneQualifyingThreshold: number;
  description: {
    exemption: string;
    smallBusinessRelief: string;
    freeZoneQualification: string;
  };
}

export interface VATRules {
  standardRate: number;
  registrationThreshold: number;
  zeroRatedCategories: string[];
  exemptCategories: string[];
  description: {
    standardRate: string;
    registrationRequirement: string;
    zeroRated: string;
    exempt: string;
  };
}

export interface TransferPricingRules {
  documentationThreshold: number;
  countryByCountryThreshold: number;
  masterFileThreshold: number;
  description: {
    documentation: string;
    countryByCountry: string;
    masterFile: string;
  };
}

export interface FreeZoneRules {
  qualifyingPersonThreshold: number;
  qualifyingIncomeRate: number;
  nonQualifyingIncomeRate: number;
  eligibilityRequirements: string[];
  description: {
    qualification: string;
    benefits: string;
    requirements: string;
  };
}

// UAE Corporate Income Tax Rules (Federal Decree-Law No. 47 of 2022)
export const UAE_CIT_RULES: CITRules = {
  exemptionThreshold: 375000, // AED 375,000 - Small Business Relief threshold
  standardRate: 0.09, // 9% standard CIT rate
  freeZoneRate: 0.0, // 0% for qualifying Free Zone persons
  smallBusinessReliefThreshold: 375000, // AED 375,000 - eligible for 0% rate
  freeZoneQualifyingThreshold: 3000000, // AED 3,000,000 - QFZP threshold
  description: {
    exemption: 'Small Business Relief: 0% CIT rate on taxable income up to AED 375,000',
    smallBusinessRelief: 'Businesses with taxable income ≤ AED 375,000 are eligible for 0% CIT rate',
    freeZoneQualification: 'Qualifying Free Zone Persons with qualifying income ≤ AED 3,000,000 are eligible for 0% rate'
  }
};

// UAE Value Added Tax Rules (Federal Law No. 8 of 2017)
export const UAE_VAT_RULES: VATRules = {
  standardRate: 0.05, // 5% standard VAT rate
  registrationThreshold: 375000, // AED 375,000 annual revenue threshold for mandatory registration
  zeroRatedCategories: [
    'exports', 
    'international_transport', 
    'precious_metals_investment_gold',
    'oil_gas_derivatives',
    'education_services',
    'healthcare_services',
    'residential_property_first_sale'
  ],
  exemptCategories: [
    'residential_rent',
    'life_insurance',
    'local_passenger_transport',
    'central_bank_services',
    'qualifying_goods_in_designated_zones'
  ],
  description: {
    standardRate: 'Standard VAT rate of 5% applies to most goods and services',
    registrationRequirement: 'Mandatory VAT registration required for businesses with annual revenue ≥ AED 375,000',
    zeroRated: 'Zero-rated supplies: VAT charged at 0%, input VAT recoverable',
    exempt: 'Exempt supplies: No VAT charged, input VAT not recoverable'
  }
};

// UAE Transfer Pricing Rules
export const UAE_TRANSFER_PRICING_RULES: TransferPricingRules = {
  documentationThreshold: 200000000, // AED 200 million - TP documentation threshold
  countryByCountryThreshold: 3150000000, // AED 3.15 billion - CbCR threshold
  masterFileThreshold: 3150000000, // AED 3.15 billion - Master File threshold
  description: {
    documentation: 'Transfer pricing documentation required for related party transactions ≥ AED 200 million',
    countryByCountry: 'Country-by-Country Reporting required for consolidated revenue ≥ AED 3.15 billion',
    masterFile: 'Master File and Local File required for consolidated revenue ≥ AED 3.15 billion'
  }
};

// UAE Free Zone Rules (Qualifying Free Zone Person - QFZP)
export const UAE_FREE_ZONE_RULES: FreeZoneRules = {
  qualifyingPersonThreshold: 3000000, // AED 3 million - QFZP qualifying income threshold
  qualifyingIncomeRate: 0.0, // 0% CIT rate on qualifying income
  nonQualifyingIncomeRate: 0.09, // 9% CIT rate on non-qualifying income
  eligibilityRequirements: [
    'Must be a Free Zone Person',
    'Must have adequate substance in the UAE',
    'Qualifying income must not exceed AED 3 million',
    'Must comply with arm\'s length principle for related party transactions',
    'Must maintain proper books and records'
  ],
  description: {
    qualification: 'Free Zone Persons with qualifying income ≤ AED 3 million eligible for 0% CIT rate',
    benefits: '0% CIT rate on qualifying income, subject to substance and compliance requirements',
    requirements: 'Must meet substance requirements and maintain arm\'s length pricing for related party transactions'
  }
};

// Consolidated tax configuration for easy access
export const UAE_TAX_CONFIG = {
  CIT: UAE_CIT_RULES,
  VAT: UAE_VAT_RULES,
  TRANSFER_PRICING: UAE_TRANSFER_PRICING_RULES,
  FREE_ZONE: UAE_FREE_ZONE_RULES,
  
  // Helper functions for common calculations
  calculateCITRate: (income: number, isFreeZone: boolean = false, isQFZP: boolean = false): number => {
    if (isFreeZone && isQFZP && income <= UAE_FREE_ZONE_RULES.qualifyingPersonThreshold) {
      return UAE_FREE_ZONE_RULES.qualifyingIncomeRate;
    }
    if (income <= UAE_CIT_RULES.smallBusinessReliefThreshold) {
      return 0; // Small Business Relief
    }
    return UAE_CIT_RULES.standardRate;
  },

  calculateVATRate: (category: string): number => {
    if (UAE_VAT_RULES.zeroRatedCategories.includes(category)) {
      return 0;
    }
    if (UAE_VAT_RULES.exemptCategories.includes(category)) {
      return 0; // Exempt (but different treatment for input VAT)
    }
    return UAE_VAT_RULES.standardRate;
  },

  isVATRegistrationRequired: (annualRevenue: number): boolean => {
    return annualRevenue >= UAE_VAT_RULES.registrationThreshold;
  },

  isTransferPricingDocumentationRequired: (transactionValue: number): boolean => {
    return transactionValue >= UAE_TRANSFER_PRICING_RULES.documentationThreshold;
  }
};

// Tax year configuration
export const UAE_TAX_YEAR_CONFIG = {
  CIT: {
    filingDeadline: 9, // 9 months after fiscal year end
    paymentDeadline: 9, // 9 months after fiscal year end
    fiscalYearEnd: 'December 31', // Default fiscal year end
    extensionPeriod: 6 // 6 months extension available
  },
  VAT: {
    filingDeadline: 28, // 28th day of the month following the tax period
    paymentDeadline: 28, // Same as filing deadline
    returnPeriod: 'monthly', // Monthly returns (can be quarterly for some)
    penaltyRate: 0.05 // 5% penalty for late filing
  }
};

// FTA contact and regulatory information
export const UAE_FTA_CONFIG = {
  website: 'https://tax.gov.ae',
  helpdesk: '+971 600 56 5656',
  email: 'info@tax.gov.ae',
  address: 'Federal Tax Authority, Dubai, UAE',
  businessHours: 'Sunday to Thursday, 7:30 AM to 3:30 PM',
  
  // Regulatory references
  regulations: {
    CIT: 'Federal Decree-Law No. 47 of 2022 on the Taxation of Corporations and Businesses',
    VAT: 'Federal Law No. 8 of 2017 on Value Added Tax',
    transferPricing: 'Cabinet Decision No. 85 of 2022 on Transfer Pricing Rules',
    freeZone: 'Cabinet Decision No. 86 of 2022 on Free Zone Persons'
  }
};

export default UAE_TAX_CONFIG;