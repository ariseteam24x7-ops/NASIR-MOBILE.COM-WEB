import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export let isPostgresAvailable = false;

export const setPostgresAvailable = (val: boolean) => {
  isPostgresAvailable = val;
};

export const createPool = () => {
  if (!global._postgresPool) {
    const host = process.env.SQL_HOST || '127.0.0.1';
    const isUnixSocket = host.startsWith('/');

    // Cloud SQL Unix domain sockets (/app/cloudsql/...) and local environments do NOT support SSL.
    // Only remote TCP connections should use SSL if explicitly requested via SQL_SSL === 'true'.
    const useSsl = !isUnixSocket && process.env.SQL_SSL === 'true';

    global._postgresPool = new Pool({
      host: host,
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || '',
      database: process.env.SQL_DB_NAME || 'postgres',
      port: Number(process.env.SQL_PORT) || 5432,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 5000,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL pool background error:', err?.message);
      isPostgresAvailable = false;
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
