import React, { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  key: string;
  data: any;
  onSave?: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({ 
  key, 
  data, 
  onSave, 
  delay = 2000, 
  enabled = true 
}: UseAutoSaveOptions) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const saveToLocal = useCallback((saveData: any) => {
    try {
      localStorage.setItem(`auto-save-${key}`, JSON.stringify({
        data: saveData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [key]);

  const saveToServer = useCallback(async (saveData: any) => {
    if (!onSave || isSavingRef.current) return;
    
    try {
      isSavingRef.current = true;
      await onSave(saveData);
      lastSavedRef.current = JSON.stringify(saveData);
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Your changes are saved locally but couldn't sync to server.",
        variant: "destructive",
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, toast]);

  const debouncedSave = useCallback((saveData: any) => {
    if (!enabled) return;
    
    const dataString = JSON.stringify(saveData);
    if (dataString === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Save to localStorage immediately
    saveToLocal(saveData);

    // Debounce server save
    timeoutRef.current = setTimeout(() => {
      saveToServer(saveData);
    }, delay);
  }, [enabled, delay, saveToLocal, saveToServer]);

  useEffect(() => {
    debouncedSave(data);
  }, [data, debouncedSave]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadFromLocal = useCallback(() => {
    try {
      const saved = localStorage.getItem(`auto-save-${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }, [key]);

  const clearLocalSave = useCallback(() => {
    try {
      localStorage.removeItem(`auto-save-${key}`);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, [key]);

  return {
    loadFromLocal,
    clearLocalSave,
    isSaving: isSavingRef.current
  };
}