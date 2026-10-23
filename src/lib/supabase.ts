import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or localStorage overrides for flexible development
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if localStorage has saved custom keys for immediate testing
export const getStoredSupabaseConfig = () => {
  if (typeof window === 'undefined') return { url: envUrl, anonKey: envAnonKey };
  const customUrl = localStorage.getItem('nm_supabase_url');
  const customKey = localStorage.getItem('nm_supabase_anon_key');
  return {
    url: customUrl || envUrl,
    anonKey: customKey || envAnonKey,
  };
};

export const saveStoredSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window === 'undefined') return;
  if (url) localStorage.setItem('nm_supabase_url', url.trim());
  else localStorage.removeItem('nm_supabase_url');

  if (anonKey) localStorage.setItem('nm_supabase_anon_key', anonKey.trim());
  else localStorage.removeItem('nm_supabase_anon_key');
};

const { url: activeUrl, anonKey: activeAnonKey } = getStoredSupabaseConfig();

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getStoredSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    !url.includes('YOUR_SUPABASE') &&
    anonKey.length > 20
  );
};

// Create the Supabase client safely so the app never throws runtime errors if keys are not yet configured
let supabaseInstance: SupabaseClient | null = null;

try {
  if (activeUrl && activeAnonKey && activeUrl.startsWith('http')) {
    supabaseInstance = createClient(activeUrl, activeAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } else {
    // Provide a dummy client when not yet configured so components don't crash on initial load
    supabaseInstance = createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key-12345678901234567890', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
} catch (err) {
  console.warn('Supabase client initialization warning:', err);
  supabaseInstance = createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key-12345678901234567890', {
    auth: { persistSession: false },
  });
}

export const supabase = supabaseInstance;
