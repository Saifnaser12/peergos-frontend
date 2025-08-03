import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hint?: string;
  example?: string;
  format?: string;
  realTimeValidation?: boolean;
  validationRules?: ValidationRule;
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    hint, 
    example, 
    format, 
    realTimeValidation = false, 
    validationRules,
    value,
    onChange,
    onBlur,
    className,
    ...props 
  }, ref) => {
    const [validationState, setValidationState] = useState<'valid' | 'invalid' | 'neutral'>('neutral');
    const [validationMessage, setValidationMessage] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);

    // Real-time validation
    useEffect(() => {
      if (realTimeValidation && validationRules && value !== undefined) {
        const result = validateValue(String(value), validationRules);
        setValidationState(result.isValid ? 'valid' : 'invalid');
        setValidationMessage(result.message);
      }
    }, [value, realTimeValidation, validationRules]);

    const validateValue = (val: string, rules: ValidationRule) => {
      // Required validation
      if (rules.required && (!val || val.trim() === '')) {
        return { isValid: false, message: 'This field is required' };
      }

      // Skip other validations if field is empty and not required
      if (!val || val.trim() === '') {
        return { isValid: true, message: '' };
      }

      // Length validations
      if (rules.minLength && val.length < rules.minLength) {
        return { isValid: false, message: `Minimum ${rules.minLength} characters required` };
      }

      if (rules.maxLength && val.length > rules.maxLength) {
        return { isValid: false, message: `Maximum ${rules.maxLength} characters allowed` };
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(val)) {
        return { isValid: false, message: 'Invalid format' };
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(val);
        if (customResult) {
          return { isValid: false, message: customResult };
        }
      }

      return { isValid: true, message: '' };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // Validate on blur if not real-time validation
      if (!realTimeValidation && validationRules) {
        const result = validateValue(e.target.value, validationRules);
        setValidationState(result.isValid ? 'valid' : 'invalid');
        setValidationMessage(result.message);
      }
      
      onBlur?.(e);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const getInputClassName = () => {
      let baseClassName = className || '';
      
      if (realTimeValidation) {
        if (validationState === 'valid') {
          baseClassName += ' border-green-500 focus:border-green-500 focus:ring-green-500';
        } else if (validationState === 'invalid') {
          baseClassName += ' border-red-500 focus:border-red-500 focus:ring-red-500';
        }
      }
      
      return baseClassName;
    };

    return (
      <div className="space-y-2">
        {/* Input field */}
        <div className="relative">
          <Input
            ref={ref}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={getInputClassName()}
            {...props}
          />
          
          {/* Validation indicator */}
          {realTimeValidation && value && validationState !== 'neutral' && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {validationState === 'valid' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>

        {/* Helper content */}
        <div className="space-y-2">
          {/* Hint */}
          {hint && (
            <div className="flex items-start gap-1 text-sm text-gray-600">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{hint}</span>
            </div>
          )}

          {/* Example */}
          {example && (isFocused || !value) && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Example:</span> {example}
            </div>
          )}

          {/* Format */}
          {format && (isFocused || !value) && (
            <Badge variant="outline" className="text-xs">
              Format: {format}
            </Badge>
          )}

          {/* Validation message */}
          {validationMessage && validationState === 'invalid' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">
                {validationMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';