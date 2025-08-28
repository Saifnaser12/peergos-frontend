import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { env } from '../config/env';
import * as schema from './schema';

// Create database connection
const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from './schema';