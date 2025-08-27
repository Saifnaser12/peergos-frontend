import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
// @ts-ignore - helmet may not have perfect types
import helmet from 'helmet';
import crypto from 'crypto';

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development to avoid proxy issues
    skip: (req) => process.env.NODE_ENV === 'development',
    // Use Redis in production for distributed rate limiting
    store: process.env.NODE_ENV === 'production' ? undefined : undefined
  });
};

// Different rate limits for different endpoints
export const generalRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes
export const taxCalculationRateLimit = createRateLimit(60 * 1000, 20); // 20 calculations per minute
export const fileUploadRateLimit = createRateLimit(60 * 1000, 10); // 10 uploads per minute

// Security headers middleware with development-friendly CSP
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.tax.gov.ae", "wss://localhost:*"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
});

// Request ID middleware for tracing
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'];

  // Log request
  console.log(JSON.stringify({
    type: 'request',
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    companyId: (req as any).user?.companyId
  }));

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      type: 'response',
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length') || 0
    }));
  });

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common XSS patterns
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

// Data encryption utilities for sensitive financial data
export const encrypt = (text: string, key: string = process.env.ENCRYPTION_KEY || 'default-key'): string => {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedData: string, key: string = process.env.ENCRYPTION_KEY || 'default-key'): string => {
  const algorithm = 'aes-256-gcm';
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher(algorithm, key);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Financial data masking for logs
export const maskSensitiveData = (data: any): any => {
  const sensitiveFields = ['amount', 'salary', 'revenue', 'tax', 'vat', 'income', 'expense'];
  
  const mask = (obj: any): any => {
    if (typeof obj === 'number' && obj > 1000) {
      return '***MASKED***';
    }
    
    if (typeof obj === 'string' && /^\d+(\.\d{2})?$/.test(obj)) {
      return '***MASKED***';
    }
    
    if (Array.isArray(obj)) {
      return obj.map(mask);
    }
    
    if (obj && typeof obj === 'object') {
      const masked: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          masked[key] = '***MASKED***';
        } else {
          masked[key] = mask(value);
        }
      }
      return masked;
    }
    
    return obj;
  };
  
  return mask(data);
};