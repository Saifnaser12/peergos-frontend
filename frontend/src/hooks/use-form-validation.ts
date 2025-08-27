import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ValidationRule<T = any> {
  field: keyof T;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface UseFormValidationOptions<T> {
  rules: ValidationRule<T>[];
  onValidationError?: (errors: ValidationError[]) => void;
  scrollToError?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T>
) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateField = useCallback((field: keyof T, value: any): ValidationError | null => {
    const rule = options.rules.find(r => r.field === field);
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        field: field as string,
        message: rule.message || `${String(field)} is required`
      };
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null;

    // Length validations
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return {
        field: field as string,
        message: rule.message || `${String(field)} must be at least ${rule.minLength} characters`
      };
    }

    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return {
        field: field as string,
        message: rule.message || `${String(field)} must be no more than ${rule.maxLength} characters`
      };
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return {
        field: field as string,
        message: rule.message || `${String(field)} format is invalid`
      };
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        return {
          field: field as string,
          message: typeof result === 'string' ? result : (rule.message || `${String(field)} is invalid`)
        };
      }
    }

    return null;
  }, [options.rules]);

  const validateForm = useCallback(async (data: T): Promise<boolean> => {
    setIsValidating(true);
    const newErrors: ValidationError[] = [];

    // Validate all fields
    for (const rule of options.rules) {
      const error = validateField(rule.field, data[rule.field]);
      if (error) {
        newErrors.push(error);
      }
    }

    setErrors(newErrors);
    setIsValidating(false);

    // Handle validation errors
    if (newErrors.length > 0) {
      options.onValidationError?.(newErrors);

      // Show toast for validation errors
      toast({
        title: 'Validation Error',
        description: `Please fix ${newErrors.length} validation error${newErrors.length === 1 ? '' : 's'}`,
        variant: 'destructive',
      });

      // Scroll to first error
      if (options.scrollToError) {
        const firstErrorField = newErrors[0].field;
        const errorElement = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add error styling
          errorElement.setAttribute('data-error', 'true');
          errorElement.classList.add('border-red-500', 'bg-red-50');
          
          // Remove error styling after a delay
          setTimeout(() => {
            errorElement.removeAttribute('data-error');
            errorElement.classList.remove('border-red-500', 'bg-red-50');
          }, 3000);
        }
      }

      return false;
    }

    return true;
  }, [options.rules, options.onValidationError, options.scrollToError, validateField, toast]);

  const validateSingleField = useCallback((field: keyof T, value: any): boolean => {
    const error = validateField(field, value);
    
    // Update errors state
    setErrors(prev => {
      const filtered = prev.filter(e => e.field !== field);
      return error ? [...filtered, error] : filtered;
    });

    return !error;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);

  const hasErrors = errors.length > 0;
  const isValid = !hasErrors && !isValidating;

  return {
    errors,
    isValidating,
    hasErrors,
    isValid,
    validateForm,
    validateSingleField,
    clearErrors,
    clearFieldError,
    getFieldError,
  };
}

// Common validation rules
export const ValidationRules = {
  required: (message?: string): Partial<ValidationRule> => ({
    required: true,
    message,
  }),

  email: (message?: string): Partial<ValidationRule> => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'Please enter a valid email address',
  }),

  phone: (message?: string): Partial<ValidationRule> => ({
    pattern: /^\+971[0-9]{8,9}$/,
    message: message || 'Please enter a valid UAE phone number (+971xxxxxxxx)',
  }),

  trn: (message?: string): Partial<ValidationRule> => ({
    pattern: /^[0-9]{15}$/,
    message: message || 'TRN must be exactly 15 digits',
  }),

  minLength: (length: number, message?: string): Partial<ValidationRule> => ({
    minLength: length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): Partial<ValidationRule> => ({
    maxLength: length,
    message: message || `Must be no more than ${length} characters`,
  }),

  positiveNumber: (message?: string): Partial<ValidationRule> => ({
    custom: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    },
    message: message || 'Must be a positive number',
  }),

  custom: (validator: (value: any) => boolean | string, message?: string): Partial<ValidationRule> => ({
    custom: validator,
    message,
  }),
};