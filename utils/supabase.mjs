import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ectjrbguwmlkqfyeyfvo.supabase.co';
const supabaseAnonKey = 'sb_publishable_hyQmVEm7dnJLEa99-K7tnQ_jMvCqZc9';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
