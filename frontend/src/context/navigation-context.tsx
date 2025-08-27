import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export interface NavigationState {
  currentPage: string;
  completedSteps: Set<string>;
  userProgress: number;
  isNavigating: boolean;
  lastError: string | null;
}

export interface NavigationContextType {
  state: NavigationState;
  navigateTo: (path: string, options?: NavigationOptions) => Promise<boolean>;
  markStepCompleted: (step: string) => void;
  validateAndNavigate: (
    path: string, 
    validationFn?: () => Promise<boolean> | boolean,
    options?: NavigationOptions
  ) => Promise<boolean>;
  updateProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  canNavigate: (path: string) => boolean;
  getProgressInfo: () => ProgressInfo;
}

export interface NavigationOptions {
  replace?: boolean;
  skipValidation?: boolean;
  showToast?: boolean;
  requiresAuth?: boolean;
}

export interface ProgressInfo {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  completedSteps: string[];
  nextStep?: string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Define the complete user journey flow
const USER_JOURNEY_STEPS = [
  { path: '/setup', name: 'Business Setup', weight: 15 },
  { path: '/', name: 'Dashboard Overview', weight: 5 },
  { path: '/accounting', name: 'Transaction Entry', weight: 20 },
  { path: '/cit', name: 'Corporate Tax', weight: 20 },
  { path: '/vat', name: 'VAT Management', weight: 20 },
  { path: '/financials', name: 'Financial Reports', weight: 10 },
  { path: '/invoicing', name: 'E-Invoicing', weight: 10 },
];

const PROTECTED_ROUTES = [
  '/accounting', '/cit', '/vat', '/financials', 
  '/invoicing', '/transfer-pricing', '/admin'
];

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [state, setState] = useState<NavigationState>({
    currentPage: location,
    completedSteps: new Set<string>(),
    userProgress: 0,
    isNavigating: false,
    lastError: null,
  });

  const navigateTo = async (path: string, options: NavigationOptions = {}): Promise<boolean> => {
    const { replace = false, showToast = true, requiresAuth = true } = options;
    
    setState(prev => ({ ...prev, isNavigating: true, lastError: null }));
    
    try {
      // Check authentication for protected routes
      if (requiresAuth && PROTECTED_ROUTES.includes(path)) {
        // This would typically check user auth state
        // For now, we'll assume user is authenticated
      }

      // Navigate
      setLocation(path, { replace });
      
      setState(prev => ({
        ...prev,
        currentPage: path,
        isNavigating: false,
      }));

      if (showToast) {
        const stepInfo = USER_JOURNEY_STEPS.find(step => step.path === path);
        toast({
          title: 'Navigation Successful',
          description: stepInfo ? `Navigated to ${stepInfo.name}` : `Navigated to ${path}`,
        });
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
      setState(prev => ({
        ...prev,
        isNavigating: false,
        lastError: errorMessage,
      }));

      toast({
        title: 'Navigation Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    }
  };

  const validateAndNavigate = async (
    path: string,
    validationFn?: () => Promise<boolean> | boolean,
    options: NavigationOptions = {}
  ): Promise<boolean> => {
    const { skipValidation = false } = options;

    // Skip validation if explicitly requested
    if (skipValidation) {
      return navigateTo(path, options);
    }

    // Run validation if provided
    if (validationFn) {
      setState(prev => ({ ...prev, isNavigating: true }));
      
      try {
        const isValid = await validationFn();
        
        if (!isValid) {
          setState(prev => ({
            ...prev,
            isNavigating: false,
            lastError: 'Validation failed',
          }));

          toast({
            title: 'Validation Failed',
            description: 'Please complete all required fields before proceeding.',
            variant: 'destructive',
          });

          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Validation error';
        setState(prev => ({
          ...prev,
          isNavigating: false,
          lastError: errorMessage,
        }));

        toast({
          title: 'Validation Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return false;
      }
    }

    return navigateTo(path, options);
  };

  const markStepCompleted = (step: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...Array.from(prev.completedSteps), step]),
    }));

    // Update progress based on completed steps
    setState(prevState => {
      const completedWeight = USER_JOURNEY_STEPS
        .filter(journeyStep => prevState.completedSteps.has(journeyStep.path))
        .reduce((sum, step) => sum + step.weight, 0);
    
      const totalWeight = USER_JOURNEY_STEPS.reduce((sum, step) => sum + step.weight, 0);
      const newProgress = Math.round((completedWeight / totalWeight) * 100);
      
      return { ...prevState, userProgress: newProgress };
    });

    // Toast is shown after state update
    setTimeout(() => {
      const currentProgress = state.userProgress;
      toast({
        title: 'Step Completed',
        description: `Progress: ${currentProgress}% complete`,
      });
    }, 100);
  };

  const updateProgress = (progress: number) => {
    setState(prev => ({ ...prev, userProgress: Math.max(0, Math.min(100, progress)) }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, lastError: error }));
  };

  const canNavigate = (path: string): boolean => {
    // Define navigation rules based on completion requirements
    const currentStepIndex = USER_JOURNEY_STEPS.findIndex(step => step.path === state.currentPage);
    const targetStepIndex = USER_JOURNEY_STEPS.findIndex(step => step.path === path);
    
    // Can always navigate backward or to current step
    if (targetStepIndex <= currentStepIndex) {
      return true;
    }
    
    // Can navigate forward only if previous steps are completed
    const requiredSteps = USER_JOURNEY_STEPS.slice(0, targetStepIndex);
    return requiredSteps.every(step => state.completedSteps.has(step.path));
  };

  const getProgressInfo = (): ProgressInfo => {
    const currentStepIndex = USER_JOURNEY_STEPS.findIndex(step => step.path === state.currentPage);
    const nextStepIndex = currentStepIndex + 1;
    
    return {
      currentStep: currentStepIndex + 1,
      totalSteps: USER_JOURNEY_STEPS.length,
      percentage: state.userProgress,
      completedSteps: Array.from(state.completedSteps),
      nextStep: nextStepIndex < USER_JOURNEY_STEPS.length 
        ? USER_JOURNEY_STEPS[nextStepIndex].path 
        : undefined,
    };
  };

  const contextValue: NavigationContextType = {
    state,
    navigateTo,
    markStepCompleted,
    validateAndNavigate,
    updateProgress,
    setError,
    canNavigate,
    getProgressInfo,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Navigation helper hooks
export function useFormNavigation() {
  const navigation = useNavigation();
  
  const submitWithNavigation = async (
    formData: any,
    submitFn: (data: any) => Promise<any>,
    successPath?: string,
    validationFn?: () => boolean
  ) => {
    try {
      // Validate form if validation function provided
      if (validationFn && !validationFn()) {
        throw new Error('Form validation failed');
      }

      // Submit form
      await submitFn(formData);
      
      // Navigate on success
      if (successPath) {
        await navigation.navigateTo(successPath);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      navigation.setError(errorMessage);
      return false;
    }
  };

  return { submitWithNavigation };
}

export function useProgressTracking() {
  const navigation = useNavigation();
  
  const trackStepProgress = (stepPath: string, isComplete: boolean) => {
    if (isComplete) {
      navigation.markStepCompleted(stepPath);
    }
  };

  const getStepStatus = (stepPath: string) => {
    const { state, canNavigate } = navigation;
    
    if (state.completedSteps.has(stepPath)) return 'completed';
    if (state.currentPage === stepPath) return 'current';
    if (canNavigate(stepPath)) return 'available';
    return 'locked';
  };

  return {
    trackStepProgress,
    getStepStatus,
    progressInfo: navigation.getProgressInfo(),
  };
}