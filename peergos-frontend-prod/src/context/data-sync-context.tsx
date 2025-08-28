import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DataSyncState {
  lastUpdated: Record<string, string>;
  validationErrors: ValidationError[];
  syncStatus: 'idle' | 'syncing' | 'error';
}

interface ValidationError {
  id: string;
  module: string;
  field: string;
  message: string;
  severity: 'warning' | 'error';
  affectedModules: string[];
}

interface CrossModuleData {
  transactions: any[];
  company: any;
  vatCalculations: any;
  citCalculations: any;
  taxSettings: any;
}

interface DataSyncContextValue {
  syncState: DataSyncState;
  crossModuleData: CrossModuleData | null;
  syncData: (modules: string[]) => Promise<void>;
  validateDataConsistency: () => Promise<ValidationError[]>;
  updateModuleData: (module: string, data: any) => Promise<void>;
  isDataStale: (module: string) => boolean;
  getValidationErrors: (module?: string) => ValidationError[];
}

const DataSyncContext = createContext<DataSyncContextValue | undefined>(undefined);

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [syncState, setSyncState] = useState<DataSyncState>({
    lastUpdated: {},
    validationErrors: [],
    syncStatus: 'idle'
  });

  // Fetch cross-module data
  const { data: crossModuleData, refetch: refetchCrossModuleData } = useQuery<CrossModuleData>({
    queryKey: ['/api/cross-module-data'],
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });

  // Sync data mutation
  const syncDataMutation = useMutation({
    mutationFn: async (modules: string[]) => {
      return await apiRequest('/api/sync-modules', {
        method: 'POST',
        body: { modules }
      });
    },
    onMutate: () => {
      setSyncState(prev => ({ ...prev, syncStatus: 'syncing' }));
    },
    onSuccess: () => {
      setSyncState(prev => ({ 
        ...prev, 
        syncStatus: 'idle',
        lastUpdated: {
          ...prev.lastUpdated,
          ...Object.fromEntries(modules.map(m => [m, new Date().toISOString()]))
        }
      }));
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/cross-module-data'] });
    },
    onError: () => {
      setSyncState(prev => ({ ...prev, syncStatus: 'error' }));
    }
  });

  // Update module data mutation
  const updateModuleDataMutation = useMutation({
    mutationFn: async ({ module, data }: { module: string; data: any }) => {
      return await apiRequest(`/api/modules/${module}/data`, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: (_, { module }) => {
      setSyncState(prev => ({
        ...prev,
        lastUpdated: {
          ...prev.lastUpdated,
          [module]: new Date().toISOString()
        }
      }));
      // Trigger validation after update
      validateDataConsistency();
      // Invalidate cross-module data
      refetchCrossModuleData();
    }
  });

  // Validate data consistency
  const validateDataConsistency = useCallback(async (): Promise<ValidationError[]> => {
    try {
      const response = await apiRequest('/api/validate-data-consistency');
      const errors = response as ValidationError[];
      
      setSyncState(prev => ({
        ...prev,
        validationErrors: errors
      }));
      
      return errors;
    } catch (error) {
      console.error('Data validation failed:', error);
      return [];
    }
  }, []);

  // Auto-sync when data changes
  useEffect(() => {
    const autoSyncModules = ['transactions', 'company', 'tax-settings'];
    
    const interval = setInterval(() => {
      if (crossModuleData && syncState.syncStatus === 'idle') {
        syncData(autoSyncModules);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [crossModuleData, syncState.syncStatus]);

  // Run initial validation
  useEffect(() => {
    validateDataConsistency();
  }, [validateDataConsistency]);

  const syncData = useCallback(async (modules: string[]) => {
    await syncDataMutation.mutateAsync(modules);
  }, [syncDataMutation]);

  const updateModuleData = useCallback(async (module: string, data: any) => {
    await updateModuleDataMutation.mutateAsync({ module, data });
  }, [updateModuleDataMutation]);

  const isDataStale = useCallback((module: string) => {
    const lastUpdate = syncState.lastUpdated[module];
    if (!lastUpdate) return true;
    
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    return Date.now() - new Date(lastUpdate).getTime() > staleThreshold;
  }, [syncState.lastUpdated]);

  const getValidationErrors = useCallback((module?: string) => {
    if (!module) return syncState.validationErrors;
    return syncState.validationErrors.filter(error => 
      error.module === module || error.affectedModules.includes(module)
    );
  }, [syncState.validationErrors]);

  const value: DataSyncContextValue = {
    syncState,
    crossModuleData,
    syncData,
    validateDataConsistency,
    updateModuleData,
    isDataStale,
    getValidationErrors
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
}