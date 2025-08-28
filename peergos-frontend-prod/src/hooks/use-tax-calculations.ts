import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { VatCalculation, CitCalculation } from '../types';

export function useVatCalculation() {
  return useMutation({
    mutationFn: async (params: {
      transactions: any[];
      period: string;
    }): Promise<VatCalculation> => {
      const response = await apiRequest('POST', '/api/tax/calculate-vat', params);
      return response.json();
    },
  });
}

export function useCitCalculation() {
  return useMutation({
    mutationFn: async (params: {
      revenue: number;
      expenses: number;
      freeZone: boolean;
      eligibleIncome: number;
    }): Promise<CitCalculation> => {
      const response = await apiRequest('POST', '/api/tax/calculate-cit', params);
      return response.json();
    },
  });
}
