// Enhanced UAE VAT calculation utilities with comprehensive FTA compliance
import { z } from 'zod';

// UAE VAT rates as per Federal Decree-Law No. 8 of 2017 and Cabinet Resolution No. 52 of 2017
export const UAE_VAT_RATES = {
  STANDARD: 0.05, // 5% - Standard rate applicable to most goods and services
  ZERO: 0.00,     // 0% - Zero-rated supplies (exports, international transport, etc.)
  EXEMPT: null,   // No VAT applicable (financial services, residential rent, etc.)
} as const;

// UAE VAT supply types with detailed descriptions and compliance rules
export const UAE_SUPPLY_TYPES = {
  STANDARD: {
    rate: UAE_VAT_RATES.STANDARD,
    description: 'Standard-rated supplies subject to 5% VAT',
    examples: [
      'Most goods and services',
      'Commercial rent and leasing',
      'Professional and consulting services',
      'Restaurant meals and catering',
      'Hotel accommodation',
      'Telecommunications services',
      'Construction services'
    ],
    vatRecovery: 'Full input VAT recovery available',
    ftaGuidance: 'VAT Guide VATGD-01 Section 4.1 - Standard Rate Supplies',
    calculationMethod: 'Supply Value × 5% = VAT Amount'
  },
  ZERO_RATED: {
    rate: UAE_VAT_RATES.ZERO,
    description: 'Zero-rated supplies with 0% VAT but eligible for input VAT recovery',
    examples: [
      'Exports of goods outside GCC',
      'International transport services',
      'Investment grade precious metals (gold, silver, platinum)',
      'Aircraft and vessels for qualifying commercial use',
      'Oil and gas exports',
      'International supply of services'
    ],
    vatRecovery: 'Full input VAT recovery available',
    ftaGuidance: 'VAT Guide VATGD-01 Section 4.2 - Zero-Rated Supplies',
    calculationMethod: 'Supply Value × 0% = AED 0 VAT'
  },
  EXEMPT: {
    rate: UAE_VAT_RATES.EXEMPT,
    description: 'Exempt supplies with no VAT charged and limited input VAT recovery',
    examples: [
      'Financial services (banking, insurance)',
      'Residential property rent and sales',
      'Life insurance premiums',
      'Local passenger transport',
      'Educational services',
      'Healthcare services',
      'Bare land sales'
    ],
    vatRecovery: 'No input VAT recovery (subject to partial exemption rules)',
    ftaGuidance: 'VAT Guide VATGD-01 Section 4.3 - Exempt Supplies',
    calculationMethod: 'No VAT charged - input VAT apportionment required'
  },
  REVERSE_CHARGE: {
    rate: UAE_VAT_RATES.STANDARD,
    description: 'Reverse charge mechanism - recipient liable for VAT',
    examples: [
      'Digital services from non-GCC suppliers',
      'Imported services for business use',
      'Intra-GCC B2B supplies (specific conditions)',
      'Telecommunications services from abroad'
    ],
    vatRecovery: 'Self-assess both output and input VAT if business use',
    ftaGuidance: 'VAT Guide VATGD-01 Section 4.4 - Reverse Charge Mechanism',
    calculationMethod: 'Recipient calculates 5% VAT on service value'
  }
} as const;

// Input VAT recovery rules as per UAE VAT Law Articles 53-55
export const INPUT_VAT_RECOVERY_RULES = {
  FULLY_TAXABLE: {
    recoveryRate: 1.0,
    description: 'Full input VAT recovery for businesses making only taxable supplies',
    conditions: 'All supplies are either standard-rated or zero-rated',
    calculationMethod: 'Total Input VAT × 100% = Recoverable Amount'
  },
  PARTIALLY_EXEMPT: {
    recoveryRate: 'calculated', // Based on proportion of taxable supplies
    description: 'Partial recovery based on ratio of taxable to total supplies',
    conditions: 'Business makes both taxable and exempt supplies',
    calculationMethod: 'Input VAT × (Taxable Supplies ÷ Total Supplies) = Recoverable Amount',
    deMinimisLimit: 50000, // AED 50,000 annual limit for exempt supplies
    threshold: 0.05 // 5% threshold for partial exemption
  },
  FULLY_EXEMPT: {
    recoveryRate: 0.0,
    description: 'No input VAT recovery for businesses making only exempt supplies',
    conditions: 'All supplies are exempt from VAT',
    calculationMethod: 'No input VAT recovery available'
  },
  CAPITAL_GOODS: {
    description: 'Special rules for capital goods over AED 50,000',
    threshold: 50000,
    adjustmentPeriod: 5, // 5 years adjustment period
    calculationMethod: 'Annual adjustment based on actual use for taxable supplies'
  }
} as const;

// Enhanced VAT validation schema with comprehensive UAE compliance checks
export const enhancedVATValidationSchema = z.object({
  // Standard-rated supplies validation
  standardRatedSupplies: z.object({
    totalValue: z.number().min(0, 'Supply value cannot be negative'),
    vatAmount: z.number().min(0, 'VAT amount cannot be negative'),
  }).refine((data) => {
    const expectedVAT = Math.round(data.totalValue * UAE_VAT_RATES.STANDARD * 100) / 100;
    return Math.abs(data.vatAmount - expectedVAT) <= 0.01;
  }, {
    message: 'Standard-rated VAT must be exactly 5% of supply value',
    path: ['vatAmount']
  }),

  // Zero-rated supplies validation
  zeroRatedSupplies: z.object({
    totalValue: z.number().min(0, 'Supply value cannot be negative'),
    vatAmount: z.literal(0, { errorMap: () => ({ message: 'Zero-rated supplies must have 0 VAT' }) }),
  }),

  // Exempt supplies validation
  exemptSupplies: z.object({
    totalValue: z.number().min(0, 'Supply value cannot be negative'),
    vatAmount: z.literal(0, { errorMap: () => ({ message: 'Exempt supplies must have 0 VAT' }) }),
  }),

  // Reverse charge validation
  reverseChargeSupplies: z.object({
    totalValue: z.number().min(0, 'Supply value cannot be negative'),
    vatAmount: z.number().min(0, 'VAT amount cannot be negative'),
  }).refine((data) => {
    if (data.totalValue > 0) {
      const expectedVAT = Math.round(data.totalValue * UAE_VAT_RATES.STANDARD * 100) / 100;
      return Math.abs(data.vatAmount - expectedVAT) <= 0.01;
    }
    return data.vatAmount === 0;
  }, {
    message: 'Reverse charge VAT must be exactly 5% of supply value when applicable',
    path: ['vatAmount']
  }),

  // Input VAT validation
  inputVAT: z.object({
    standardRatedPurchases: z.number().min(0, 'Input VAT cannot be negative'),
    capitalGoods: z.number().min(0, 'Capital goods VAT cannot be negative'),
    corrections: z.number().default(0),
    totalClaimable: z.number().min(0, 'Total claimable VAT cannot be negative'),
  }).refine((data) => {
    const calculatedTotal = data.standardRatedPurchases + data.capitalGoods + data.corrections;
    return Math.abs(data.totalClaimable - calculatedTotal) <= 0.01;
  }, {
    message: 'Total claimable input VAT must equal sum of all input VAT components',
    path: ['totalClaimable']
  }),

  // Period validation
  period: z.object({
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
    returnPeriod: z.string().regex(/^\d{4}-(Q[1-4]|M(0[1-9]|1[0-2]))$/, 'Invalid return period format'),
  }).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }, {
    message: 'End date must be after or equal to start date',
    path: ['endDate']
  }),
});

// Enhanced VAT calculation class with comprehensive UAE compliance
export class EnhancedVATProcessor {
  
  // Calculate VAT with detailed breakdown and explanations
  static calculateVATWithBreakdown(supplies: any[], purchases: any[], period: { start: string; end: string }) {
    const breakdown = {
      calculations: {
        standardRated: {
          description: 'Standard-rated supplies (5% VAT)',
          supplies: supplies.filter(s => s.supplyType === 'standard'),
          totalValue: 0,
          vatAmount: 0,
          calculationMethod: 'Supply Value × 5%',
          ftaReference: 'Article 26 of VAT Law'
        },
        zeroRated: {
          description: 'Zero-rated supplies (0% VAT)',
          supplies: supplies.filter(s => s.supplyType === 'zero-rated'),
          totalValue: 0,
          vatAmount: 0,
          calculationMethod: 'Supply Value × 0%',
          ftaReference: 'Schedule 1 of VAT Law'
        },
        exempt: {
          description: 'Exempt supplies (No VAT)',
          supplies: supplies.filter(s => s.supplyType === 'exempt'),
          totalValue: 0,
          vatAmount: 0,
          calculationMethod: 'No VAT applicable',
          ftaReference: 'Schedule 2 of VAT Law'
        },
        reverseCharge: {
          description: 'Reverse charge supplies',
          supplies: supplies.filter(s => s.supplyType === 'reverse-charge'),
          totalValue: 0,
          vatAmount: 0,
          calculationMethod: 'Recipient liable for VAT',
          ftaReference: 'Article 46 of VAT Law'
        }
      },
      inputVAT: {
        description: 'Input VAT recovery calculation',
        standardPurchases: purchases.filter(p => p.category === 'standard' && p.claimable),
        capitalGoods: purchases.filter(p => p.category === 'capital-goods' && p.claimable),
        totalRecoverable: 0,
        calculationMethod: 'Based on taxable supply ratio',
        ftaReference: 'Articles 53-55 of VAT Law'
      },
      netPosition: {
        outputVAT: 0,
        inputVAT: 0,
        netVATDue: 0,
        isRefundDue: false,
        calculationMethod: 'Output VAT - Input VAT',
        explanation: ''
      },
      complianceChecks: {
        validationErrors: [],
        warnings: [],
        recommendations: []
      }
    };

    // Calculate each category
    Object.keys(breakdown.calculations).forEach(category => {
      const calc = breakdown.calculations[category as keyof typeof breakdown.calculations];
      calc.totalValue = calc.supplies.reduce((sum: number, s: any) => sum + (s.supplyValue || 0), 0);
      
      if (category === 'standardRated' || category === 'reverseCharge') {
        calc.vatAmount = Math.round(calc.totalValue * UAE_VAT_RATES.STANDARD * 100) / 100;
      } else {
        calc.vatAmount = 0;
      }
    });

    // Calculate input VAT
    breakdown.inputVAT.totalRecoverable = [
      ...breakdown.inputVAT.standardPurchases,
      ...breakdown.inputVAT.capitalGoods
    ].reduce((sum, p) => sum + (p.vatAmount || 0), 0);

    // Calculate net position
    breakdown.netPosition.outputVAT = Object.values(breakdown.calculations)
      .reduce((sum, calc) => sum + calc.vatAmount, 0);
    breakdown.netPosition.inputVAT = breakdown.inputVAT.totalRecoverable;
    breakdown.netPosition.netVATDue = breakdown.netPosition.outputVAT - breakdown.netPosition.inputVAT;
    breakdown.netPosition.isRefundDue = breakdown.netPosition.netVATDue < 0;
    
    breakdown.netPosition.explanation = breakdown.netPosition.isRefundDue
      ? `Refund of AED ${Math.abs(breakdown.netPosition.netVATDue).toFixed(2)} due`
      : `Payment of AED ${breakdown.netPosition.netVATDue.toFixed(2)} due`;

    // Compliance checks
    this.performComplianceChecks(breakdown);

    return breakdown;
  }

  // Perform comprehensive compliance validation
  private static performComplianceChecks(breakdown: any) {
    const { complianceChecks, calculations, netPosition } = breakdown;

    // Check VAT calculation accuracy
    Object.keys(calculations).forEach(category => {
      const calc = calculations[category];
      if (category === 'standardRated' && calc.totalValue > 0) {
        const expectedVAT = Math.round(calc.totalValue * 0.05 * 100) / 100;
        if (Math.abs(calc.vatAmount - expectedVAT) > 0.01) {
          complianceChecks.validationErrors.push(
            `${calc.description}: VAT amount (${calc.vatAmount}) should be exactly 5% of supply value (${expectedVAT})`
          );
        }
      }
    });

    // Check for suspicious patterns
    if (calculations.exempt.totalValue > 50000) {
      complianceChecks.warnings.push(
        'Exempt supplies exceed AED 50,000 - partial exemption rules may apply'
      );
    }

    if (netPosition.netVATDue < -10000) {
      complianceChecks.warnings.push(
        'Large VAT refund claimed - ensure proper documentation is available'
      );
    }

    // Provide recommendations
    if (calculations.zeroRated.totalValue > 0) {
      complianceChecks.recommendations.push(
        'Ensure zero-rated supplies meet FTA conditions and proper export documentation is maintained'
      );
    }

    if (calculations.reverseCharge.totalValue > 0) {
      complianceChecks.recommendations.push(
        'Verify reverse charge applies and corresponding input VAT is correctly claimed'
      );
    }
  }

  // Generate detailed explanation tooltips for each field
  static getFieldExplanations() {
    return {
      standardRatedSupplies: {
        title: 'Standard-Rated Supplies (5% VAT)',
        explanation: 'Most goods and services supplied in the UAE are subject to 5% VAT. This includes commercial activities, professional services, and goods sold to end consumers.',
        calculation: 'Supply Value × 5% = VAT Amount',
        example: 'AED 1,000 service fee × 5% = AED 50 VAT',
        ftaGuidance: 'Refer to VAT Guide VATGD-01 Section 4.1'
      },
      zeroRatedSupplies: {
        title: 'Zero-Rated Supplies (0% VAT)',
        explanation: 'Specific supplies that are taxable but charged at 0% VAT rate. Input VAT can still be recovered for these supplies.',
        calculation: 'Supply Value × 0% = AED 0 VAT',
        example: 'AED 10,000 export sale × 0% = AED 0 VAT',
        ftaGuidance: 'Refer to Schedule 1 of UAE VAT Law'
      },
      exemptSupplies: {
        title: 'Exempt Supplies (No VAT)',
        explanation: 'Supplies outside the scope of VAT. No VAT is charged and input VAT recovery is restricted under partial exemption rules.',
        calculation: 'No VAT charged - affects input VAT recovery',
        example: 'Residential rent - no VAT but limits input VAT claims',
        ftaGuidance: 'Refer to Schedule 2 of UAE VAT Law'
      },
      reverseCharge: {
        title: 'Reverse Charge Mechanism',
        explanation: 'For certain imported services, the recipient (not supplier) is liable for VAT. Common for digital services from abroad.',
        calculation: 'Recipient calculates 5% VAT on service value',
        example: 'AED 2,000 digital service × 5% = AED 100 VAT liability',
        ftaGuidance: 'Refer to Article 46 of UAE VAT Law'
      },
      inputVAT: {
        title: 'Input VAT Recovery',
        explanation: 'VAT paid on business purchases that can be recovered, subject to use for taxable supplies and documentation requirements.',
        calculation: 'Based on proportion of taxable supplies',
        example: 'If 80% taxable supplies, recover 80% of input VAT',
        ftaGuidance: 'Refer to Articles 53-55 of UAE VAT Law'
      }
    };
  }

  // Validate return completeness and accuracy
  static validateReturnCompleteness(data: any) {
    const validation = {
      isComplete: true,
      missingFields: [],
      calculationErrors: [],
      recommendations: []
    };

    // Check required fields
    const requiredFields = [
      'standardRatedSupplies.totalValue',
      'standardRatedSupplies.vatAmount',
      'inputVAT.totalClaimable'
    ];

    requiredFields.forEach(field => {
      const keys = field.split('.');
      let value = data;
      for (const key of keys) {
        value = value?.[key];
      }
      if (value === undefined || value === null) {
        validation.missingFields.push(field);
        validation.isComplete = false;
      }
    });

    // Validate calculations
    if (data.standardRatedSupplies?.totalValue && data.standardRatedSupplies?.vatAmount) {
      const expectedVAT = Math.round(data.standardRatedSupplies.totalValue * 0.05 * 100) / 100;
      if (Math.abs(data.standardRatedSupplies.vatAmount - expectedVAT) > 0.01) {
        validation.calculationErrors.push(
          `Standard VAT should be ${expectedVAT}, but ${data.standardRatedSupplies.vatAmount} was entered`
        );
      }
    }

    return validation;
  }
}

// Export enhanced types for use throughout the application
export type EnhancedVATCalculation = ReturnType<typeof EnhancedVATProcessor.calculateVATWithBreakdown>;
export type VATFieldExplanations = ReturnType<typeof EnhancedVATProcessor.getFieldExplanations>;
export type VATValidationResult = ReturnType<typeof EnhancedVATProcessor.validateReturnCompleteness>;