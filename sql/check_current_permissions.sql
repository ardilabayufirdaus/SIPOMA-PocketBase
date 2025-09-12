-- =============================================
-- QUICK VERIFICATION: Check Current Permissions Status
-- =============================================
-- Script untuk memverifikasi status permissions saat ini

-- Check 1: Verify user_list view exists and works
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'user_list'
        AND table_schema = 'public'
    ) INTO view_exists;
    
    IF view_exists THEN
        RAISE NOTICE '✅ user_list view exists';
    ELSE
        RAISE NOTICE '❌ user_list view does not exist - need to create it';
    END IF;
END $$;

-- Check 2: Test user_list view data
SELECT 
    'Current user_list data' as test_type,
    username,
    role,
    permissions
FROM user_list 
LIMIT 3;

-- Check 3: Verify JSON structure
DO $$
DECLARE
    user_rec RECORD;
    json_test TEXT;
BEGIN
    SELECT username, permissions INTO user_rec
    FROM user_list 
    WHERE role = 'Super Admin'
    LIMIT 1;
    
    IF user_rec.permissions IS NOT NULL THEN
        -- Test if it's proper JSON
        json_test := user_rec.permissions->>'dashboard';
        RAISE NOTICE '✅ JSON permissions working for user: % - dashboard permission: %', user_rec.username, json_test;
    ELSE
        RAISE NOTICE '❌ Permissions is NULL for Super Admin user';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error reading JSON permissions: %', SQLERRM;
END $$;

-- Check 4: Show detailed permissions structure
SELECT 
    'Permissions Detail' as test_type,
    username,
    role,
    permissions->>'dashboard' as dashboard,
    permissions->>'user_management' as user_mgmt,
    jsonb_pretty(permissions->'plant_operations') as plant_ops_detail
FROM user_list 
WHERE role IN ('Super Admin', 'Viewer')
ORDER BY role;

-- Check 5: Verify all users have permissions
DO $$
DECLARE
    total_users INTEGER;
    users_with_permissions INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO users_with_permissions FROM user_permissions;
    
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with permissions: %', users_with_permissions;
    
    IF total_users = users_with_permissions THEN
        RAISE NOTICE '✅ All users have permissions assigned';
    ELSE
        RAISE NOTICE '❌ Some users missing permissions: % missing', (total_users - users_with_permissions);
    END IF;
END $$;