import { z } from 'zod';

// Common validation patterns for UAE business context
export const ValidationPatterns = {
  // UAE TRN (Tax Registration Number) - 15 digits
  TRN: /^\d{15}$/,
  
  // UAE Trade License - various formats
  TRADE_LICENSE: /^[A-Z0-9\-]{5,20}$/,
  
  // UAE Phone - +971 followed by 8-9 digits
  UAE_PHONE: /^(\+971|00971|971)?([2-9]\d{7,8})$/,
  
  // IBAN for UAE banks
  UAE_IBAN: /^AE\d{2}\d{3}\d{16}$/,
  
  // Emirates ID - 15 digits starting with 784
  EMIRATES_ID: /^784\d{12}$/,
  
  // VAT number format
  VAT_NUMBER: /^\d{15}$/,
  
  // Invoice number patterns
  INVOICE_NUMBER: /^[A-Z]{2,5}-\d{4}-\d{3,6}$/,
  
  // Amount validation (positive with up to 2 decimals)
  AMOUNT: /^\d+(\.\d{1,2})?$/,
  
  // Reference number (alphanumeric with hyphens)
  REFERENCE: /^[A-Z0-9\-]{3,20}$/,
};

// Common validation functions
export const ValidationFunctions = {
  // Validate UAE TRN
  validateTRN: (value: string): string | null => {
    if (!value) return null;
    if (!ValidationPatterns.TRN.test(value)) {
      return 'TRN must be exactly 15 digits';
    }
    return null;
  },

  // Validate UAE phone number
  validateUAEPhone: (value: string): string | null => {
    if (!value) return null;
    if (!ValidationPatterns.UAE_PHONE.test(value)) {
      return 'Please enter a valid UAE phone number';
    }
    return null;
  },

  // Validate trade license
  validateTradeLicense: (value: string): string | null => {
    if (!value) return null;
    if (!ValidationPatterns.TRADE_LICENSE.test(value)) {
      return 'Trade license format is invalid';
    }
    return null;
  },

  // Validate Emirates ID
  validateEmiratesID: (value: string): string | null => {
    if (!value) return null;
    if (!ValidationPatterns.EMIRATES_ID.test(value)) {
      return 'Emirates ID must be 15 digits starting with 784';
    }
    return null;
  },

  // Validate amount (positive with up to 2 decimals)
  validateAmount: (value: string): string | null => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num <= 0) return 'Amount must be greater than 0';
    if (num > 1000000000) return 'Amount exceeds maximum limit (1 billion AED)';
    if (!ValidationPatterns.AMOUNT.test(value)) {
      return 'Amount can have at most 2 decimal places';
    }
    return null;
  },

  // Validate percentage (0-100)
  validatePercentage: (value: string): string | null => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num < 0 || num > 100) return 'Percentage must be between 0 and 100';
    return null;
  },

  // Validate date is not in future (for certain contexts)
  validatePastDate: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    if (date > today) return 'Date cannot be in the future';
    return null;
  },

  // Validate date is not too old (e.g., for transactions)
  validateRecentDate: (value: string, maxYearsOld = 7): string | null => {
    if (!value) return null;
    const date = new Date(value);
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - maxYearsOld);
    if (date < cutoffDate) {
      return `Date cannot be more than ${maxYearsOld} years old`;
    }
    return null;
  },

  // Validate invoice number format
  validateInvoiceNumber: (value: string): string | null => {
    if (!value) return null;
    if (!ValidationPatterns.INVOICE_NUMBER.test(value)) {
      return 'Invoice number format: XXX-YYYY-NNNN (e.g., INV-2025-0001)';
    }
    return null;
  },
};

// Common Zod schemas for reuse
export const CommonSchemas = {
  // UAE TRN schema
  uaeTRN: z.string().refine(
    (val) => ValidationFunctions.validateTRN(val) === null,
    { message: 'Invalid UAE TRN format' }
  ),

  // UAE phone schema
  uaePhone: z.string().refine(
    (val) => ValidationFunctions.validateUAEPhone(val) === null,
    { message: 'Invalid UAE phone number' }
  ),

  // Trade license schema
  tradeLicense: z.string().refine(
    (val) => ValidationFunctions.validateTradeLicense(val) === null,
    { message: 'Invalid trade license format' }
  ),

  // Emirates ID schema
  emiratesID: z.string().refine(
    (val) => ValidationFunctions.validateEmiratesID(val) === null,
    { message: 'Invalid Emirates ID' }
  ),

  // Amount schema (positive with 2 decimals max)
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(1000000000, 'Amount exceeds maximum limit'),

  // Percentage schema
  percentage: z.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100'),

  // Date in the past
  pastDate: z.string().refine(
    (val) => ValidationFunctions.validatePastDate(val) === null,
    { message: 'Date cannot be in the future' }
  ),

  // Invoice number schema
  invoiceNumber: z.string().refine(
    (val) => ValidationFunctions.validateInvoiceNumber(val) === null,
    { message: 'Invalid invoice number format' }
  ),

  // Email with common UAE domains
  uaeEmail: z.string()
    .email('Invalid email format')
    .refine(
      (val) => {
        const commonUAEDomains = ['.ae', 'gmail.com', 'outlook.com', 'hotmail.com'];
        return commonUAEDomains.some(domain => val.toLowerCase().includes(domain));
      },
      { message: 'Please use a valid email address' }
    ),
};

// Helper to format validation error messages
export const formatValidationErrors = (errors: Record<string, any>): string[] => {
  const errorMessages: string[] = [];
  
  Object.entries(errors).forEach(([field, error]) => {
    if (error?.message) {
      errorMessages.push(`${field}: ${error.message}`);
    }
  });
  
  return errorMessages;
};

// Helper to check form completion percentage
export const calculateFormCompletion = (
  data: Record<string, any>,
  requiredFields: string[]
): number => {
  let completedFields = 0;
  
  requiredFields.forEach(field => {
    const value = data[field];
    if (value !== undefined && value !== null && value !== '') {
      completedFields++;
    }
  });
  
  return (completedFields / requiredFields.length) * 100;
};

// Helper to generate field suggestions based on partial input
export const generateFieldSuggestions = (
  field: string,
  input: string,
  suggestions: Record<string, string[]>
): string[] => {
  const fieldSuggestions = suggestions[field] || [];
  if (!input) return fieldSuggestions.slice(0, 5);
  
  return fieldSuggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(input.toLowerCase())
    )
    .slice(0, 5);
};

// Real-time validation debounce helper
export const createDebouncedValidator = (
  validator: (value: string) => string | null,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: string, callback: (error: string | null) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const error = validator(value);
      callback(error);
    }, delay);
  };
};