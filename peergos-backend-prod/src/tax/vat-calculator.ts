import * as z from 'zod';

// UAE VAT Configuration
export const UAE_VAT_RATE = 0.05; // 5%
export const VAT_REGISTRATION_THRESHOLD = 375000; // AED

export const VATCalculationSchema = z.object({
  amount: z.number().positive(),
  isVATInclusive: z.boolean().default(false),
  vatRate: z.number().default(UAE_VAT_RATE)
});

export type VATCalculation = z.infer<typeof VATCalculationSchema>;

export interface VATResult {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
}

export function calculateVAT(input: VATCalculation): VATResult {
  const { amount, isVATInclusive, vatRate } = input;

  if (isVATInclusive) {
    // Amount includes VAT - extract VAT
    const grossAmount = amount;
    const netAmount = amount / (1 + vatRate);
    const vatAmount = grossAmount - netAmount;

    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100,
      vatRate
    };
  } else {
    // Amount excludes VAT - add VAT
    const netAmount = amount;
    const vatAmount = amount * vatRate;
    const grossAmount = netAmount + vatAmount;

    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100,
      vatRate
    };
  }
}