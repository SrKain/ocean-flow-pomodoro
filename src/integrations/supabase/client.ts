// Supabase client with graceful offline fallback
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envKey &&
  !envUrl.includes('placeholder')
);

const SUPABASE_URL = envUrl || 'https://placeholder.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: isSupabaseConfigured,
  }
});