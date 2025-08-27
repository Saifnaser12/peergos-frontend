import { useCallback } from 'react';
import { useDataSync } from '@/context/data-sync-context';
import { useQuery } from '@tanstack/react-query';

interface UseCrossModuleDataOptions {
  module?: string;
  autoSync?: boolean;
  syncInterval?: number;
}

export function useCrossModuleData(options: UseCrossModuleDataOptions = {}) {
  const { 
    crossModuleData, 
    syncData, 
    syncState, 
    updateModuleData, 
    isDataStale,
    getValidationErrors,
    validateDataConsistency
  } = useDataSync();

  const { module, autoSync = true, syncInterval = 60000 } = options;

  // Auto-populate VAT calculations from transactions
  const populateVATFromTransactions = useCallback(async () => {
    if (!crossModuleData?.transactions) return null;

    const vatableTransactions = crossModuleData.transactions.filter(
      (t: any) => !t.vatExempt && !t.freeZoneTransaction
    );

    const vatCalculation = {
      totalVATCollected: vatableTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + (t.amount * 0.05), 0),
      
      totalVATInput: vatableTransactions
        .filter((t: any) => t.type === 'expense' && t.hasValidVATInvoice)
        .reduce((sum: number, t: any) => sum + (t.amount * 0.05), 0),
      
      period: new Date().toISOString().substring(0, 7),
      calculatedAt: new Date().toISOString()
    };

    vatCalculation.netVATLiability = vatCalculation.totalVATCollected - vatCalculation.totalVATInput;

    // Update VAT module with calculated data
    await updateModuleData('vat-calculations', vatCalculation);
    return vatCalculation;
  }, [crossModuleData, updateModuleData]);

  // Auto-populate CIT calculations from bookkeeping data  
  const populateCITFromBookkeeping = useCallback(async () => {
    if (!crossModuleData?.transactions || !crossModuleData?.company) return null;

    const currentYear = new Date().getFullYear();
    const yearTransactions = crossModuleData.transactions.filter(
      (t: any) => new Date(t.date).getFullYear() === currentYear
    );

    const totalIncome = yearTransactions
      .filter((t: any) => t.type === 'income' && !t.freeZoneTransaction)
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const deductibleExpenses = yearTransactions
      .filter((t: any) => t.type === 'expense' && t.citDeductible)
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);
    const smallBusinessThreshold = 3000000; // AED 3M
    const isEligibleForSBR = totalIncome <= smallBusinessThreshold && !crossModuleData.company.freeZone;

    const citCalculation = {
      totalIncome,
      deductibleExpenses,
      taxableIncome,
      citLiability: isEligibleForSBR ? 0 : taxableIncome * 0.09,
      citRate: 0.09,
      isEligibleForSBR,
      smallBusinessThreshold,
      year: currentYear,
      calculatedAt: new Date().toISOString()
    };

    // Update CIT module with calculated data
    await updateModuleData('cit-calculations', citCalculation);
    return citCalculation;
  }, [crossModuleData, updateModuleData]);

  // Sync company settings across modules
  const syncCompanySettings = useCallback(async () => {
    if (!crossModuleData?.company) return;

    const modules = ['vat-calculations', 'cit-calculations', 'reports', 'tax-settings'];
    await syncData(modules);
  }, [crossModuleData, syncData]);

  // Check for data staleness
  const checkDataFreshness = useCallback(() => {
    if (!module) return { isStale: false, lastUpdate: null };

    return {
      isStale: isDataStale(module),
      lastUpdate: syncState.lastUpdated[module] || null
    };
  }, [module, isDataStale, syncState.lastUpdated]);

  // Get module-specific validation errors
  const getModuleValidationErrors = useCallback(() => {
    return module ? getValidationErrors(module) : getValidationErrors();
  }, [module, getValidationErrors]);

  // Trigger automatic data population
  const triggerAutoPopulation = useCallback(async () => {
    const results = {
      vat: await populateVATFromTransactions(),
      cit: await populateCITFromBookkeeping(),
      companySync: await syncCompanySettings()
    };

    // Validate after population
    await validateDataConsistency();
    
    return results;
  }, [populateVATFromTransactions, populateCITFromBookkeeping, syncCompanySettings, validateDataConsistency]);

  // Auto-refresh data based on interval
  useQuery({
    queryKey: [`cross-module-auto-refresh-${module || 'all'}`],
    queryFn: async () => {
      if (autoSync) {
        await triggerAutoPopulation();
      }
      return { refreshed: true, timestamp: Date.now() };
    },
    refetchInterval: syncInterval,
    enabled: autoSync
  });

  return {
    // Data
    crossModuleData,
    syncState,
    
    // Auto-population functions
    populateVATFromTransactions,
    populateCITFromBookkeeping,
    syncCompanySettings,
    triggerAutoPopulation,
    
    // Validation
    validationErrors: getModuleValidationErrors(),
    validateDataConsistency,
    
    // Status checks
    checkDataFreshness,
    isDataStale: module ? isDataStale(module) : false,
    
    // Manual sync
    syncData,
    updateModuleData
  };
}