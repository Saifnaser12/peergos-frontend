import { config } from 'dotenv';

// Load environment variables
config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8080', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

// Validate required environment variables
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (env.NODE_ENV === 'production' && env.SESSION_SECRET === 'dev-secret-change-in-production') {
  throw new Error('SESSION_SECRET must be set for production');
}