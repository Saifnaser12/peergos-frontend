import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for development
  console.error('Error Handler:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message);
    error = { message: message.join(', '), statusCode: 400 };
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    const message = 'Database connection failed';
    error = { message, statusCode: 503 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = { message, statusCode: 413 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files uploaded';
    error = { message, statusCode: 400 };
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    const message = 'Cross-origin request not allowed';
    error = { message, statusCode: 403 };
  }

  // Tax calculation errors
  if (err.type === 'TAX_CALCULATION_ERROR') {
    const message = err.message || 'Tax calculation failed';
    error = { message, statusCode: 422 };
  }

  // FTA integration errors
  if (err.type === 'FTA_INTEGRATION_ERROR') {
    const message = err.message || 'FTA integration failed';
    error = { message, statusCode: 503 };
  }

  // UAE compliance errors
  if (err.type === 'COMPLIANCE_ERROR') {
    const message = err.message || 'Compliance validation failed';
    error = { message, statusCode: 422 };
  }

  // Business logic errors
  if (err.type === 'BUSINESS_LOGIC_ERROR') {
    const message = err.message || 'Business rule violation';
    error = { message, statusCode: 422 };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    requestId: req.id
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  // Add specific error codes for UAE tax compliance
  if (err.code) {
    errorResponse.code = err.code;
  }

  // Log error for monitoring
  if (statusCode >= 500) {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.path} - ${message}`, {
      userId: req.session?.userId,
      companyId: req.session?.companyId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      error: err
    });
  } else {
    console.warn(`[WARN ${statusCode}] ${req.method} ${req.path} - ${message}`, {
      userId: req.session?.userId,
      requestId: req.id
    });
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const message = `Route ${req.originalUrl} not found`;
  
  console.warn(`[404] ${req.method} ${req.originalUrl} - Route not found`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.id
  });

  res.status(404).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    requestId: req.id,
    suggestion: 'Check the API documentation for available endpoints'
  });
};

// Custom error classes for UAE tax system
export class TaxCalculationError extends Error {
  public statusCode: number;
  public type: string;
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'TaxCalculationError';
    this.statusCode = 422;
    this.type = 'TAX_CALCULATION_ERROR';
    this.code = code;
  }
}

export class FTAIntegrationError extends Error {
  public statusCode: number;
  public type: string;
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'FTAIntegrationError';
    this.statusCode = 503;
    this.type = 'FTA_INTEGRATION_ERROR';
    this.code = code;
  }
}

export class ComplianceError extends Error {
  public statusCode: number;
  public type: string;
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ComplianceError';
    this.statusCode = 422;
    this.type = 'COMPLIANCE_ERROR';
    this.code = code;
  }
}

export class BusinessLogicError extends Error {
  public statusCode: number;
  public type: string;
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'BusinessLogicError';
    this.statusCode = 422;
    this.type = 'BUSINESS_LOGIC_ERROR';
    this.code = code;
  }
}

// Error factory for common UAE tax errors
export const createTaxError = {
  invalidVATRate: (rate: number) => 
    new TaxCalculationError(`Invalid VAT rate: ${rate}%. UAE VAT rate is 5%`, 'INVALID_VAT_RATE'),
  
  invalidCITRate: (rate: number) => 
    new TaxCalculationError(`Invalid CIT rate: ${rate}%. UAE CIT rate is 9%`, 'INVALID_CIT_RATE'),
  
  missingTRN: () => 
    new ComplianceError('TRN (Tax Registration Number) is required for VAT-registered businesses', 'MISSING_TRN'),
  
  invalidTRN: (trn: string) => 
    new ComplianceError(`Invalid TRN format: ${trn}. TRN must be 15 digits`, 'INVALID_TRN_FORMAT'),
  
  exceedsVATThreshold: (revenue: number) => 
    new ComplianceError(`Revenue of AED ${revenue} exceeds VAT registration threshold. VAT registration required`, 'VAT_REGISTRATION_REQUIRED'),
  
  invalidFTASubmission: (reason: string) => 
    new FTAIntegrationError(`FTA submission failed: ${reason}`, 'FTA_SUBMISSION_FAILED'),
  
  invalidBusinessEntity: (entity: string) => 
    new ComplianceError(`Invalid business entity type: ${entity}. Must be UAE registered entity`, 'INVALID_BUSINESS_ENTITY'),
  
  missingAuditTrail: () => 
    new ComplianceError('Audit trail is required for tax calculations', 'MISSING_AUDIT_TRAIL'),
  
  invalidFreeZoneStatus: (zone: string) => 
    new ComplianceError(`Invalid free zone status for: ${zone}. Check QFZP eligibility`, 'INVALID_FREE_ZONE_STATUS')
};

export default {
  asyncHandler,
  errorHandler,
  notFoundHandler,
  TaxCalculationError,
  FTAIntegrationError,
  ComplianceError,
  BusinessLogicError,
  createTaxError
};