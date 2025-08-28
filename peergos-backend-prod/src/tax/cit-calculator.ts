import * as z from 'zod';

// UAE CIT Configuration
export const UAE_CIT_RATE = 0.09; // 9%
export const SMALL_BUSINESS_RELIEF_THRESHOLD = 3000000; // AED 3M
export const QFZP_RATE = 0; // 0% for Qualifying Free Zone Person

export const CITCalculationSchema = z.object({
  taxableIncome: z.number().nonnegative(),
  isQFZP: z.boolean().default(false),
  isSmallBusiness: z.boolean().default(false)
});

export type CITCalculation = z.infer<typeof CITCalculationSchema>;

export interface CITResult {
  taxableIncome: number;
  citRate: number;
  citAmount: number;
  smallBusinessRelief: number;
  effectiveRate: number;
  description: string;
}

export function calculateCIT(input: CITCalculation): CITResult {
  const { taxableIncome, isQFZP, isSmallBusiness } = input;

  // QFZP pays 0% CIT
  if (isQFZP) {
    return {
      taxableIncome,
      citRate: QFZP_RATE,
      citAmount: 0,
      smallBusinessRelief: 0,
      effectiveRate: 0,
      description: 'Qualifying Free Zone Person - 0% CIT rate'
    };
  }

  // Small Business Relief (first AED 375,000 at 0%)
  if (isSmallBusiness && taxableIncome <= SMALL_BUSINESS_RELIEF_THRESHOLD) {
    const reliefAmount = Math.min(taxableIncome, 375000);
    const taxableAboveRelief = Math.max(0, taxableIncome - 375000);
    const citAmount = taxableAboveRelief * UAE_CIT_RATE;
    
    return {
      taxableIncome,
      citRate: UAE_CIT_RATE,
      citAmount: Math.round(citAmount * 100) / 100,
      smallBusinessRelief: reliefAmount,
      effectiveRate: taxableIncome > 0 ? (citAmount / taxableIncome) : 0,
      description: `Small Business Relief applied - first AED 375,000 at 0%, remainder at ${UAE_CIT_RATE * 100}%`
    };
  }

  // Standard CIT calculation
  const citAmount = taxableIncome * UAE_CIT_RATE;
  
  return {
    taxableIncome,
    citRate: UAE_CIT_RATE,
    citAmount: Math.round(citAmount * 100) / 100,
    smallBusinessRelief: 0,
    effectiveRate: UAE_CIT_RATE,
    description: `Standard CIT rate of ${UAE_CIT_RATE * 100}%`
  };
}