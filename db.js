import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';

// Polyfill require for CommonJS compatibility in ES module scope if needed
const require = createRequire(import.meta.url);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Self-test function to verify connection with Supabase
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.warn('Supabase test connection note:', error.message);
    } else {
      console.log('Supabase connection verified successfully. Products sample:', data ? data.length : 0);
    }
  } catch (err) {
    console.warn('Supabase test connection note:', err?.message || err);
  }
}

// Run test if executed directly
if (process.argv[1] && process.argv[1].endsWith('db.js')) {
  testConnection();
}

export default supabase;
