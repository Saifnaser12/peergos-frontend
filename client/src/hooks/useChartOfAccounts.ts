import { useQuery } from '@tanstack/react-query';
import type { ChartOfAccount } from '@shared/chart-of-accounts';

export function useChartOfAccounts() {
  return useQuery({
    queryKey: ['/api/chart-of-accounts'],
    queryFn: async (): Promise<ChartOfAccount[]> => {
      const response = await fetch('/api/chart-of-accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch chart of accounts');
      }
      return response.json();
    },
  });
}

export function useAccountByCode(code: string | undefined) {
  return useQuery({
    queryKey: ['/api/chart-of-accounts', code],
    queryFn: async (): Promise<ChartOfAccount> => {
      if (!code) throw new Error('Account code is required');
      
      const response = await fetch(`/api/chart-of-accounts/${code}`);
      if (!response.ok) {
        throw new Error('Failed to fetch account');
      }
      return response.json();
    },
    enabled: !!code,
  });
}