import { Request, Response } from 'express';
import { pool } from './db.js';

export async function healthCheck(req: Request, res: Response) {
  try {
    // Check database connection
    const dbResult = await pool.query('SELECT 1 as health_check');
    
    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: {
        connected: true,
        result: dbResult.rows[0]
      },
      environment_variables: {
        all_present: missingEnvVars.length === 0,
        missing: missingEnvVars
      }
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false
      }
    };
    
    res.status(503).json(healthStatus);
  }
}