import { CalculationResult, CalculationStep, CALCULATION_TYPES } from '../../shared/calculation-schemas';

export interface VATCalculationInputs {
  baseAmount: number;
  vatRate: number;
  isReverse: boolean;
  exemptions: number;
  currency: string;
  transactionType: 'SUPPLY' | 'IMPORT' | 'EXPORT';
  customerType: 'B2B' | 'B2C' | 'GOVERNMENT';
}

export interface CITCalculationInputs {
  revenue: number;
  allowableDeductions: number;
  capitalAllowances: number;
  previousLosses: number;
  isSmallBusiness: boolean;
  isQFZP: boolean;
  currency: string;
  taxYear: number;
}

/**
 * Enhanced tax calculation engine with detailed audit trail
 */
export class TaxCalculationEngine {

  /**
   * Calculate VAT with full breakdown
   */
  static calculateVAT(inputs: VATCalculationInputs): CalculationResult {
    const steps: CalculationStep[] = [];
    let currentAmount = inputs.baseAmount;
    let stepNumber = 1;

    // Step 1: Base amount validation
    steps.push({
      stepNumber: stepNumber++,
      description: 'Base amount validation and currency conversion',
      formula: 'Base Amount',
      inputs: { baseAmount: inputs.baseAmount, currency: inputs.currency },
      calculation: `Base amount: ${inputs.baseAmount} ${inputs.currency}`,
      result: currentAmount,
      currency: inputs.currency,
      notes: 'Initial transaction amount before VAT calculation',
      regulatoryReference: 'UAE VAT Law Article 10'
    });

    // Step 2: Apply exemptions
    if (inputs.exemptions > 0) {
      const exemptAmount = Math.min(inputs.exemptions, currentAmount);
      currentAmount -= exemptAmount;
      
      steps.push({
        stepNumber: stepNumber++,
        description: 'Apply VAT exemptions',
        formula: 'Taxable Amount = Base Amount - Exemptions',
        inputs: { baseAmount: inputs.baseAmount, exemptions: inputs.exemptions },
        calculation: `${inputs.baseAmount} - ${exemptAmount} = ${currentAmount}`,
        result: currentAmount,
        currency: inputs.currency,
        notes: 'Exempt supplies as per UAE VAT Law',
        regulatoryReference: 'UAE VAT Law Schedule 1'
      });
    }

    // Step 3: Determine VAT rate based on transaction type
    let applicableRate = inputs.vatRate;
    if (inputs.transactionType === 'EXPORT') {
      applicableRate = 0;
      steps.push({
        stepNumber: stepNumber++,
        description: 'Export transaction - Zero rate applied',
        formula: 'VAT Rate = 0% (Export)',
        inputs: { transactionType: inputs.transactionType },
        calculation: 'Export transactions are zero-rated',
        result: 0,
        currency: 'RATE',
        notes: 'Zero-rated supply as per UAE VAT regulations',
        regulatoryReference: 'UAE VAT Law Article 18'
      });
    } else if (inputs.customerType === 'GOVERNMENT' && inputs.transactionType === 'SUPPLY') {
      // Government entities may have special treatment
      steps.push({
        stepNumber: stepNumber++,
        description: 'Government customer validation',
        formula: 'Standard Rate Applied',
        inputs: { customerType: inputs.customerType, rate: applicableRate },
        calculation: `Government entity - Standard rate ${applicableRate}% applies`,
        result: applicableRate,
        currency: 'RATE',
        notes: 'Standard rate applies to government entities',
        regulatoryReference: 'UAE VAT Law Article 12'
      });
    }

    // Step 4: Calculate VAT amount
    const vatAmount = (currentAmount * applicableRate) / 100;
    steps.push({
      stepNumber: stepNumber++,
      description: 'VAT calculation',
      formula: 'VAT = Taxable Amount × VAT Rate',
      inputs: { taxableAmount: currentAmount, vatRate: applicableRate },
      calculation: `${currentAmount} × ${applicableRate}% = ${vatAmount}`,
      result: vatAmount,
      currency: inputs.currency,
      notes: `VAT calculated at ${applicableRate}% rate`,
      regulatoryReference: 'UAE VAT Law Article 10'
    });

    // Step 5: Reverse charge mechanism (if applicable)
    let finalVATAmount = vatAmount;
    if (inputs.isReverse && inputs.customerType === 'B2B') {
      finalVATAmount = 0;
      steps.push({
        stepNumber: stepNumber++,
        description: 'Reverse charge mechanism applied',
        formula: 'VAT Payable = 0 (Reverse Charge)',
        inputs: { originalVAT: vatAmount, reverseCharge: inputs.isReverse.toString() },
        calculation: `${vatAmount} → 0 (Customer pays VAT)`,
        result: 0,
        currency: inputs.currency,
        notes: 'VAT liability transferred to customer under reverse charge',
        regulatoryReference: 'UAE VAT Law Article 45'
      });
    }

    // Step 6: Final total calculation
    const totalAmount = inputs.baseAmount + finalVATAmount;
    steps.push({
      stepNumber: stepNumber++,
      description: 'Final total calculation',
      formula: 'Total = Base Amount + VAT',
      inputs: { baseAmount: inputs.baseAmount, vatAmount: finalVATAmount },
      calculation: `${inputs.baseAmount} + ${finalVATAmount} = ${totalAmount}`,
      result: totalAmount,
      currency: inputs.currency,
      notes: 'Final amount including VAT',
      regulatoryReference: 'UAE VAT Law Article 10'
    });

    return {
      totalAmount: finalVATAmount, // Return only the VAT amount
      currency: inputs.currency,
      breakdown: steps,
      method: 'UAE VAT Standard Calculation',
      regulatoryCompliance: {
        regulation: 'UAE VAT Law',
        reference: 'Federal Decree-Law No. 8 of 2017',
        compliance: true
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        calculatedBy: 0, // TODO: Get from context
        version: '2.0',
        inputs
      }
    };
  }

  /**
   * Calculate Corporate Income Tax with full breakdown
   */
  static calculateCIT(inputs: CITCalculationInputs): CalculationResult {
    const steps: CalculationStep[] = [];
    let stepNumber = 1;

    // Step 1: Revenue validation
    steps.push({
      stepNumber: stepNumber++,
      description: 'Total revenue for tax year',
      formula: 'Gross Revenue',
      inputs: { revenue: inputs.revenue, taxYear: inputs.taxYear },
      calculation: `Gross revenue: ${inputs.revenue} ${inputs.currency}`,
      result: inputs.revenue,
      currency: inputs.currency,
      notes: 'Total revenue for the tax year',
      regulatoryReference: 'UAE CIT Law Article 10'
    });

    // Step 2: Apply allowable deductions
    const netIncome = inputs.revenue - inputs.allowableDeductions;
    steps.push({
      stepNumber: stepNumber++,
      description: 'Apply allowable deductions',
      formula: 'Net Income = Revenue - Allowable Deductions',
      inputs: { revenue: inputs.revenue, deductions: inputs.allowableDeductions },
      calculation: `${inputs.revenue} - ${inputs.allowableDeductions} = ${netIncome}`,
      result: netIncome,
      currency: inputs.currency,
      notes: 'Deductions as per UAE CIT Law',
      regulatoryReference: 'UAE CIT Law Article 12-19'
    });

    // Step 3: Apply capital allowances
    const afterCapitalAllowances = netIncome - inputs.capitalAllowances;
    steps.push({
      stepNumber: stepNumber++,
      description: 'Apply capital allowances',
      formula: 'Adjusted Income = Net Income - Capital Allowances',
      inputs: { netIncome, capitalAllowances: inputs.capitalAllowances },
      calculation: `${netIncome} - ${inputs.capitalAllowances} = ${afterCapitalAllowances}`,
      result: afterCapitalAllowances,
      currency: inputs.currency,
      notes: 'Capital allowances on qualifying assets',
      regulatoryReference: 'UAE CIT Law Article 20-22'
    });

    // Step 4: Apply previous year losses
    const taxableIncome = Math.max(0, afterCapitalAllowances - inputs.previousLosses);
    if (inputs.previousLosses > 0) {
      steps.push({
        stepNumber: stepNumber++,
        description: 'Apply previous year losses',
        formula: 'Taxable Income = Adjusted Income - Previous Losses',
        inputs: { adjustedIncome: afterCapitalAllowances, previousLosses: inputs.previousLosses },
        calculation: `${afterCapitalAllowances} - ${inputs.previousLosses} = ${taxableIncome}`,
        result: taxableIncome,
        currency: inputs.currency,
        notes: 'Loss carry-forward from previous years',
        regulatoryReference: 'UAE CIT Law Article 28'
      });
    }

    // Step 5: Small Business Relief (if applicable)
    let applicableTaxableIncome = taxableIncome;
    if (inputs.isSmallBusiness && taxableIncome <= 3000000) {
      applicableTaxableIncome = Math.max(0, taxableIncome - 375000);
      steps.push({
        stepNumber: stepNumber++,
        description: 'Small Business Relief applied',
        formula: 'Taxable Income = Total Income - AED 375,000',
        inputs: { income: taxableIncome, relief: 375000 },
        calculation: `${taxableIncome} - 375,000 = ${applicableTaxableIncome}`,
        result: applicableTaxableIncome,
        currency: inputs.currency,
        notes: 'Small Business Relief (first AED 375,000 exempt)',
        regulatoryReference: 'UAE CIT Law Article 9'
      });
    }

    // Step 6: Determine tax rate
    let taxRate = 9; // Standard CIT rate
    if (inputs.isQFZP) {
      taxRate = 0;
      steps.push({
        stepNumber: stepNumber++,
        description: 'Qualifying Free Zone Person (QFZP) rate',
        formula: 'Tax Rate = 0% (QFZP)',
        inputs: { isQFZP: inputs.isQFZP.toString() },
        calculation: 'Qualifying Free Zone Person - 0% rate',
        result: 0,
        currency: 'RATE',
        notes: 'QFZP enjoys 0% CIT rate on qualifying income',
        regulatoryReference: 'UAE CIT Law Article 8'
      });
    } else {
      steps.push({
        stepNumber: stepNumber++,
        description: 'Standard CIT rate applied',
        formula: 'Tax Rate = 9%',
        inputs: { standardRate: 9 },
        calculation: 'Standard Corporate Income Tax rate',
        result: 9,
        currency: 'RATE',
        notes: 'Standard CIT rate for taxable persons',
        regulatoryReference: 'UAE CIT Law Article 8'
      });
    }

    // Step 7: Calculate final tax
    const finalTax = (applicableTaxableIncome * taxRate) / 100;
    steps.push({
      stepNumber: stepNumber++,
      description: 'Final CIT calculation',
      formula: 'CIT = Taxable Income × Tax Rate',
      inputs: { taxableIncome: applicableTaxableIncome, taxRate },
      calculation: `${applicableTaxableIncome} × ${taxRate}% = ${finalTax}`,
      result: finalTax,
      currency: inputs.currency,
      notes: `Final Corporate Income Tax liability`,
      regulatoryReference: 'UAE CIT Law Article 8'
    });

    return {
      totalAmount: finalTax,
      currency: inputs.currency,
      breakdown: steps,
      method: 'UAE CIT Standard Calculation',
      regulatoryCompliance: {
        regulation: 'UAE Corporate Income Tax Law',
        reference: 'Federal Decree-Law No. 47 of 2022',
        compliance: true
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        calculatedBy: 0, // TODO: Get from context
        version: '2.0',
        inputs
      }
    };
  }

  /**
   * Calculate withholding tax
   */
  static calculateWithholdingTax(
    amount: number,
    paymentType: string,
    recipientType: 'RESIDENT' | 'NON_RESIDENT',
    currency: string = 'AED'
  ): CalculationResult {
    const steps: CalculationStep[] = [];
    let stepNumber = 1;

    // Step 1: Payment amount
    steps.push({
      stepNumber: stepNumber++,
      description: 'Payment amount subject to withholding',
      formula: 'Payment Amount',
      inputs: { amount, paymentType },
      calculation: `Payment amount: ${amount} ${currency}`,
      result: amount,
      currency,
      notes: `${paymentType} payment to ${recipientType.toLowerCase()} entity`,
      regulatoryReference: 'UAE CIT Law Article 35'
    });

    // Step 2: Determine withholding rate
    let withholdingRate = 0;
    if (recipientType === 'NON_RESIDENT') {
      switch (paymentType) {
        case 'DIVIDENDS':
          withholdingRate = 0; // No withholding on dividends
          break;
        case 'INTEREST':
          withholdingRate = 0; // No withholding on interest (subject to conditions)
          break;
        case 'ROYALTIES':
          withholdingRate = 0; // No withholding on royalties (subject to conditions)
          break;
        case 'MANAGEMENT_FEES':
          withholdingRate = 0; // No withholding currently
          break;
        default:
          withholdingRate = 0;
      }
    }

    steps.push({
      stepNumber: stepNumber++,
      description: 'Withholding tax rate determination',
      formula: 'Withholding Rate',
      inputs: { paymentType, recipientType },
      calculation: `${paymentType} to ${recipientType}: ${withholdingRate}%`,
      result: withholdingRate,
      currency: 'RATE',
      notes: 'UAE currently has no withholding tax on most payments',
      regulatoryReference: 'UAE CIT Law Article 35'
    });

    // Step 3: Calculate withholding tax
    const withholdingTax = (amount * withholdingRate) / 100;
    steps.push({
      stepNumber: stepNumber++,
      description: 'Withholding tax calculation',
      formula: 'Withholding Tax = Payment Amount × Rate',
      inputs: { amount, withholdingRate },
      calculation: `${amount} × ${withholdingRate}% = ${withholdingTax}`,
      result: withholdingTax,
      currency,
      notes: 'Final withholding tax amount',
      regulatoryReference: 'UAE CIT Law Article 35'
    });

    return {
      totalAmount: withholdingTax,
      currency,
      breakdown: steps,
      method: 'UAE Withholding Tax Calculation',
      regulatoryCompliance: {
        regulation: 'UAE Corporate Income Tax Law',
        reference: 'Federal Decree-Law No. 47 of 2022 - Article 35',
        compliance: true
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        calculatedBy: 0,
        version: '1.0',
        inputs: { amount, paymentType, recipientType, currency }
      }
    };
  }

  /**
   * Validate calculation inputs
   */
  static validateInputs(calculationType: string, inputs: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (calculationType) {
      case CALCULATION_TYPES.VAT:
        const vatInputs = inputs as VATCalculationInputs;
        if (!vatInputs.baseAmount || vatInputs.baseAmount <= 0) {
          errors.push('Base amount must be greater than 0');
        }
        if (vatInputs.vatRate < 0 || vatInputs.vatRate > 100) {
          errors.push('VAT rate must be between 0 and 100');
        }
        if (!vatInputs.currency) {
          errors.push('Currency is required');
        }
        break;

      case CALCULATION_TYPES.CIT:
        const citInputs = inputs as CITCalculationInputs;
        if (!citInputs.revenue || citInputs.revenue < 0) {
          errors.push('Revenue must be 0 or greater');
        }
        if (citInputs.allowableDeductions < 0) {
          errors.push('Allowable deductions cannot be negative');
        }
        if (!citInputs.taxYear) {
          errors.push('Tax year is required');
        }
        break;

      default:
        errors.push('Unknown calculation type');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}