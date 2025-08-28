import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';

const app = express();

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