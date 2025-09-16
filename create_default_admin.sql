-- Default Admin User Setup
-- Insert default Super Admin user dengan password hash

-- Default admin user
INSERT INTO users (id, username, full_name, role, is_active, password_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'System Administrator',
    'Super Admin',
    true,
    '$2b$10$8K3VzJcQX8zJcQX8zJcQX8zJcQX8zJcQX8zJcQX8zJcQX8zJcQX8', -- password: admin123
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Default permissions untuk admin
INSERT INTO permissions (id, module_name, permission_level, plant_units)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'dashboard', 'ADMIN', ARRAY['all']),
    ('22222222-2222-2222-2222-222222222222', 'plant_operations', 'ADMIN', ARRAY['all']),
    ('33333333-3333-3333-3333-333333333333', 'packing_plant', 'ADMIN', ARRAY['all']),
    ('44444444-4444-4444-4444-444444444444', 'project_management', 'ADMIN', ARRAY['all']),
    ('55555555-5555-5555-5555-555555555555', 'system_settings', 'ADMIN', ARRAY['all']),
    ('66666666-6666-6666-6666-666666666666', 'user_management', 'ADMIN', ARRAY['all'])
ON CONFLICT (id) DO NOTHING;

-- Assign permissions to admin user
INSERT INTO user_permissions (user_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT (user_id, permission_id) DO NOTHING;