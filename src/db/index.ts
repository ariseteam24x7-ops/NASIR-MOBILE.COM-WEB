import fs from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql, { Pool } from 'mysql2/promise';
import * as schema from './schema.ts';

declare global {
  var _mysqlPool: Pool | undefined;
}

export let isDbAvailable = false;
let lastVerifiedAt = 0;
const HEALTH_TTL_MS = 10_000;

export const setDbAvailable = (val: boolean) => {
  isDbAvailable = val;
  lastVerifiedAt = val ? Date.now() : 0;
};

function resolveStagingPassword(): string {
  if (process.env.HOSTINGER_STAGING_MYSQL_PASSWORD) {
    return process.env.HOSTINGER_STAGING_MYSQL_PASSWORD;
  }
  try {
    if (fs.existsSync('/app/.dev.pid')) {
      const pid = fs.readFileSync('/app/.dev.pid', 'utf8').trim();
      const raw = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
      for (const entry of raw.split('\0')) {
        if (entry.startsWith('HOSTINGER_STAGING_MYSQL_PASSWORD=')) {
          return entry.slice('HOSTINGER_STAGING_MYSQL_PASSWORD='.length);
        }
      }
    }
  } catch {}
  return '';
}

export function isTransientDbError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  const code = String(err.code || '').toUpperCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('connection lost') ||
    msg.includes('server has gone away') ||
    msg.includes('too many connections') ||
    msg.includes('timeout') ||
    msg.includes('socket closed') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('epipe') ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
    code === 'PROTOCOL_ENQUEUE_AFTER_QUIT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'EPIPE' ||
    code === 'ER_CON_COUNT_ERROR'
  );
}

let probePromise: Promise<boolean> | null = null;

export const dbPing = async (): Promise<boolean> => {
  try {
    const p = createPool();
    await p.query('SELECT 1');
    setDbAvailable(true);
    return true;
  } catch {
    setDbAvailable(false);
    return false;
  }
};

export const ensureDbAvailable = async (force = false): Promise<boolean> => {
  if (!force && isDbAvailable && Date.now() - lastVerifiedAt < HEALTH_TTL_MS) {
    return true;
  }
  if (probePromise) return probePromise;

  probePromise = (async () => {
    try {
      const p = createPool();
      await p.query('SELECT 1');
      setDbAvailable(true);
      return true;
    } catch {
      setDbAvailable(false);
      return false;
    } finally {
      probePromise = null;
    }
  })();

  return probePromise;
};

export const createPool = (): Pool => {
  if (!global._mysqlPool) {
    const rawHost = process.env.MYSQL_HOST || process.env.SQL_HOST || '';
    const rawDb = process.env.MYSQL_DATABASE || process.env.SQL_DB_NAME || '';

    // Staging mode is activated ONLY when explicitly requested via USE_STAGING_DB === 'true'
    const isHostingerStaging = process.env.USE_STAGING_DB === 'true';

    let pool: Pool;

    if (isHostingerStaging) {
      // Direct IPv4 route with SNI hostname for TLS certificate verification
      const host = '153.92.15.70';
      const port = 3306;
      const user = 'u609585964_STAGING_USER';
      const stagingPassword = resolveStagingPassword();
      if (!stagingPassword) {
        throw new Error(
          'HOSTINGER_STAGING_MYSQL_PASSWORD secret is absent. Staging connection refused to prevent fallback to production credentials.'
        );
      }
      const database = 'u609585964_STAGING_DB';

      pool = mysql.createPool({
        host,
        port,
        user,
        password: stagingPassword,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 5000,
        ssl: {
          rejectUnauthorized: true,
          servername: 'srv1980.hstgr.io',
        } as any,
      });
    } else {
      let host = rawHost || '127.0.0.1';
      let socketPath: string | undefined = undefined;

      // Handle unix domain sockets or non-standard instance strings
      if (host.startsWith('/')) {
        if (host.endsWith('.sock')) {
          socketPath = host;
          host = undefined as any;
        } else {
          // Directory path; fallback to TCP loopback
          host = '127.0.0.1';
        }
      }

      const port = Number(process.env.MYSQL_PORT || process.env.SQL_PORT) || 3306;
      const user = process.env.MYSQL_USER || process.env.SQL_USER || 'root';
      const password = process.env.MYSQL_PASSWORD || process.env.SQL_PASSWORD || '';
      const database = rawDb || 'nasirmobile';
      const useSsl = process.env.SQL_SSL === 'true' || process.env.MYSQL_SSL === 'true';
      const tlsServername = process.env.MYSQL_TLS_SERVERNAME || (useSsl && host !== '127.0.0.1' ? host : 'srv1980.hstgr.io');

      pool = mysql.createPool({
        host: socketPath ? undefined : host,
        socketPath: socketPath,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 5000,
        ssl: useSsl
          ? ({ rejectUnauthorized: true, servername: tlsServername } as any)
          : undefined,
      });
    }

    (pool as any).on('error', (err: any) => {
      console.warn('MySQL pool error detected; marking connection offline for re-probe:', err?.message || 'Database connection error');
      if (isTransientDbError(err)) {
        setDbAvailable(false);
      }
    });

    global._mysqlPool = pool;
  }
  return global._mysqlPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema, mode: 'default' });

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withTransaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T> {
  try {
    return await db.transaction(async (tx) => fn(tx));
  } catch (err) {
    if (isTransientDbError(err)) {
      setDbAvailable(false);
    }
    throw err;
  }
}
