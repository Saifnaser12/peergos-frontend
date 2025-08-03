import React, { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';

export interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  example?: string;
  format?: string;
  realTimeValidation?: boolean;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
  formatDisplay?: (value: string) => string;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    label, 
    error, 
    success, 
    hint, 
    example, 
    format, 
    realTimeValidation = false,
    validationRules,
    formatDisplay,
    onValidationChange,
    onChange,
    value,
    ...props 
  }, ref) => {
    const [localError, setLocalError] = useState<string>('');
    const [isValid, setIsValid] = useState<boolean>(true);
    const [touched, setTouched] = useState<boolean>(false);

    const validateValue = (val: string): { valid: boolean; error?: string } => {
      if (!validationRules) return { valid: true };

      // Required validation
      if (validationRules.required && (!val || val.trim() === '')) {
        return { valid: false, error: 'This field is required' };
      }

      // Skip other validations if field is empty and not required
      if (!val || val.trim() === '') {
        return { valid: true };
      }

      // Min length validation
      if (validationRules.minLength && val.length < validationRules.minLength) {
        return { 
          valid: false, 
          error: `Minimum ${validationRules.minLength} characters required` 
        };
      }

      // Max length validation
      if (validationRules.maxLength && val.length > validationRules.maxLength) {
        return { 
          valid: false, 
          error: `Maximum ${validationRules.maxLength} characters allowed` 
        };
      }

      // Pattern validation
      if (validationRules.pattern && !validationRules.pattern.test(val)) {
        return { 
          valid: false, 
          error: format ? `Please follow format: ${format}` : 'Invalid format' 
        };
      }

      // Custom validation
      if (validationRules.custom) {
        const customError = validationRules.custom(val);
        if (customError) {
          return { valid: false, error: customError };
        }
      }

      return { valid: true };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (realTimeValidation && touched) {
        const validation = validateValue(newValue);
        setIsValid(validation.valid);
        setLocalError(validation.error || '');
        onValidationChange?.(validation.valid, validation.error);
      }

      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      
      if (realTimeValidation) {
        const validation = validateValue(e.target.value);
        setIsValid(validation.valid);
        setLocalError(validation.error || '');
        onValidationChange?.(validation.valid, validation.error);
      }

      props.onBlur?.(e);
    };

    useEffect(() => {
      if (realTimeValidation && value && touched) {
        const validation = validateValue(String(value));
        setIsValid(validation.valid);
        setLocalError(validation.error || '');
        onValidationChange?.(validation.valid, validation.error);
      }
    }, [value, realTimeValidation, touched, validationRules, onValidationChange]);

    const displayError = error || localError;
    const displayValue = formatDisplay && value ? formatDisplay(String(value)) : value;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="flex items-center gap-2">
            {label}
            {validationRules?.required && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </Label>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              "transition-all duration-200",
              displayError && "border-red-500 focus-visible:ring-red-500",
              success && "border-green-500 focus-visible:ring-green-500",
              className
            )}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Status indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {displayError && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            {success && !displayError && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Help text, examples, and format guidance */}
        {(hint || example || format) && !displayError && (
          <div className="space-y-1">
            {hint && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{hint}</span>
              </div>
            )}
            {example && (
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Example: {example}</span>
              </div>
            )}
            {format && (
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                Format: {format}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {displayError && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {displayError}
            </AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {success && !displayError && (
          <Alert className="py-2 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };