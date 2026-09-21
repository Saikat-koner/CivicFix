import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool (Object Method)
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 15, // Concurrent capacity
      min: 0,  // Scale-to-zero friendly: allow idle connections to close naturally
      idleTimeoutMillis: 10000, // Close idle connections before server termination
      connectionTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Handle pool-level events gracefully without crashing or throwing false alarms
    global._postgresPool.on('error', (err: any) => {
      // Cloud SQL serverless scale-to-zero or admin reclamation idle drops
      const isExpectedIdleClosure =
        err?.message?.includes('terminating connection due to administrator command') ||
        err?.message?.includes('Connection terminated unexpectedly') ||
        err?.code === '57P01' || // admin_shutdown
        err?.code === '57P02' || // crash_shutdown
        err?.code === '57P03' || // cannot_connect_now
        err?.code === 'ECONNRESET';

      if (isExpectedIdleClosure) {
        // Benign serverless lifecycle event: pg pool automatically removes the client and reconnects on demand
        return;
      }

      console.warn('[PostgreSQL Pool Note]:', err?.message || err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance lazily
const pool = createPool();

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
