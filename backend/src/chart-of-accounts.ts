import { z } from 'zod';

export const VatCodeEnum = z.enum(['STANDARD', 'EXEMPT', 'BLOCKED', 'N/A']);
export type VatCode = z.infer<typeof VatCodeEnum>;

export interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  vatCode: VatCode;
  citDeductible: boolean;
  notes: string;
  qualifiesForQFZP: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const chartOfAccountSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  vatCode: VatCodeEnum,
  citDeductible: z.boolean(),
  notes: z.string(),
  qualifiesForQFZP: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Helper functions for tax calculations
export function getVatRate(vatCode: VatCode): number {
  switch (vatCode) {
    case 'STANDARD':
      return 0.05; // 5% UAE VAT
    case 'EXEMPT':
    case 'BLOCKED':
    case 'N/A':
      return 0;
    default:
      return 0;
  }
}

export function isCITDeductible(account: ChartOfAccount): boolean {
  return account.citDeductible;
}

export function getVatHint(vatCode: VatCode): string {
  switch (vatCode) {
    case 'STANDARD':
      return 'Standard VAT rate (5%) applies';
    case 'EXEMPT':
      return 'VAT-exempt - usually no input VAT is reclaimable';
    case 'BLOCKED':
      return 'Input VAT is blocked by FTA; will be set to 0';
    case 'N/A':
      return 'VAT not applicable for this expense type';
    default:
      return '';
  }
}

export function getCITHint(citDeductible: boolean): string {
  return citDeductible 
    ? 'Deductible for Corporate Income Tax'
    : 'Expense will be added back in the CIT computation';
}