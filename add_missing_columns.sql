-- Add missing columns to users table
-- Jalankan di Supabase SQL Editor

-- Add last_active column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;

-- Add avatar_url column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing user with last_active timestamp
UPDATE public.users
SET last_active = NOW()
WHERE username = 'ardila.firdaus' AND last_active IS NULL;

-- Verifikasi kolom sudah ditambahkan
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
  AND column_name IN ('last_active', 'avatar_url', 'username', 'password_hash', 'full_name', 'role', 'is_active')
ORDER BY column_name;