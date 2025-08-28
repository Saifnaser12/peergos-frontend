import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Generate unique request ID
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.id}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow eval for development
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
});

// Rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 API requests per minute
  message: {
    error: 'API rate limit exceeded, please slow down your requests.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
}

function sanitizeValue(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Remove potentially dangerous patterns
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// CORS configuration for UAE compliance
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Development origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      /\.replit\.dev$/,
      /\.replit\.app$/,
      /\.repl\.co$/
    ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-API-Key'
  ]
};

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  next();
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    
    const userRole = req.session.userRole || 'SME_CLIENT';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole(['ADMIN']);

// Accountant or Admin middleware
export const requireAccountantOrAdmin = requireRole(['ADMIN', 'ACCOUNTANT']);

// API key authentication for integrations
export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the X-API-Key header'
    });
  }
  
  // In production, validate against stored API keys
  // For now, accept any non-empty key
  if (apiKey.length < 10) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }
  
  next();
};

// IP whitelist middleware for sensitive operations
export const requireWhitelistedIP = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (!clientIP || !allowedIPs.includes(clientIP as string)) {
      console.warn(`Blocked request from non-whitelisted IP: ${clientIP}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource'
      });
    }
    
    next();
  };
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request body validation failed',
        details: error.errors || error.message
      });
    }
  };
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId;
    const companyId = req.session?.companyId;
    const timestamp = new Date().toISOString();
    
    // Log the action (in production, this would go to a proper audit table)
    console.log(`[AUDIT] ${timestamp} - User:${userId} Company:${companyId} Action:${action} IP:${req.ip} UserAgent:${req.headers['user-agent']}`);
    
    next();
  };
};

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export default {
  requestId,
  requestLogger,
  securityHeaders,
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  sanitizeInput,
  corsOptions,
  requireAuth,
  requireRole,
  requireAdmin,
  requireAccountantOrAdmin,
  requireApiKey,
  requireWhitelistedIP,
  validateRequest,
  auditLog
};