import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  Shield,
  Building2,
  Calculator,
  FileText,
  Upload,
  Eye
} from 'lucide-react';
import { useSetup } from '@/context/setup-context';
import { useTaxClassification } from '@/context/tax-classification-context';
import { useNavigation } from '@/context/navigation-context';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { cn } from '@/lib/utils';

// Step Components
import BusinessInfoStep from './steps/business-info-step';
import RevenueInfoStep from './steps/revenue-info-step';
import LicenseInfoStep from './steps/license-info-step';
import FreeZoneInfoStep from './steps/free-zone-info-step';
import UAEIntegrationStep from './steps/uae-integration-step';
import DocumentsReviewStep from './steps/documents-review-step';

interface SetupWizardProps {
  onComplete?: () => void;
}

const stepConfig = [
  {
    id: 1,
    title: 'Business Information',
    description: 'Company details and contact information',
    icon: Building2,
    component: BusinessInfoStep,
  },
  {
    id: 2,
    title: 'Revenue & Classification',
    description: 'Annual revenue and employee information',
    icon: Calculator,
    component: RevenueInfoStep,
  },
  {
    id: 3,
    title: 'License Type',
    description: 'Business license and authority details',
    icon: FileText,
    component: LicenseInfoStep,
  },
  {
    id: 4,
    title: 'Free Zone Status',
    description: 'Free zone classification and QFZP eligibility',
    icon: Flag,
    component: FreeZoneInfoStep,
  },
  {
    id: 5,
    title: 'UAE Integration',
    description: 'UAE Pass and FTA integration setup',
    icon: Shield,
    component: UAEIntegrationStep,
  },
  {
    id: 6,
    title: 'Documents & Review',
    description: 'File uploads and final confirmation',
    icon: Upload,
    component: DocumentsReviewStep,
  },
];

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const {
    currentStep,
    setCurrentStep,
    isStepValid,
    totalSteps,
    completedSteps,
    markStepCompleted,
    formData,
    validateSection,
  } = useSetup();

  const { classification } = useTaxClassification();
  const navigation = useNavigation();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = (currentStep / totalSteps) * 100;
  const currentStepConfig = stepConfig.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepConfig?.component;

  const handleNext = async () => {
    const stepValid = isStepValid(currentStep);
    
    if (stepValid) {
      markStepCompleted(currentStep);
      setShowValidationErrors(false);
      
      // Track progress in navigation context
      navigation.markStepCompleted(`/setup-step-${currentStep}`);
      
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - complete setup
        setIsSubmitting(true);
        try {
          if (onComplete) {
            await onComplete();
          }
          // Navigate to dashboard on successful completion
          await navigation.navigateTo('/', { showToast: true });
        } catch (error) {
          console.error('Setup completion failed:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      setShowValidationErrors(true);
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setShowValidationErrors(false);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps or the next step
    if (completedSteps.has(stepId) || stepId === currentStep || stepId === currentStep + 1) {
      setCurrentStep(stepId);
      setShowValidationErrors(false);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    if (completedSteps.has(stepId - 1) || stepId === 1) return 'available';
    return 'locked';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent">
                UAE FTA
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Peergos Setup</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            SME Tax Compliance Setup Wizard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete your business setup for automated UAE FTA compliance
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Setup Progress</h2>
              <Badge variant="outline">
                Step {currentStep} of {totalSteps}
              </Badge>
            </div>
            <Progress value={progress} className="mb-4" />
            <div className="text-sm text-gray-600">
              {completedSteps.size} of {totalSteps} steps completed
            </div>
          </CardContent>
        </Card>

        {/* Step Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
          {stepConfig.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                disabled={status === 'locked'}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all duration-200 text-left",
                  {
                    'border-green-500 bg-green-50 text-green-900': status === 'completed',
                    'border-blue-500 bg-blue-50 text-blue-900': status === 'current',
                    'border-gray-300 bg-white text-gray-700 hover:border-gray-400': status === 'available',
                    'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed': status === 'locked',
                  }
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="font-medium text-xs">{step.id}</span>
                </div>
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-xs opacity-75 hidden md:block">{step.description}</div>
              </button>
            );
          })}
        </div>

        {/* Current Step Content */}
        <Card className="min-h-[500px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentStepConfig && (
                  <currentStepConfig.icon className="h-6 w-6 text-blue-600" />
                )}
                <div>
                  <CardTitle className="text-xl">{currentStepConfig?.title}</CardTitle>
                  <p className="text-gray-600">{currentStepConfig?.description}</p>
                </div>
              </div>
              
              {/* Tax Classification Badge */}
              {classification && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {classification.badge}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Validation Errors */}
            {showValidationErrors && !isStepValid(currentStep) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please complete all required fields before continuing to the next step.
                </AlertDescription>
              </Alert>
            )}

            {/* Step Component */}
            {CurrentStepComponent && (
              <CurrentStepComponent />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <EnhancedButton
            variant="outline"
            navigationType="previous"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            showIcon={true}
          >
            Previous
          </EnhancedButton>

          <div className="flex items-center gap-3">
            {currentStep === totalSteps && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Review All
              </Button>
            )}
            
            <EnhancedButton
              navigationType={currentStep === totalSteps ? "submit" : "next"}
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              loading={isSubmitting}
              requiresValidation={true}
              validationFn={() => isStepValid(currentStep)}
              loadingText={currentStep === totalSteps ? "Completing Setup..." : "Validating..."}
              showIcon={true}
            >
              {currentStep === totalSteps ? "Complete Setup" : "Next"}
            </EnhancedButton>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-600 mt-6">
          <p>
            Need assistance? This setup wizard ensures full UAE FTA compliance.
            All information is securely stored and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}