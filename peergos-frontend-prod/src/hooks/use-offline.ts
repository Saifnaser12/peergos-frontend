import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  transactions: any[];
  calculations: any[];
  drafts: any[];
  lastSync: string;
}

interface UseOfflineReturn {
  isOnline: boolean;
  hasOfflineData: boolean;
  offlineData: OfflineData;
  saveOfflineData: (type: keyof OfflineData, data: any) => void;
  syncOfflineData: () => Promise<void>;
  clearOfflineData: () => void;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    transactions: [],
    calculations: [],
    drafts: [],
    lastSync: new Date().toISOString()
  });
  const { toast } = useToast();

  // Load offline data from localStorage on mount
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const stored = localStorage.getItem('peergos-offline-data');
        if (stored) {
          const parsed = JSON.parse(stored);
          setOfflineData(parsed);
          setHasOfflineData(
            parsed.transactions.length > 0 || 
            parsed.calculations.length > 0 || 
            parsed.drafts.length > 0
          );
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadOfflineData();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You're back online. Syncing any offline data...",
        variant: "default"
      });
      
      // Auto-sync when coming back online
      if (hasOfflineData) {
        syncOfflineData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "You're now offline. Your work will be saved locally.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasOfflineData, toast]);

  // Save data offline
  const saveOfflineData = (type: keyof OfflineData, data: any) => {
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = { ...data, offlineTimestamp: timestamp };

    setOfflineData(prev => {
      const updated = {
        ...prev,
        [type]: [...prev[type], dataWithTimestamp],
        lastSync: timestamp
      };

      // Save to localStorage
      try {
        localStorage.setItem('peergos-offline-data', JSON.stringify(updated));
        setHasOfflineData(true);
      } catch (error) {
        console.error('Failed to save offline data:', error);
        toast({
          title: "Storage Error",
          description: "Failed to save data offline. Please free up some space.",
          variant: "destructive"
        });
      }

      return updated;
    });

    if (!isOnline) {
      toast({
        title: "Saved Offline",
        description: `Your ${type} has been saved locally and will sync when you're back online.`,
        variant: "default"
      });
    }
  };

  // Sync offline data when back online
  const syncOfflineData = async () => {
    if (!hasOfflineData || !isOnline) return;

    try {
      toast({
        title: "Syncing Data",
        description: "Uploading your offline data...",
        variant: "default"
      });

      // Sync transactions
      for (let i = 0; i < offlineData.transactions.length; i++) {
        const transaction = offlineData.transactions[i];
        try {
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
          });

          if (!response.ok) {
            throw new Error(`Failed to sync transaction: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to sync transaction:', error);
          // Keep failed transactions for retry
          continue;
        }
      }

      // Sync calculations
      for (let j = 0; j < offlineData.calculations.length; j++) {
        const calculation = offlineData.calculations[j];
        try {
          const response = await fetch('/api/calculations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(calculation)
          });

          if (!response.ok) {
            throw new Error(`Failed to sync calculation: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to sync calculation:', error);
          continue;
        }
      }

      // Sync drafts
      for (let k = 0; k < offlineData.drafts.length; k++) {
        const draft = offlineData.drafts[k];
        try {
          const response = await fetch('/api/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft)
          });

          if (!response.ok) {
            throw new Error(`Failed to sync draft: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to sync draft:', error);
          continue;
        }
      }

      // Clear successfully synced data
      clearOfflineData();

      toast({
        title: "Sync Complete",
        description: "All offline data has been successfully uploaded.",
        variant: "default"
      });

    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some data couldn't be synced. We'll try again later.",
        variant: "destructive"
      });
    }
  };

  // Clear offline data
  const clearOfflineData = () => {
    const emptyData: OfflineData = {
      transactions: [],
      calculations: [],
      drafts: [],
      lastSync: new Date().toISOString()
    };

    setOfflineData(emptyData);
    setHasOfflineData(false);
    localStorage.removeItem('peergos-offline-data');
  };

  return {
    isOnline,
    hasOfflineData,
    offlineData,
    saveOfflineData,
    syncOfflineData,
    clearOfflineData
  };
}

// Hook for offline-capable forms
export function useOfflineForm<T extends Record<string, any>>(
  formType: keyof OfflineData,
  onlineSubmit: (data: T) => Promise<void>
) {
  const { isOnline, saveOfflineData } = useOffline();

  const handleSubmit = async (data: T) => {
    if (isOnline) {
      try {
        await onlineSubmit(data);
      } catch (error) {
        // If online submit fails, save offline
        saveOfflineData(formType, data);
        throw error;
      }
    } else {
      // Save offline when not connected
      saveOfflineData(formType, data);
    }
  };

  return { handleSubmit, isOnline };
}

// Service Worker registration for offline capabilities
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                if (confirm('New version available. Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}