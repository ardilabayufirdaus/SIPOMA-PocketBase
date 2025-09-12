-- =============================================
-- CREATE USER_LIST VIEW (If Not Exists)
-- =============================================
-- Script untuk memastikan view user_list ada dan berfungsi

-- Step 1: Create user_list view if it doesn't exist
CREATE OR REPLACE VIEW user_list AS
SELECT
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.avatar_url,
    u.last_active,
    u.is_active,
    u.created_at,
    u.updated_at,
    COALESCE(
        jsonb_build_object(
            'dashboard', up.dashboard,
            'user_management', up.user_management,
            'plant_operations', up.plant_operations,
            'packing_plant', up.packing_plant,
            'project_management', up.project_management,
            'system_settings', up.system_settings
        ),
        jsonb_build_object(
            'dashboard', 'read',
            'user_management', 'none',
            'plant_operations', '{}',
            'packing_plant', 'none',
            'project_management', 'none',
            'system_settings', 'none'
        )
    ) as permissions
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id;

-- Step 2: Grant permissions
GRANT SELECT ON user_list TO authenticated;

-- Step 3: Test the view
DO $$
BEGIN
    RAISE NOTICE '=== USER_LIST VIEW CREATED/UPDATED ===';
    RAISE NOTICE 'Testing view with sample data...';
END $$;

-- Show sample data from the view
SELECT 
    'View Test Results' as test_name,
    username,
    role,
    permissions->>'dashboard' as dashboard_perm,
    permissions->>'user_management' as user_mgmt_perm,
    CASE 
        WHEN permissions->'plant_operations' != '{}'::jsonb 
        THEN 'Has plant operations permissions'
        ELSE 'No plant operations permissions'
    END as plant_ops_status
FROM user_list
ORDER BY 
    CASE role
        WHEN 'Super Admin' THEN 1
        WHEN 'Admin' THEN 2
        WHEN 'Manager' THEN 3
        WHEN 'Supervisor' THEN 4
        WHEN 'Operator' THEN 5
        WHEN 'Viewer' THEN 6
        ELSE 7
    END;