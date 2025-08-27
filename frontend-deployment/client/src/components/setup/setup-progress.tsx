import { useSetup } from '@/context/setup-context';
import { useLanguage } from '@/context/language-context';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SETUP_STEPS = [
  {
    id: 1,
    title: { en: 'Business Info', ar: 'معلومات الأعمال' },
    description: { en: 'Company details and contact information', ar: 'تفاصيل الشركة ومعلومات الاتصال' }
  },
  {
    id: 2,
    title: { en: 'Revenue Declaration', ar: 'إقرار الإيرادات' },
    description: { en: 'Expected revenue and business model', ar: 'الإيرادات المتوقعة ونموذج الأعمال' }
  },
  {
    id: 3,
    title: { en: 'License & Free Zone', ar: 'الترخيص والمنطقة الحرة' },
    description: { en: 'License type and free zone status', ar: 'نوع الترخيص وحالة المنطقة الحرة' }
  },
  {
    id: 4,
    title: { en: 'TRN & Tax Registration', ar: 'الرقم الضريبي والتسجيل' },
    description: { en: 'Tax registration details and documents', ar: 'تفاصيل التسجيل الضريبي والمستندات' }
  },
  {
    id: 5,
    title: { en: 'Summary & Review', ar: 'الملخص والمراجعة' },
    description: { en: 'Review setup and tax category', ar: 'مراجعة الإعداد والفئة الضريبية' }
  },
];

interface SetupProgressProps {
  className?: string;
}

export default function SetupProgress({ className = '' }: SetupProgressProps) {
  const { currentStep, stepValidation } = useSetup();
  const { language } = useLanguage();

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {SETUP_STEPS.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / SETUP_STEPS.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / SETUP_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="text-center">
          <h3 className="font-medium text-gray-900">
            {SETUP_STEPS[currentStep - 1]?.title[language]}
          </h3>
          <p className="text-sm text-gray-600">
            {SETUP_STEPS[currentStep - 1]?.description[language]}
          </p>
        </div>
      </div>

      {/* Desktop Horizontal Stepper */}
      <div className="hidden md:block">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {SETUP_STEPS.map((step, stepIdx) => {
              const isCompleted = stepValidation[step.id] || step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isAccessible = step.id <= currentStep;

              return (
                <li key={step.id} className="relative flex-1">
                  {stepIdx !== SETUP_STEPS.length - 1 && (
                    <div 
                      className={cn(
                        "absolute top-4 left-1/2 w-full h-0.5 transform translate-x-1/2",
                        isCompleted ? "bg-blue-600" : "bg-gray-200"
                      )}
                      style={{ width: 'calc(100% - 2rem)' }}
                    />
                  )}
                  
                  <div className="relative flex flex-col items-center group">
                    <div 
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
                        isCompleted ? "bg-blue-600 border-blue-600 text-white" :
                        isCurrent ? "bg-white border-blue-600 text-blue-600" :
                        isAccessible ? "bg-white border-gray-300 text-gray-500 hover:border-gray-400" :
                        "bg-gray-100 border-gray-200 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-center">
                      <p className={cn(
                        "text-sm font-medium transition-colors",
                        isCurrent ? "text-blue-600" :
                        isCompleted ? "text-gray-900" :
                        "text-gray-500"
                      )}>
                        {step.title[language]}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 max-w-24">
                        {step.description[language]}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">
            {language === 'ar' ? 'التقدم المحرز:' : 'Progress:'} {' '}
            {Object.values(stepValidation).filter(Boolean).length} / {SETUP_STEPS.length - 1} {' '}
            {language === 'ar' ? 'خطوات مكتملة' : 'steps completed'}
          </span>
          <span className="text-blue-600 font-medium">
            {Math.round((Object.values(stepValidation).filter(Boolean).length / (SETUP_STEPS.length - 1)) * 100)}%
          </span>
        </div>
        
        {currentStep < SETUP_STEPS.length && (
          <div className="mt-2 text-xs text-gray-600">
            {language === 'ar' 
              ? 'يتم حفظ التقدم تلقائياً - يمكنك المتابعة لاحقاً'
              : 'Progress is auto-saved - you can continue later'
            }
          </div>
        )}
      </div>
    </div>
  );
}