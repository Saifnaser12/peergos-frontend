import { useSetup } from '@/context/setup-context';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SetupProgress from './setup-progress';
import BusinessInfoStep from './business-info-step';
import RevenueDeclarationStep from './revenue-declaration-step';
import { ChevronLeft, ChevronRight, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder components for remaining steps
import FreeZoneLicenseStep from './free-zone-license-step';

const TRNUploadStep = () => (
  <div className="text-center py-8">
    <h3 className="text-lg font-medium">TRN Upload Step</h3>
    <p className="text-gray-600">Coming soon...</p>
  </div>
);

const SummaryStep = () => (
  <div className="text-center py-8">
    <h3 className="text-lg font-medium">Summary & Review Step</h3>
    <p className="text-gray-600">Coming soon...</p>
  </div>
);

interface SetupWizardProps {
  className?: string;
}

export default function SetupWizard({ className = '' }: SetupWizardProps) {
  const { 
    currentStep, 
    nextStep, 
    prevStep, 
    stepValidation, 
    resetSetup,
    saveProgress 
  } = useSetup();
  const { language } = useLanguage();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessInfoStep />;
      case 2:
        return <RevenueDeclarationStep />;
      case 3:
        return <FreeZoneLicenseStep />;
      case 4:
        return <TRNUploadStep />;
      case 5:
        return <SummaryStep />;
      default:
        return <BusinessInfoStep />;
    }
  };

  const canProceed = stepValidation[currentStep] || false;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 5;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Indicator */}
      <SetupProgress />

      {/* Current Step Content */}
      <div className="min-h-96">
        {renderCurrentStep()}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={resetSetup}
            className="flex items-center gap-2 text-gray-600"
          >
            <RotateCcw className="h-4 w-4" />
            {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={saveProgress}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {language === 'ar' ? 'حفظ التقدم' : 'Save Progress'}
          </Button>

          {!isLastStep && (
            <Button
              onClick={nextStep}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {isLastStep && (
            <Button
              onClick={() => {
                // Complete setup logic here
                console.log('Setup completed!');
              }}
              disabled={!canProceed}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {language === 'ar' ? 'إكمال الإعداد' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>

      {/* Validation Alert */}
      {!canProceed && currentStep < 5 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800 text-sm">
            {language === 'ar' 
              ? 'يرجى إكمال جميع الحقول المطلوبة في هذه الخطوة للمتابعة.'
              : 'Please complete all required fields in this step to continue.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-save Notice */}
      <div className="text-center text-xs text-gray-500">
        {language === 'ar' 
          ? 'يتم حفظ التقدم تلقائياً كل تغيير'
          : 'Progress is automatically saved with every change'
        }
      </div>
    </div>
  );
}