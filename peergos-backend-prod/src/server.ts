import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { env } from './config/env';
import routes from './routes';
import calculationAuditRoutes from './routes/calculation-audit';
import dataSyncRoutes from './routes/data-sync';
import documentsRoutes from './routes/documents';
import dataExportRoutes from './routes/data-export';
import dataImportRoutes from './routes/data-import';

const app = express();

// Session configuration
app.use(session({
  secret: env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS configuration
const corsOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', routes);
app.use('/', calculationAuditRoutes);
app.use('/', dataSyncRoutes);
app.use('/', documentsRoutes);
app.use('/', dataExportRoutes);
app.use('/', dataImportRoutes);

// Root health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'peergos-backend-prod'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Peergos Backend running on port ${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔒 CORS enabled for: ${corsOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;