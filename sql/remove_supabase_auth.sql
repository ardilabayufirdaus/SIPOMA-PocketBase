-- SQL Script untuk menghapus wiring authentication Supabase
-- dan mengganti dengan sistem login berbasis tabel users

-- =====================================================
-- 0. TAMBAHKAN KOLOM PASSWORD KE TABEL USERS
-- =====================================================

-- Tambahkan kolom password jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password TEXT;
        RAISE NOTICE 'Added password column to users table';
    END IF;
END $$;

-- =====================================================
-- 1. HAPUS FOREIGN KEY CONSTRAINT yang menghubungkan users dengan auth.users
-- =====================================================

-- Cek dan hapus foreign key constraint jika ada
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Cari nama constraint foreign key
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'users'
      AND att.attname = 'id'
      AND con.contype = 'f';

    -- Jika ditemukan, hapus constraint
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    END IF;
END $$;

-- =====================================================
-- 2. DISABLE RLS pada tabel users (karena kita tidak menggunakan auth.users lagi)
-- =====================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP semua policies yang terkait dengan auth
-- =====================================================

-- Drop policies untuk tabel users
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Drop policies untuk tabel lain yang mungkin bergantung pada auth
-- Catatan: Skip drop policies untuk tabel profiles karena tidak ada di schema ini
-- DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
-- DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- =====================================================
-- 3. ENABLE RLS kembali dengan policies sederhana (jika diperlukan)
-- =====================================================

-- Jika Anda ingin tetap menggunakan RLS untuk keamanan dasar:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy sederhana untuk tabel users (semua bisa read, hanya admin bisa write)
-- CREATE POLICY "Allow read access to all authenticated users" ON users
-- FOR SELECT USING (true);

-- CREATE POLICY "Allow admin write access" ON users
-- FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM users u
--     WHERE u.id = auth.uid()
--     AND u.role IN ('Super Admin', 'Admin')
--   )
-- );

-- =====================================================
-- 4. Hapus atau disable auth-related functions/triggers jika ada
-- =====================================================

-- Hapus trigger yang mungkin terkait dengan auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- =====================================================
-- 5. Insert user default untuk testing (opsional)
-- =====================================================

-- Insert Super Admin default jika belum ada
-- Hapus dulu user dengan id sama jika ada untuk menghindari foreign key constraint error
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

INSERT INTO users (id, full_name, email, password, role, department, is_active, permissions, created_at, last_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Super Admin',
  'admin@sipoma.com',
  'Sipoma2025',
  'Super Admin',
  'IT',
  true,
  '{
    "dashboard": "admin",
    "user_management": "admin",
    "plant_operations": {
      "Production": {"Unit 1": "admin", "Unit 2": "admin"},
      "Quality Control": {"QC Lab": "admin"},
      "Control Room": {"CCR": "admin"}
    },
    "packing_plant": "admin",
    "project_management": "admin",
    "system_settings": "admin"
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Admin default
INSERT INTO users (id, full_name, email, password, role, department, is_active, permissions, created_at, last_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Admin User',
  'admin2@sipoma.com',
  'Sipoma2025',
  'Admin',
  'Operations',
  true,
  '{
    "dashboard": "admin",
    "user_management": "admin",
    "plant_operations": {
      "Production": {"Unit 1": "admin", "Unit 2": "admin"},
      "Quality Control": {"QC Lab": "admin"},
      "Control Room": {"CCR": "admin"}
    },
    "packing_plant": "admin",
    "project_management": "admin",
    "system_settings": "write"
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. Verifikasi perubahan
-- =====================================================

-- Cek apakah tabel users bisa diakses tanpa auth
-- SELECT COUNT(*) FROM users;

-- Cek policies yang tersisa
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';

-- =====================================================
-- CATATAN PENTING:
-- =====================================================
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Pastikan backup database sebelum menjalankan
-- 3. Setelah menjalankan, test login dengan:
--    - Email: admin@sipoma.com
--    - Password: Sipoma2025 (default password)
-- 4. Jika ada error, periksa console browser untuk detail error
-- 5. Pastikan environment variable SUPABASE_URL dan SUPABASE_ANON_KEY sudah benar
