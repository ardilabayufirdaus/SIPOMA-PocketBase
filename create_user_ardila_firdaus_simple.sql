-- SIMPLE VERSION: Copy dan jalankan di Supabase SQL Editor
-- User: ardila.firdaus
-- Password: admin@2025 (plain text)
-- Role: Super Admin
-- Access: Full permissions untuk semua modul

-- 1. Create user
INSERT INTO public.users (username, password_hash, full_name, role, is_active, last_active) VALUES
  ('ardila.firdaus', 'admin@2025', 'Ardila Bayu Firdaus', 'Super Admin', true, NOW())
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  last_active = EXCLUDED.last_active;

-- 2. Assign all permissions
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM public.users u
CROSS JOIN public.permissions p
WHERE u.username = 'ardila.firdaus'
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- 3. Verify
SELECT u.username, COUNT(up.*) as permissions_count
FROM public.users u
LEFT JOIN public.user_permissions up ON u.id = up.user_id
WHERE u.username = 'ardila.firdaus'
GROUP BY u.id, u.username;