-- CORRECTED: Complete User Management Database Setup
-- Jalankan di Supabase SQL Editor
-- Script ini akan membuat ulang seluruh struktur User Management

-- ===========================================
-- STEP 1: CLEANUP - Hapus tabel yang ada (jika ada)
-- ===========================================

-- Hapus tabel dengan urutan terbalik dependencies
DROP TABLE IF EXISTS public.user_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- ===========================================
-- STEP 2: CREATE TABLES (dengan schema public eksplisit)
-- ===========================================

-- Tabel users (custom user management, bukan auth.users)
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Operator', 'Guest')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel roles
CREATE TABLE public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel permissions
CREATE TABLE public.permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name VARCHAR(50) NOT NULL,
  permission_level VARCHAR(10) NOT NULL CHECK (permission_level IN ('NONE', 'READ', 'WRITE', 'ADMIN')),
  plant_units JSONB, -- Array of plant unit IDs for Plant Operations module
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_name, permission_level)
);

-- Tabel user_permissions
CREATE TABLE public.user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- ===========================================
-- STEP 3: CREATE INDEXES
-- ===========================================

CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_permissions_module ON public.permissions(module_name);

-- ===========================================
-- STEP 4: INSERT DEFAULT DATA
-- ===========================================

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
  ('Super Admin', 'Full access to all modules'),
  ('Admin', 'Administrative access with some restrictions'),
  ('Operator', 'Operational access to specific modules'),
  ('Guest', 'Read-only access');

-- Insert default permissions untuk setiap modul
INSERT INTO public.permissions (module_name, permission_level, plant_units) VALUES
  ('dashboard', 'READ', NULL),
  ('dashboard', 'WRITE', NULL),
  ('dashboard', 'ADMIN', NULL),
  ('plant_operations', 'READ', NULL),
  ('plant_operations', 'WRITE', NULL),
  ('plant_operations', 'ADMIN', NULL),
  ('packing_plant', 'READ', NULL),
  ('packing_plant', 'WRITE', NULL),
  ('packing_plant', 'ADMIN', NULL),
  ('project_management', 'READ', NULL),
  ('project_management', 'WRITE', NULL),
  ('project_management', 'ADMIN', NULL),
  ('system_settings', 'READ', NULL),
  ('system_settings', 'WRITE', NULL),
  ('system_settings', 'ADMIN', NULL);

-- ===========================================
-- STEP 5: CREATE TRIGGERS
-- ===========================================

-- Function untuk update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- STEP 6: VERIFICATION
-- ===========================================

-- Verifikasi semua tabel sudah terbuat
SELECT
  'public.users' as table_name,
  COUNT(*) as record_count
FROM public.users
UNION ALL
SELECT
  'public.roles' as table_name,
  COUNT(*) as record_count
FROM public.roles
UNION ALL
SELECT
  'public.permissions' as table_name,
  COUNT(*) as record_count
FROM public.permissions
UNION ALL
SELECT
  'public.user_permissions' as table_name,
  COUNT(*) as record_count
FROM public.user_permissions;

-- Tampilkan struktur tabel public.users (bukan auth.users)
SELECT
  'public.users' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Konfirmasi bahwa kita TIDAK menggunakan auth.users
SELECT 'SUCCESS: Using custom public.users table, not auth.users' as status;