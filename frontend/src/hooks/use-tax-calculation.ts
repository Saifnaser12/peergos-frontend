import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface TaxCalculationRequest {
  type: 'CIT' | 'VAT';
  startDate?: string;
  endDate?: string;
  period?: string;
}

export interface TaxCalculationResult {
  type: 'CIT' | 'VAT';
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  taxableBase: number;
  taxOwed: number;
  taxRate: number;
  explanation: string;
  breakdown: {
    revenueCategories: Record<string, number>;
    expenseCategories: Record<string, number>;
    exemptions: Record<string, number>;
    deductions: Record<string, number>;
  };
  freeZoneStatus?: {
    isEligible: boolean;
    exemptAmount: number;
    explanation: string;
  };
  smallBusinessRelief?: {
    isEligible: boolean;
    exemptAmount: number;
    explanation: string;
  };
}

export function useTaxCalculation() {
  return useMutation({
    mutationFn: async (request: TaxCalculationRequest): Promise<TaxCalculationResult> => {
      const response = await apiRequest('/api/calculate-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Tax calculation failed');
      }

      return response.json();
    },
  });
}