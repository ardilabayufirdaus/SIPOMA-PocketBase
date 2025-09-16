-- Create default admin user for testing
-- Jalankan di Supabase SQL Editor setelah setup database selesai

-- Insert default admin user
-- Password: admin123 (hashed with SHA256)
INSERT INTO public.users (username, password_hash, full_name, role, is_active) VALUES
  ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'System Administrator', 'Super Admin', true)
ON CONFLICT (username) DO NOTHING;

-- Assign all permissions to admin user
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT
  u.id as user_id,
  p.id as permission_id
FROM public.users u
CROSS JOIN public.permissions p
WHERE u.username = 'admin'
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- Verifikasi user dan permissions
SELECT
  u.username,
  u.full_name,
  u.role,
  COUNT(up.permission_id) as total_permissions,
  STRING_AGG(p.module_name || ':' || p.permission_level, ', ') as permissions
FROM public.users u
LEFT JOIN public.user_permissions up ON u.id = up.user_id
LEFT JOIN public.permissions p ON up.permission_id = p.id
WHERE u.username = 'admin'
GROUP BY u.id, u.username, u.full_name, u.role;