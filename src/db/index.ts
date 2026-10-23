import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const host = process.env.SQL_HOST || '127.0.0.1';
    const isRemote = host !== '127.0.0.1' && host !== 'localhost';
    const useSsl = process.env.SQL_SSL === 'true' || isRemote;

    global._postgresPool = new Pool({
      host: host,
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || '',
      database: process.env.SQL_DB_NAME || 'postgres',
      port: Number(process.env.SQL_PORT) || 5432,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 8000,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('Postgres pool error (non-fatal):', (err as any)?.message || err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
