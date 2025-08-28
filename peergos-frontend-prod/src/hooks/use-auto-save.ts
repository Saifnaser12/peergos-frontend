import { useEffect, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  form: UseFormReturn<any>;
  key: string;
  enabled?: boolean;
  debounceMs?: number;
  onSave?: (data: any) => Promise<void>;
}

interface UseAutoSaveReturn {
  lastSaved: Date | null;
  isAutoSaving: boolean;
  saveNow: () => Promise<void>;
  clearSaved: () => void;
}

export function useAutoSave({
  form,
  key,
  enabled = true,
  debounceMs = 2000,
  onSave,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load saved data on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      const savedTimestamp = localStorage.getItem(`autosave_${key}_timestamp`);
      
      if (savedData && savedTimestamp) {
        const parsedData = JSON.parse(savedData);
        const timestamp = new Date(savedTimestamp);
        
        // Only restore if data was saved within the last 24 hours
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (timestamp > dayAgo) {
          // Check if form is currently empty or has default values
          const currentValues = form.getValues();
          const isEmpty = Object.values(currentValues).every(value => 
            !value || value === '' || (Array.isArray(value) && value.length === 0)
          );
          
          if (isEmpty) {
            form.reset(parsedData);
            setLastSaved(timestamp);
            toast({
              title: 'Data Restored',
              description: 'Your previous work has been restored from auto-save',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load auto-saved data:', error);
    }
  }, [enabled, key, form, toast]);

  // Save data to localStorage
  const saveToStorage = useCallback(async (data: any) => {
    try {
      setIsAutoSaving(true);
      
      // Call custom save function if provided
      if (onSave) {
        await onSave(data);
      }
      
      // Save to localStorage
      const timestamp = new Date();
      localStorage.setItem(`autosave_${key}`, JSON.stringify(data));
      localStorage.setItem(`autosave_${key}_timestamp`, timestamp.toISOString());
      
      setLastSaved(timestamp);
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: 'Auto-save Failed',
        description: 'Your data could not be saved automatically',
        variant: 'destructive',
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [key, onSave, toast]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (!enabled) return;
    const data = form.getValues();
    await saveToStorage(data);
  }, [enabled, form, saveToStorage]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    localStorage.removeItem(`autosave_${key}_timestamp`);
    setLastSaved(null);
  }, [key]);

  // Watch form changes and auto-save with debouncing
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((data) => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        // Only save if form has been touched
        const formState = form.formState;
        if (formState.isDirty || Object.keys(formState.touchedFields).length > 0) {
          saveToStorage(data);
        }
      }, debounceMs);

      setDebounceTimer(timer);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [enabled, form, debounceMs, saveToStorage, debounceTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    lastSaved,
    isAutoSaving,
    saveNow,
    clearSaved,
  };
}