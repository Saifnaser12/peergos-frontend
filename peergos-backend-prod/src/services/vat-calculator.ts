import { z } from 'zod';
import { db } from '../db';
import { calculationAuditTrail, taxCalculationBreakdown } from '../db/schema';

// UAE VAT Configuration - Centralized source of truth
export const UAEVATConfig = {
  STANDARD_RATE: 0.05, // 5%
  ZERO_RATE: 0.00,
  EXEMPT_RATE: null,
  REGISTRATION_THRESHOLD: 375000, // AED 375,000
  VOLUNTARY_THRESHOLD: 187500, // AED 187,500
  FILING_FREQUENCY: 'QUARTERLY',
  FILING_DEADLINE_DAYS: 28, // Days after quarter end
  RECORD_RETENTION_YEARS: 5
} as const;

// VAT Calculation Schema
export const VATCalculationInputSchema = z.object({
  companyId: z.number(),
  period: z.string(),
  transactions: z.array(z.object({
    id: z.number(),
    amount: z.number(),
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string(),
    date: z.string(),
    description: z.string(),
    vatRate: z.number().optional(),
    isVatExempt: z.boolean().default(false),
    isZeroRated: z.boolean().default(false),
  })),
  adjustments: z.object({
    badDebtRelief: z.number().default(0),
    adjustmentCorrections: z.number().default(0),
    capitalGoodsAdjustments: z.number().default(0),
  }).optional(),
});

export type VATCalculationInput = z.infer<typeof VATCalculationInputSchema>;

export interface VATCalculationResult {
  summary: {
    totalTaxableSupplies: number;
    totalZeroRatedSupplies: number;
    totalExemptSupplies: number;
    outputVAT: number;
    inputVAT: number;
    netVATDue: number;
    refundDue: number;
  };
  breakdown: VATCalculationBreakdown[];
  compliance: ComplianceCheck;
  auditTrail: AuditEntry[];
}

interface VATCalculationBreakdown {
  category: string;
  description: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  type: 'OUTPUT' | 'INPUT';
}

interface ComplianceCheck {
  isCompliant: boolean;
  warnings: string[];
  recommendations: string[];
  registrationRequired: boolean;
  filingFrequency: string;
  nextFilingDue: string;
}

interface AuditEntry {
  step: number;
  description: string;
  calculation: string;
  result: number;
  regulation: string;
}

export class VATCalculatorService {
  
  async calculateVAT(input: VATCalculationInput): Promise<VATCalculationResult> {
    // Validate input
    const validatedInput = VATCalculationInputSchema.parse(input);
    
    // Initialize calculation tracking
    const auditTrail: AuditEntry[] = [];
    const breakdown: VATCalculationBreakdown[] = [];
    
    // Step 1: Calculate Output VAT (VAT on sales/supplies)
    auditTrail.push({
      step: 1,
      description: 'Calculate Output VAT on taxable supplies',
      calculation: 'Sum of (Taxable Supply Amount × VAT Rate)',
      result: 0,
      regulation: 'UAE VAT Law Article 24'
    });

    let totalTaxableSupplies = 0;
    let totalZeroRatedSupplies = 0;
    let totalExemptSupplies = 0;
    let outputVAT = 0;

    const incomeTransactions = validatedInput.transactions.filter(t => t.type === 'INCOME');
    
    for (const transaction of incomeTransactions) {
      const vatRate = this.determineVATRate(transaction);
      const vatAmount = transaction.amount * vatRate;
      
      if (transaction.isVatExempt) {
        totalExemptSupplies += transaction.amount;
      } else if (transaction.isZeroRated || vatRate === 0) {
        totalZeroRatedSupplies += transaction.amount;
      } else {
        totalTaxableSupplies += transaction.amount;
        outputVAT += vatAmount;
      }

      breakdown.push({
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount,
        vatRate,
        vatAmount,
        type: 'OUTPUT'
      });
    }

    auditTrail[0].result = outputVAT;

    // Step 2: Calculate Input VAT (VAT on purchases/expenses)
    auditTrail.push({
      step: 2,
      description: 'Calculate recoverable Input VAT',
      calculation: 'Sum of (Business Expense Amount × VAT Rate)',
      result: 0,
      regulation: 'UAE VAT Law Article 53'
    });

    let inputVAT = 0;
    const expenseTransactions = validatedInput.transactions.filter(t => t.type === 'EXPENSE');
    
    for (const transaction of expenseTransactions) {
      const vatRate = this.determineVATRate(transaction);
      const isRecoverable = this.isInputVATRecoverable(transaction);
      
      if (isRecoverable) {
        const vatAmount = transaction.amount * vatRate;
        inputVAT += vatAmount;

        breakdown.push({
          category: transaction.category,
          description: transaction.description,
          amount: transaction.amount,
          vatRate,
          vatAmount,
          type: 'INPUT'
        });
      }
    }

    auditTrail[1].result = inputVAT;

    // Step 3: Apply adjustments
    const adjustments = validatedInput.adjustments || {};
    
    auditTrail.push({
      step: 3,
      description: 'Apply VAT adjustments and corrections',
      calculation: `Bad Debt Relief: ${adjustments.badDebtRelief}, Corrections: ${adjustments.adjustmentCorrections}`,
      result: adjustments.badDebtRelief + adjustments.adjustmentCorrections,
      regulation: 'UAE VAT Law Article 56'
    });

    // Step 4: Calculate net VAT position
    const netVATDue = Math.max(0, outputVAT - inputVAT + (adjustments.adjustmentCorrections || 0) - (adjustments.badDebtRelief || 0));
    const refundDue = Math.max(0, inputVAT - outputVAT - (adjustments.adjustmentCorrections || 0) + (adjustments.badDebtRelief || 0));

    auditTrail.push({
      step: 4,
      description: 'Calculate net VAT position',
      calculation: `Output VAT (${outputVAT}) - Input VAT (${inputVAT}) = ${netVATDue}`,
      result: netVATDue,
      regulation: 'UAE VAT Law Article 49'
    });

    // Step 5: Perform compliance checks
    const compliance = this.performComplianceChecks({
      totalTaxableSupplies,
      totalZeroRatedSupplies,
      totalExemptSupplies,
      outputVAT,
      inputVAT,
      netVATDue,
      companyId: validatedInput.companyId
    });

    // Save audit trail to database
    await this.saveAuditTrail(validatedInput.companyId, auditTrail, {
      totalTaxableSupplies,
      totalZeroRatedSupplies,
      totalExemptSupplies,
      outputVAT,
      inputVAT,
      netVATDue,
      refundDue
    });

    return {
      summary: {
        totalTaxableSupplies,
        totalZeroRatedSupplies,
        totalExemptSupplies,
        outputVAT,
        inputVAT,
        netVATDue,
        refundDue
      },
      breakdown,
      compliance,
      auditTrail
    };
  }

  private determineVATRate(transaction: any): number {
    // Determine VAT rate based on transaction category and UAE VAT rules
    if (transaction.isVatExempt) return 0;
    if (transaction.isZeroRated) return 0;
    if (transaction.vatRate !== undefined) return transaction.vatRate;

    // Default business logic for UAE VAT rates
    const exemptCategories = ['BANKING_SERVICES', 'INSURANCE', 'EDUCATION', 'HEALTHCARE_BASIC'];
    const zeroRatedCategories = ['EXPORTS', 'INTERNATIONAL_TRANSPORT', 'PRECIOUS_METALS'];
    
    if (exemptCategories.includes(transaction.category)) return 0;
    if (zeroRatedCategories.includes(transaction.category)) return 0;
    
    return UAEVATConfig.STANDARD_RATE; // 5% standard rate
  }

  private isInputVATRecoverable(transaction: any): boolean {
    // UAE rules for input VAT recovery
    const nonRecoverableCategories = [
      'ENTERTAINMENT',
      'PERSONAL_EXPENSES',
      'EXEMPT_SUPPLIES_RELATED'
    ];

    return !nonRecoverableCategories.includes(transaction.category);
  }

  private performComplianceChecks(summary: any): ComplianceCheck {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check VAT registration requirements
    const annualTaxableSupplies = summary.totalTaxableSupplies * 4; // Quarterly to annual
    const registrationRequired = annualTaxableSupplies > UAEVATConfig.REGISTRATION_THRESHOLD;

    if (annualTaxableSupplies > UAEVATConfig.VOLUNTARY_THRESHOLD && !registrationRequired) {
      recommendations.push('Consider voluntary VAT registration as you are approaching the mandatory threshold');
    }

    if (registrationRequired) {
      warnings.push('VAT registration is mandatory for your business turnover');
    }

    // Check for unusual patterns
    if (summary.inputVAT > summary.outputVAT * 2) {
      warnings.push('High input VAT relative to output VAT - ensure proper documentation');
    }

    if (summary.totalExemptSupplies > summary.totalTaxableSupplies) {
      recommendations.push('Review exempt supplies classification and input VAT recovery rules');
    }

    // Calculate next filing due date
    const now = new Date();
    const nextQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    const nextFilingDue = new Date(nextQuarter.getTime() + UAEVATConfig.FILING_DEADLINE_DAYS * 24 * 60 * 60 * 1000);

    return {
      isCompliant: warnings.length === 0,
      warnings,
      recommendations,
      registrationRequired,
      filingFrequency: UAEVATConfig.FILING_FREQUENCY,
      nextFilingDue: nextFilingDue.toISOString().split('T')[0]
    };
  }

  private async saveAuditTrail(companyId: number, auditTrail: AuditEntry[], summary: any) {
    try {
      // Save main audit record
      const auditRecord = await db.insert(calculationAuditTrail).values({
        companyId,
        userId: 1, // System user for calculations
        calculationType: 'VAT',
        calculationVersion: '1.0',
        inputData: { companyId, period: new Date().toISOString() },
        calculationSteps: auditTrail,
        finalResult: summary,
        methodUsed: 'UAE VAT Standard Calculation',
        regulatoryReference: 'UAE Federal Law No. 8 of 2017'
      }).returning();

      // Save detailed breakdown
      for (let i = 0; i < auditTrail.length; i++) {
        await db.insert(taxCalculationBreakdown).values({
          calculationId: auditRecord[0].id,
          stepNumber: i + 1,
          description: auditTrail[i].description,
          formula: auditTrail[i].calculation,
          inputs: {},
          calculation: auditTrail[i].calculation,
          result: auditTrail[i].result.toString(),
          regulatoryReference: auditTrail[i].regulation
        });
      }

      console.log(`[VAT Calculator] Saved audit trail for company ${companyId}`);
    } catch (error) {
      console.error('[VAT Calculator] Error saving audit trail:', error);
    }
  }

  // Utility methods for UAE VAT compliance
  static getVATRegistrationThreshold(): number {
    return UAEVATConfig.REGISTRATION_THRESHOLD;
  }

  static getStandardVATRate(): number {
    return UAEVATConfig.STANDARD_RATE;
  }

  static calculateQuarterlyFilingDueDate(quarterEndDate: Date): Date {
    return new Date(quarterEndDate.getTime() + UAEVATConfig.FILING_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
  }

  static isVATRegistrationRequired(annualTaxableSupplies: number): boolean {
    return annualTaxableSupplies > UAEVATConfig.REGISTRATION_THRESHOLD;
  }
}

export const vatCalculator = new VATCalculatorService();