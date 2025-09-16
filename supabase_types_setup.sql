-- Generate Supabase TypeScript types
-- Jalankan command ini di terminal untuk generate types:
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts

-- Atau jika menggunakan local development:
-- npx supabase gen types typescript --local > types/supabase.ts

-- Pastikan file types/supabase.ts di-import di utils/supabase.ts

-- Contoh konfigurasi utils/supabase.ts:
-- import { createClient } from '@supabase/supabase-js'
-- import { Database } from '../types/supabase'
--
-- const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
-- const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
--
-- export const supabase = createClient<Database>(supabaseUrl, supabaseKey)