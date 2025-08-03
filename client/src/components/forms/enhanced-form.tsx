import React, { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAutoSave } from '@/hooks/use-auto-save';
import { CheckCircle2, Clock } from 'lucide-react';

interface EnhancedFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void> | void;
  title: string;
  description?: string;
  children: ReactNode;
  autoSaveKey?: string;
  enableAutoSave?: boolean;
  showProgress?: boolean;
  maxSteps?: number;
  currentStep?: number;
}

export function EnhancedForm({
  form,
  onSubmit,
  title,
  description,
  children,
  autoSaveKey,
  enableAutoSave = false,
  showProgress = false,
  maxSteps,
  currentStep,
}: EnhancedFormProps) {
  const { lastSaved, isAutoSaving } = useAutoSave({
    form,
    key: autoSaveKey || 'enhanced-form',
    enabled: enableAutoSave,
    debounceMs: 2000,
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          {/* Auto-save status */}
          {enableAutoSave && (
            <div className="flex items-center gap-2">
              {isAutoSaving ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  Saving...
                </Badge>
              ) : lastSaved ? (
                <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Auto-saved
                </Badge>
              ) : null}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {showProgress && maxSteps && currentStep && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of {maxSteps}</span>
              <span>{Math.round((currentStep / maxSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / maxSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {children}
        </form>
      </CardContent>
    </Card>
  );
}