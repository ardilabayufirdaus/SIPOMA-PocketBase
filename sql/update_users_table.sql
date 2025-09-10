-- SQL Script untuk update tabel users berdasarkan data yang ada saat ini
-- Menambahkan kolom password dan menghapus kolom department

-- =====================================================
-- 1. TAMBAHKAN KOLOM PASSWORD KE TABEL USERS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'Sipoma2025';
        RAISE NOTICE 'Added password column to users table';
    END IF;
END $$;

-- =====================================================
-- 2. HAPUS KOLOM DEPARTMENT
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'department') THEN
        ALTER TABLE users DROP COLUMN department;
        RAISE NOTICE 'Dropped department column from users table';
    END IF;
END $$;

-- =====================================================
-- 3. TAMBAHKAN UNIQUE CONSTRAINT UNTUK EMAIL
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'users' AND constraint_name = 'users_email_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on email column';
    END IF;
END $$;

-- =====================================================
-- 4. UPDATE PASSWORD UNTUK USER YANG SUDAH ADA
-- =====================================================

UPDATE users SET password = 'Sipoma2025' WHERE password IS NULL OR password = '';

-- =====================================================
-- 4. TAMBAHKAN UNIQUE CONSTRAINT UNTUK EMAIL
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'users' AND constraint_name = 'users_email_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on email column';
    END IF;
END $$;

-- =====================================================
-- 5. VERIFIKASI STRUKTUR TABEL
-- =====================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 5. CEK DATA USER SETELAH UPDATE
-- =====================================================

SELECT id, full_name, email, role, password, is_active, created_at
FROM users
ORDER BY created_at DESC;

-- =====================================================
-- CATATAN:
-- =====================================================
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Backup database terlebih dahulu
-- 3. Semua user akan punya password default: Sipoma2025
-- 4. Kolom department akan dihapus dari tabel
-- 5. Setelah menjalankan, test login dengan salah satu user yang ada
