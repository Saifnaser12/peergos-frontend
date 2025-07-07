import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BusinessInfo, RevenueDeclaration, FreeZoneLicense, TRNUpload, CompleteSetup } from '@/lib/setup-validation';

interface SetupContextType {
  currentStep: number;
  businessInfo: Partial<BusinessInfo>;
  revenueDeclaration: Partial<RevenueDeclaration>;
  freeZoneLicense: Partial<FreeZoneLicense>;
  trnUpload: Partial<TRNUpload>;
  
  // Navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Data updates
  updateBusinessInfo: (data: Partial<BusinessInfo>) => void;
  updateRevenueDeclaration: (data: Partial<RevenueDeclaration>) => void;
  updateFreeZoneLicense: (data: Partial<FreeZoneLicense>) => void;
  updateTRNUpload: (data: Partial<TRNUpload>) => void;
  
  // Utility
  resetSetup: () => void;
  getCompleteSetup: () => CompleteSetup | null;
  saveProgress: () => void;
  loadProgress: () => void;
  
  // Validation state
  stepValidation: Record<number, boolean>;
  updateStepValidation: (step: number, isValid: boolean) => void;
}

const SetupContext = createContext<SetupContextType | undefined>(undefined);

const STORAGE_KEY = 'peergos_setup_progress';
const VALIDATION_KEY = 'peergos_setup_validation';

export function SetupProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>({});
  const [revenueDeclaration, setRevenueDeclaration] = useState<Partial<RevenueDeclaration>>({
    hasInternationalSales: false,
  });
  const [freeZoneLicense, setFreeZoneLicense] = useState<Partial<FreeZoneLicense>>({
    isFreeZone: false,
    isQFZP: false,
    hasRelatedParties: false,
  });
  const [trnUpload, setTRNUpload] = useState<Partial<TRNUpload>>({
    hasTRN: false,
    citRegistrationRequired: true,
    taxAgentAppointed: false,
  });
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  // Auto-save progress to localStorage
  useEffect(() => {
    saveProgress();
  }, [businessInfo, revenueDeclaration, freeZoneLicense, trnUpload, currentStep]);

  const updateBusinessInfo = (data: Partial<BusinessInfo>) => {
    setBusinessInfo(prev => ({ ...prev, ...data }));
  };

  const updateRevenueDeclaration = (data: Partial<RevenueDeclaration>) => {
    setRevenueDeclaration(prev => ({ ...prev, ...data }));
  };

  const updateFreeZoneLicense = (data: Partial<FreeZoneLicense>) => {
    setFreeZoneLicense(prev => ({ ...prev, ...data }));
  };

  const updateTRNUpload = (data: Partial<TRNUpload>) => {
    setTRNUpload(prev => ({ ...prev, ...data }));
  };

  const updateStepValidation = (step: number, isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [step]: isValid }));
    // Save validation state to localStorage
    localStorage.setItem(VALIDATION_KEY, JSON.stringify({ ...stepValidation, [step]: isValid }));
  };

  const nextStep = () => {
    if (currentStep < 5 && stepValidation[currentStep]) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetSetup = () => {
    setCurrentStep(1);
    setBusinessInfo({});
    setRevenueDeclaration({ hasInternationalSales: false });
    setFreeZoneLicense({ isFreeZone: false, isQFZP: false, hasRelatedParties: false });
    setTRNUpload({ hasTRN: false, citRegistrationRequired: true, taxAgentAppointed: false });
    setStepValidation({ 1: false, 2: false, 3: false, 4: false });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VALIDATION_KEY);
  };

  const saveProgress = () => {
    const progressData = {
      currentStep,
      businessInfo,
      revenueDeclaration,
      freeZoneLicense,
      trnUpload,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
  };

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedValidation = localStorage.getItem(VALIDATION_KEY);
      
      if (saved) {
        const progressData = JSON.parse(saved);
        setCurrentStep(progressData.currentStep || 1);
        setBusinessInfo(progressData.businessInfo || {});
        setRevenueDeclaration(progressData.revenueDeclaration || { hasInternationalSales: false });
        setFreeZoneLicense(progressData.freeZoneLicense || { isFreeZone: false, isQFZP: false, hasRelatedParties: false });
        setTRNUpload(progressData.trnUpload || { hasTRN: false, citRegistrationRequired: true, taxAgentAppointed: false });
      }
      
      if (savedValidation) {
        const validationData = JSON.parse(savedValidation);
        setStepValidation(validationData);
      }
    } catch (error) {
      console.warn('Failed to load setup progress:', error);
    }
  };

  const getCompleteSetup = (): CompleteSetup | null => {
    try {
      return {
        businessInfo: businessInfo as BusinessInfo,
        revenueDeclaration: revenueDeclaration as RevenueDeclaration,
        freeZoneLicense: freeZoneLicense as FreeZoneLicense,
        trnUpload: trnUpload as TRNUpload,
      };
    } catch {
      return null;
    }
  };

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const value: SetupContextType = {
    currentStep,
    businessInfo,
    revenueDeclaration,
    freeZoneLicense,
    trnUpload,
    setCurrentStep,
    nextStep,
    prevStep,
    updateBusinessInfo,
    updateRevenueDeclaration,
    updateFreeZoneLicense,
    updateTRNUpload,
    resetSetup,
    getCompleteSetup,
    saveProgress,
    loadProgress,
    stepValidation,
    updateStepValidation,
  };

  return (
    <SetupContext.Provider value={value}>
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup() {
  const context = useContext(SetupContext);
  if (context === undefined) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
}