import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// Can be configured in .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://mock-project.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjEzODg5NjAwLCJleHAiOjE5Mjk0NjU2MDB9.test';

export const isSupabaseConfigured = Boolean(
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_SUPABASE_URL &&
  import.meta.env?.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('mock-project')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
