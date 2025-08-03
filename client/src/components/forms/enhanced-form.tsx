import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  title?: string;
  description?: string;
  autoSaveKey?: string;
  enableAutoSave?: boolean;
  children: React.ReactNode;
  className?: string;
  showProgress?: boolean;
  steps?: { title: string; completed: boolean }[];
  currentStep?: number;
  onAutoSaveRestore?: (data: any) => void;
}

export function EnhancedForm({
  form,
  onSubmit,
  title,
  description,
  autoSaveKey,
  enableAutoSave = true,
  children,
  className,
  showProgress = false,
  steps,
  currentStep,
  onAutoSaveRestore,
}: EnhancedFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  
  const { toast } = useToast();
  const formData = form.watch();

  // Auto-save functionality
  const { loadFromLocal, clearLocalSave } = useAutoSave({
    key: autoSaveKey || 'form-data',
    data: formData,
    enabled: enableAutoSave && !!autoSaveKey,
    onSave: async (data) => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    },
  });

  // Check for saved data on mount
  useEffect(() => {
    if (autoSaveKey && enableAutoSave) {
      const savedData = loadFromLocal();
      if (savedData && Object.keys(savedData).length > 0) {
        setShowRestorePrompt(true);
      }
    }
  }, [autoSaveKey, enableAutoSave, loadFromLocal]);

  // Track form changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      setHasUnsavedChanges(false);
      if (autoSaveKey) {
        clearLocalSave();
      }
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreData = () => {
    const savedData = loadFromLocal();
    if (savedData) {
      Object.keys(savedData).forEach(key => {
        form.setValue(key, savedData[key]);
      });
      onAutoSaveRestore?.(savedData);
      setShowRestorePrompt(false);
      toast({
        title: "Data restored",
        description: "Your previous work has been restored",
      });
    }
  };

  const handleDiscardSaved = () => {
    clearLocalSave();
    setShowRestorePrompt(false);
  };

  // Calculate form completion percentage
  const getCompletionPercentage = () => {
    if (!steps) return 0;
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  // Count form errors
  const errorCount = Object.keys(form.formState.errors).length;
  const isFormValid = errorCount === 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Restore prompt */}
      {showRestorePrompt && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Previous work found</p>
                <p className="text-sm">We found unsaved changes from a previous session.</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardSaved}
                  className="border-blue-200 text-blue-700"
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleRestoreData}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        {(title || description || showProgress) && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {title && <CardTitle>{title}</CardTitle>}
                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
              </div>
              
              {/* Form status indicators */}
              <div className="flex items-center gap-3">
                {/* Auto-save status */}
                {enableAutoSave && lastSaved && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CheckCircle className="h-3 w-3" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </div>
                )}
                
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
                
                {/* Error count */}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} error{errorCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
            {showProgress && steps && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Form completion</span>
                  <span>{Math.round(getCompletionPercentage())}%</span>
                </div>
                <Progress value={getCompletionPercentage()} className="h-2" />
                
                {/* Step indicators */}
                <div className="flex gap-1 mt-3">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex-1 text-xs p-2 rounded text-center",
                        step.completed 
                          ? "bg-green-100 text-green-700" 
                          : currentStep === index
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {step.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
        )}

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {children}
            
            {/* Form validation summary */}
            {errorCount > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Please fix the following errors:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {Object.entries(form.formState.errors).map(([field, error]) => (
                        <li key={field}>
                          <strong>{field}:</strong> {error?.message as string}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Submit button */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {enableAutoSave && (
                  <>
                    <Save className="h-3 w-3" />
                    Changes are automatically saved
                  </>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Form'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}