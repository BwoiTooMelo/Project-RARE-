import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

// The anon key is safe to expose in client-side code by design — it only
// grants the access allowed by the project's Row Level Security policies
// (see supabase/migrations/001_create_profiles.sql). It is NOT a secret.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
