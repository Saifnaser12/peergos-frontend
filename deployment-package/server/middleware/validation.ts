import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error-handler';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          `Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      throw error;
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          `Query validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      throw error;
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          `Parameter validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      throw error;
    }
  };
};

// Common validation schemas
import { z } from 'zod';

export const commonSchemas = {
  // UAE-specific validation
  emiratesId: z.string().regex(/^\d{3}-\d{4}-\d{7}-\d{1}$/, 'Invalid Emirates ID format'),
  tradeNumber: z.string().regex(/^\d{6,15}$/, 'Invalid trade license number'),
  vatNumber: z.string().regex(/^100\d{12}$/, 'Invalid UAE VAT number format'),
  
  // Financial validation
  amount: z.number().min(0, 'Amount must be positive').max(999999999.99, 'Amount too large'),
  percentage: z.number().min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100%'),
  currency: z.enum(['AED', 'USD', 'EUR'], { message: 'Invalid currency code' }),
  
  // Date validation
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  taxPeriod: z.string().regex(/^\d{4}-(Q[1-4]|M(0[1-9]|1[0-2]))$/, 'Invalid tax period format'),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20)
  }),
  
  // ID validation
  id: z.coerce.number().positive('ID must be a positive number'),
  uuid: z.string().uuid('Invalid UUID format')
};

// UAE FTA-specific validation schemas
export const ftaSchemas = {
  vatReturn: z.object({
    period: commonSchemas.taxPeriod,
    totalSales: commonSchemas.amount,
    totalPurchases: commonSchemas.amount,
    vatOnSales: commonSchemas.amount,
    vatOnPurchases: commonSchemas.amount,
    netVatDue: z.number(),
    adjustments: commonSchemas.amount.optional(),
    penalties: commonSchemas.amount.optional()
  }),
  
  citReturn: z.object({
    period: z.string().regex(/^\d{4}$/, 'Invalid tax year format'),
    taxableIncome: commonSchemas.amount,
    taxDue: commonSchemas.amount,
    smallBusinessRelief: z.boolean().default(false),
    qualifiedFreeZone: z.boolean().default(false),
    foreignTaxCredits: commonSchemas.amount.optional()
  }),
  
  einvoice: z.object({
    invoiceNumber: z.string().min(1, 'Invoice number required'),
    issueDate: commonSchemas.dateString,
    dueDate: commonSchemas.dateString.optional(),
    supplierVat: commonSchemas.vatNumber,
    customerVat: commonSchemas.vatNumber.optional(),
    lineItems: z.array(z.object({
      description: z.string().min(1, 'Item description required'),
      quantity: z.number().positive('Quantity must be positive'),
      unitPrice: commonSchemas.amount,
      vatRate: z.enum(['0', '5'], { message: 'VAT rate must be 0% or 5%' }),
      vatAmount: commonSchemas.amount,
      totalAmount: commonSchemas.amount
    })).min(1, 'At least one line item required'),
    totalAmount: commonSchemas.amount,
    totalVat: commonSchemas.amount,
    grandTotal: commonSchemas.amount
  })
};

// Business rule validation
export const businessRuleValidation = {
  validateVatCalculation: (req: Request, res: Response, next: NextFunction) => {
    const { amount, vatRate } = req.body;
    
    // UAE VAT rate validation
    if (vatRate && ![0, 5].includes(vatRate)) {
      throw new ValidationError('VAT rate must be 0% or 5% according to UAE FTA regulations');
    }
    
    // VAT calculation validation
    if (amount && vatRate) {
      const expectedVat = amount * (vatRate / 100);
      const providedVat = req.body.vatAmount;
      
      if (providedVat && Math.abs(expectedVat - providedVat) > 0.01) {
        throw new ValidationError('VAT calculation does not match expected amount');
      }
    }
    
    next();
  },
  
  validateCitCalculation: (req: Request, res: Response, next: NextFunction) => {
    const { taxableIncome, smallBusinessRelief, qualifiedFreeZone } = req.body;
    
    // Small Business Relief validation
    if (smallBusinessRelief && taxableIncome > 3000000) {
      throw new ValidationError('Small Business Relief not applicable for income above AED 3M');
    }
    
    // QFZP validation
    if (qualifiedFreeZone && smallBusinessRelief) {
      throw new ValidationError('Cannot apply both QFZP and Small Business Relief');
    }
    
    next();
  },
  
  validateTaxPeriod: (req: Request, res: Response, next: NextFunction) => {
    const { period } = req.body;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    if (period) {
      const year = parseInt(period.split('-')[0]);
      
      // Cannot file for future periods
      if (year > currentYear) {
        throw new ValidationError('Cannot file tax returns for future periods');
      }
      
      // Cannot file for periods more than 7 years ago (UAE record keeping requirement)
      if (year < currentYear - 7) {
        throw new ValidationError('Cannot file returns for periods older than 7 years');
      }
    }
    
    next();
  }
};