-- Fix untuk foreign key constraint error
-- Jalankan di Supabase SQL Editor

-- Opsi 1: Drop dan recreate tabel yang bermasalah (RECOMMENDED)
-- Backup data penting terlebih dahulu!

-- Drop tabel dengan dependencies
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Recreate tabel permissions dengan tipe data yang benar
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name VARCHAR(50) NOT NULL,
  permission_level VARCHAR(10) NOT NULL CHECK (permission_level IN ('NONE', 'READ', 'WRITE', 'ADMIN')),
  plant_units JSONB, -- Array of plant unit IDs for Plant Operations module
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_name, permission_level)
);

-- Recreate tabel user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- Insert default permissions untuk setiap modul
INSERT INTO permissions (module_name, permission_level, plant_units) VALUES
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
  ('system_settings', 'ADMIN', NULL)
ON CONFLICT (module_name, permission_level) DO NOTHING;

-- Verifikasi
SELECT 'Users table:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Roles table:', COUNT(*) FROM roles
UNION ALL
SELECT 'Permissions table:', COUNT(*) FROM permissions
UNION ALL
SELECT 'User permissions table:', COUNT(*) FROM user_permissions;