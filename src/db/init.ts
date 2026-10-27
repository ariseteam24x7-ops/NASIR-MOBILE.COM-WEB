import { db, createPool, setPostgresAvailable } from './index.ts';

export async function initDatabase() {
  try {
    const pool = createPool();

    // Fast probe to verify PostgreSQL is reachable
    await pool.query('SELECT 1');
    setPostgresAvailable(true);
    console.log('PostgreSQL database connected and verified successfully');

    // Attempt table creations/verifications safely (catch DDL permission errors gracefully)
    try {
      await pool.query('SELECT 1 FROM brands LIMIT 1');
    } catch {
      // Table check attempt
    }

    // Seed default settings row if missing (DML is permitted)
    try {
      await pool.query(`
        INSERT INTO whatsapp_settings (id, primary_number, secondary_number, active_number, is_enabled)
        VALUES (1, '+971522523900', '+971563903672', '+971522523900', true)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO visitor_settings (id, is_enabled, display_mode, today_adjustment, total_adjustment)
        VALUES (1, true, 'both', 0, 0)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO security_settings (id, master_key)
        VALUES (1, 'NasirMobileDubai2026!')
        ON CONFLICT (id) DO NOTHING;
      `);
    } catch (seedErr) {
      console.warn('Note: Default settings seed note:', (seedErr as any)?.message);
    }

    setPostgresAvailable(true);
  } catch (err) {
    console.warn('PostgreSQL database probe warning:', (err as any)?.message);
    setPostgresAvailable(false);
  }
}
