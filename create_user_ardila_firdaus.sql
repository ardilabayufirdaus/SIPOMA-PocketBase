-- Create user ardila.firdaus with Super Admin role and full permissions
-- Jalankan di Supabase SQL Editor
-- PERHATIAN: Password disimpan dalam plain text sesuai permintaan (tidak direkomendasikan untuk production)

-- ===========================================
-- STEP 1: CREATE USER
-- ===========================================

-- Insert user ardila.firdaus
INSERT INTO public.users (username, password_hash, full_name, role, is_active, last_active) VALUES
  ('ardila.firdaus', 'admin@2025', 'Ardila Bayu Firdaus', 'Super Admin', true, NOW())
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  last_active = EXCLUDED.last_active,
  updated_at = NOW();

-- ===========================================
-- STEP 2: ASSIGN FULL PERMISSIONS
-- ===========================================

-- Delete existing permissions for this user (jika ada)
DELETE FROM public.user_permissions
WHERE user_id = (SELECT id FROM public.users WHERE username = 'ardila.firdaus');

-- Assign ALL permissions to ardila.firdaus (full access)
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT
  u.id as user_id,
  p.id as permission_id
FROM public.users u
CROSS JOIN public.permissions p
WHERE u.username = 'ardila.firdaus'
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- ===========================================
-- STEP 3: VERIFICATION
-- ===========================================

-- Verifikasi user dan permissions
SELECT
  u.id,
  u.username,
  u.full_name,
  u.role,
  u.is_active,
  COUNT(up.permission_id) as total_permissions,
  STRING_AGG(p.module_name || ':' || p.permission_level, ', ') as permissions_list
FROM public.users u
LEFT JOIN public.user_permissions up ON u.id = up.user_id
LEFT JOIN public.permissions p ON up.permission_id = p.id
WHERE u.username = 'ardila.firdaus'
GROUP BY u.id, u.username, u.full_name, u.role, u.is_active;

-- Tampilkan detail permissions per modul
SELECT
  u.username,
  p.module_name,
  p.permission_level,
  p.plant_units
FROM public.users u
JOIN public.user_permissions up ON u.id = up.user_id
JOIN public.permissions p ON up.permission_id = p.id
WHERE u.username = 'ardila.firdaus'
ORDER BY p.module_name, p.permission_level;

-- ===========================================
-- STEP 4: LOGIN TEST QUERY
-- ===========================================

-- Query untuk verifikasi login (gunakan di aplikasi)
-- SELECT * FROM public.users WHERE username = 'ardila.firdaus' AND password_hash = 'admin@2025' AND is_active = true;