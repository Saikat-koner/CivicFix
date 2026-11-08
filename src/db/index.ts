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
      max: 10, // Concurrent capacity
      min: 0,  // Scale-to-zero friendly: allow idle connections to close naturally
      idleTimeoutMillis: 10000, // Close idle connections after 10s to prevent stale sockets during scale-to-zero
      connectionTimeoutMillis: 30000, // Generous 30s timeout for Cloud SQL serverless scale-to-zero spinup
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });

    // Handle pool-level events gracefully without crashing or throwing false alarms
    global._postgresPool.on('error', (err: any) => {
      // Cloud SQL serverless scale-to-zero or admin reclamation idle drops
      const msg = `${err?.message || ''} ${err?.cause?.message || ''}`.toLowerCase();
      const code = String(err?.code || '');
      const isExpectedIdleClosure =
        msg.includes('terminating connection') ||
        msg.includes('connection terminated') ||
        msg.includes('connection timeout') ||
        msg.includes('timeout') ||
        msg.includes('unexpectedly') ||
        code === '57P01' || // admin_shutdown
        code === '57P02' || // crash_shutdown
        code === '57P03' || // cannot_connect_now
        code === 'ECONNRESET' ||
        code === 'ECONNREFUSED';

      if (isExpectedIdleClosure) {
        // Benign serverless lifecycle event: pg pool automatically removes the client and reconnects on demand
        return;
      }

      console.warn('[PostgreSQL Pool Note]:', err?.message || err);
    });
  }
  return global._postgresPool;
};

// Safe pool reset helper if all connections in pool become invalid
export const resetPool = async () => {
  if (global._postgresPool) {
    try {
      await global._postgresPool.end();
    } catch {
      // ignore termination errors
    }
    global._postgresPool = undefined;
  }
};

// Create or retrieve the pool instance lazily
const pool = createPool();

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
