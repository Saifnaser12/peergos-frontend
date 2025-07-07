import { createContext, useContext, useState, ReactNode } from 'react';
import { z } from 'zod';

// Setup form validation schema
export const setupSchema = z.object({
  // Business Information
  businessInfo: z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    trn: z.string().regex(/^[0-9]{15}$/, 'TRN must be exactly 15 digits'),
    businessLicense: z.string().min(1, 'Business license number is required'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    phone: z.string().regex(/^\+971[0-9]{8,9}$/, 'Phone must be valid UAE number (+971xxxxxxxx)'),
    email: z.string().email('Invalid email address'),
    industry: z.string().min(1, 'Industry is required'),
  }),

  // Revenue and Classification
  revenueInfo: z.object({
    annualRevenue: z.number().min(0, 'Revenue cannot be negative'),
    employees: z.number().min(1, 'Must have at least 1 employee').max(10000, 'Employee count seems too high'),
    financialYearEnd: z.string().min(1, 'Financial year end is required'),
  }),

  // License and Entity Type
  licenseInfo: z.object({
    licenseType: z.enum(['mainland', 'freezone', 'individual'], {
      required_error: 'License type is required',
    }),
    emirate: z.string().min(1, 'Emirate is required'),
    authority: z.string().min(1, 'Licensing authority is required'),
  }),

  // Free Zone Status
  freeZoneInfo: z.object({
    isFreeZone: z.boolean(),
    freeZoneName: z.string().optional(),
    freeZoneAuthority: z.string().optional(),
    qfzpEligible: z.boolean().optional(),
  }).refine((data) => {
    if (data.isFreeZone) {
      return data.freeZoneName && data.freeZoneName.length > 0;
    }
    return true;
  }, {
    message: 'Free Zone name is required when Free Zone is selected',
    path: ['freeZoneName'],
  }),

  // UAE Integration
  uaeIntegration: z.object({
    hasUAEPass: z.boolean(),
    uaePassId: z.string().optional(),
    ftaIntegrationConsent: z.boolean(),
    dataProcessingConsent: z.boolean(),
  }),

  // File Uploads
  documents: z.object({
    tradeLicense: z.instanceof(File).optional(),
    memorandum: z.instanceof(File).optional(),
    freeZoneDeclaration: z.instanceof(File).optional(),
    transferPricingDeclaration: z.instanceof(File).optional(),
    auditedFinancials: z.instanceof(File).optional(),
  }),

  // Additional Compliance
  compliance: z.object({
    vatRequired: z.boolean(),
    vatNumber: z.string().optional(),
    transferPricingRequired: z.boolean(),
    hasRelatedParties: z.boolean(),
    auditRequired: z.boolean(),
  }),
});

export type SetupFormData = z.infer<typeof setupSchema>;

export interface SetupContextType {
  formData: Partial<SetupFormData>;
  updateFormData: (section: keyof SetupFormData, data: any) => void;
  validateSection: (section: keyof SetupFormData) => { isValid: boolean; errors: any };
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isStepValid: (step: number) => boolean;
  totalSteps: number;
  completedSteps: Set<number>;
  markStepCompleted: (step: number) => void;
  resetForm: () => void;
}

const SetupContext = createContext<SetupContextType | undefined>(undefined);

const initialFormData: Partial<SetupFormData> = {
  businessInfo: {
    companyName: '',
    trn: '',
    businessLicense: '',
    address: '',
    phone: '+971',
    email: '',
    industry: '',
  },
  revenueInfo: {
    annualRevenue: 0,
    employees: 1,
    financialYearEnd: '',
  },
  licenseInfo: {
    licenseType: 'mainland',
    emirate: '',
    authority: '',
  },
  freeZoneInfo: {
    isFreeZone: false,
    freeZoneName: '',
    freeZoneAuthority: '',
    qfzpEligible: false,
  },
  uaeIntegration: {
    hasUAEPass: false,
    uaePassId: '',
    ftaIntegrationConsent: false,
    dataProcessingConsent: false,
  },
  documents: {},
  compliance: {
    vatRequired: false,
    vatNumber: '',
    transferPricingRequired: false,
    hasRelatedParties: false,
    auditRequired: false,
  },
};

interface SetupProviderProps {
  children: ReactNode;
}

export function SetupProvider({ children }: SetupProviderProps) {
  const [formData, setFormData] = useState<Partial<SetupFormData>>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const totalSteps = 6;

  const updateFormData = (section: keyof SetupFormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  const validateSection = (section: keyof SetupFormData) => {
    try {
      const sectionSchema = setupSchema.shape[section];
      const sectionData = formData[section];
      sectionSchema.parse(sectionData);
      return { isValid: true, errors: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Business Info
        return validateSection('businessInfo').isValid;
      case 2: // Revenue Info
        return validateSection('revenueInfo').isValid;
      case 3: // License Info
        return validateSection('licenseInfo').isValid;
      case 4: // Free Zone Info
        return validateSection('freeZoneInfo').isValid;
      case 5: // UAE Integration
        return validateSection('uaeIntegration').isValid;
      case 6: // Documents and Review
        // Custom validation for required documents
        const revenue = formData.revenueInfo?.annualRevenue || 0;
        const isFreeZone = formData.freeZoneInfo?.isFreeZone || false;
        const hasRequiredDocs = formData.documents?.tradeLicense !== undefined;
        
        let requiredDocsValid = hasRequiredDocs;
        
        if (isFreeZone && !formData.documents?.freeZoneDeclaration) {
          requiredDocsValid = false;
        }
        
        if (revenue > 3000000 && !formData.documents?.transferPricingDeclaration) {
          requiredDocsValid = false;
        }
        
        return requiredDocsValid;
      default:
        return false;
    }
  };

  const markStepCompleted = (step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setCompletedSteps(new Set());
  };

  return (
    <SetupContext.Provider
      value={{
        formData,
        updateFormData,
        validateSection,
        currentStep,
        setCurrentStep,
        isStepValid,
        totalSteps,
        completedSteps,
        markStepCompleted,
        resetForm,
      }}
    >
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

// Utility functions for conditional logic
export const getConditionalRequirements = (formData: Partial<SetupFormData>) => {
  const revenue = formData.revenueInfo?.annualRevenue || 0;
  const isFreeZone = formData.freeZoneInfo?.isFreeZone || false;
  const licenseType = formData.licenseInfo?.licenseType;

  return {
    requiresVAT: revenue >= 375000,
    requiresCIT: true, // Always required in UAE
    requiresTransferPricing: revenue > 3000000,
    requiresFreeZoneDeclaration: isFreeZone,
    requiresIndividualCITFlag: licenseType === 'individual',
    smallBusinessRelief: revenue <= 375000,
    cashBasisEligible: revenue < 3000000,
    qfzpEligible: isFreeZone && revenue <= 3000000,
  };
};