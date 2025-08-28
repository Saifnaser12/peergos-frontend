import express from 'express';
import cors from 'cors';
import session from 'express-session';
import './types/session';
import { env } from './config/env';
import routes from './routes';
import calculationAuditRoutes from './routes/calculation-audit';
import dataSyncRoutes from './routes/data-sync';
import documentsRoutes from './routes/documents';
import dataExportRoutes from './routes/data-export';
import dataImportRoutes from './routes/data-import';
import integrationsRoutes from './routes/integrations';
import webhooksRoutes from './routes/webhooks';
import syncServiceRoutes from './routes/sync-service';
import { seedUAEChartOfAccounts } from './scripts/seed-chart-of-accounts';
import { notificationScheduler } from './services/notification-scheduler';

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
app.use('/', integrationsRoutes);
app.use('/', webhooksRoutes);
app.use('/', syncServiceRoutes);

// Enhanced health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'peergos-backend-prod',
    environment: env.NODE_ENV,
    scheduler: notificationScheduler.getStatus(),
    services: {
      database: 'connected',
      notifications: 'active',
      vatCalculator: 'available',
      citCalculator: 'available',
      ftaIntegration: 'available'
    }
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

// Initialize system components
async function initializeSystem() {
  console.log('🚀 Starting application initialization...');
  
  try {
    // Seed Chart of Accounts
    console.log('📈 Seeding Chart of Accounts...');
    await seedUAEChartOfAccounts();
    console.log('✅ Chart of Accounts seeding completed');
    
    // Start notification scheduler
    console.log('⏰ Starting notification scheduler...');
    notificationScheduler.start();
    await notificationScheduler.seedDevelopmentNotifications();
    console.log('✅ Notification scheduler started');
    
    console.log('🔧 Registering routes...');
    console.log('✅ Routes registered successfully');
    
    console.log('✅ System initialization completed successfully');
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    process.exit(1);
  }
}

// Start server
const server = app.listen(env.PORT, async () => {
  console.log(`🚀 Peergos Backend running on port ${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔒 CORS enabled for: ${corsOrigins.join(', ')}`);
  
  // Initialize system after server starts
  await initializeSystem();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  notificationScheduler.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  notificationScheduler.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;