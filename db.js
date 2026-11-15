import { createPool, ensureDbAvailable } from './src/db/index.ts';

export const pool = createPool();

// Self-test function to verify connection with MySQL
export async function testConnection() {
  try {
    const ok = await ensureDbAvailable(true);
    if (!ok) {
      console.warn('MySQL test connection note: database is unreachable.');
      return false;
    }
    const [rows] = await pool.query('SELECT COUNT(*) AS productCount FROM products');
    const count = Array.isArray(rows) ? rows[0]?.productCount ?? 0 : 0;
    console.log('MySQL connection verified successfully. Products count:', count);
    return true;
  } catch (err) {
    console.warn('MySQL test connection note:', err?.message || err);
    return false;
  }
}

// Run test if executed directly
if (process.argv[1] && process.argv[1].endsWith('db.js')) {
  testConnection().then((ok) => process.exit(ok ? 0 : 1));
}

export default pool;
