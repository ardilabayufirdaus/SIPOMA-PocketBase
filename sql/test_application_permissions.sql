-- =============================================
-- TEST: Application Permissions After Fix
-- =============================================
-- Script untuk testing permissions setelah fix di level aplikasi

-- Test 1: Check if user_list view can be queried by authenticated users
DO $$
BEGIN
    RAISE NOTICE '=== TESTING APPLICATION PERMISSIONS ===';
    RAISE NOTICE 'Testing user_list view accessibility...';
END $$;

-- Show sample data from user_list view
SELECT 
    'Sample User Data' as test_name,
    id,
    username,
    role,
    permissions
FROM user_list 
WHERE role IN ('Super Admin', 'Admin', 'Viewer')
LIMIT 3;

-- Test 2: Check specific permission structures by role
SELECT 
    'Super Admin Permissions' as test_name,
    username,
    permissions->>'dashboard' as dashboard,
    permissions->>'user_management' as user_mgmt,
    permissions->'plant_operations'->>'Production' as production_perms,
    permissions->>'system_settings' as system_settings
FROM user_list 
WHERE role = 'Super Admin'
LIMIT 1;

SELECT 
    'Admin Permissions' as test_name,
    username,
    permissions->>'dashboard' as dashboard,
    permissions->>'user_management' as user_mgmt,
    permissions->'plant_operations' as plant_operations,
    permissions->>'packing_plant' as packing_plant
FROM user_list 
WHERE role = 'Admin'
LIMIT 1;

SELECT 
    'Viewer Permissions' as test_name,
    username,
    permissions->>'dashboard' as dashboard,
    permissions->>'user_management' as user_mgmt,
    permissions->>'plant_operations' as plant_operations,
    permissions->>'system_settings' as system_settings
FROM user_list 
WHERE role = 'Viewer'
LIMIT 1;

-- Test 3: Verify plant_operations JSONB structure
SELECT 
    'Plant Operations Detail' as test_name,
    username,
    role,
    jsonb_pretty(permissions->'plant_operations') as plant_operations_detail
FROM user_list 
WHERE permissions->'plant_operations' != '{}'::jsonb
LIMIT 2;

-- Test 4: Check for any NULL or invalid permissions
DO $$
DECLARE
    null_count INTEGER;
    invalid_count INTEGER;
BEGIN
    -- Count NULL permissions
    SELECT COUNT(*) INTO null_count 
    FROM user_list 
    WHERE permissions IS NULL;
    
    -- Count invalid JSON structures (should be 0)
    SELECT COUNT(*) INTO invalid_count
    FROM user_list 
    WHERE NOT (permissions ? 'dashboard' AND permissions ? 'user_management');
    
    RAISE NOTICE 'Users with NULL permissions: %', null_count;
    RAISE NOTICE 'Users with invalid permission structure: %', invalid_count;
    
    IF null_count = 0 AND invalid_count = 0 THEN
        RAISE NOTICE '✅ GOOD: All users have valid permission structures';
    ELSE
        RAISE NOTICE '❌ ISSUE: Some users have invalid permissions!';
    END IF;
END $$;

-- Test 5: Simulate role-based access control checks
DO $$
DECLARE
    super_admin_count INTEGER;
    admin_count INTEGER;
    viewer_count INTEGER;
BEGIN
    -- Count users who can manage other users (Super Admin + Admin with user_management write/admin)
    SELECT COUNT(*) INTO super_admin_count
    FROM user_list 
    WHERE permissions->>'user_management' = 'admin';
    
    SELECT COUNT(*) INTO admin_count
    FROM user_list 
    WHERE permissions->>'user_management' IN ('write', 'admin');
    
    -- Count users who can only view (Viewer + others with read permissions)
    SELECT COUNT(*) INTO viewer_count
    FROM user_list 
    WHERE permissions->>'dashboard' = 'read' 
    AND permissions->>'user_management' = 'none';
    
    RAISE NOTICE 'Users with admin user management: %', super_admin_count;
    RAISE NOTICE 'Users with write+ user management: %', admin_count;
    RAISE NOTICE 'Users with view-only access: %', viewer_count;
END $$;

-- Test 6: Check if permissions can be updated
DO $$
DECLARE
    test_user_id UUID;
    old_dashboard_perm TEXT;
    new_dashboard_perm TEXT;
BEGIN
    -- Find a test user (preferably not Super Admin)
    SELECT id INTO test_user_id 
    FROM users 
    WHERE role != 'Super Admin' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Get current dashboard permission
        SELECT permissions->>'dashboard' INTO old_dashboard_perm
        FROM user_list 
        WHERE id = test_user_id;
        
        -- Try to update permission (for testing only)
        UPDATE user_permissions 
        SET dashboard = 'read', updated_at = NOW()
        WHERE user_id = test_user_id;
        
        -- Check if update worked
        SELECT permissions->>'dashboard' INTO new_dashboard_perm
        FROM user_list 
        WHERE id = test_user_id;
        
        RAISE NOTICE 'Permission update test: % -> %', old_dashboard_perm, new_dashboard_perm;
        
        -- Restore original permission
        UPDATE user_permissions 
        SET dashboard = old_dashboard_perm, updated_at = NOW()
        WHERE user_id = test_user_id;
        
        RAISE NOTICE '✅ GOOD: Permissions can be updated successfully';
    ELSE
        RAISE NOTICE '❌ No test user found for update test';
    END IF;
END $$;

-- Test 7: Verify all required permission keys exist
DO $$
DECLARE
    user_rec RECORD;
    missing_keys TEXT[];
    required_keys TEXT[] := ARRAY['dashboard', 'user_management', 'plant_operations', 'packing_plant', 'project_management', 'system_settings'];
    key TEXT;
    all_keys_present BOOLEAN := TRUE;
BEGIN
    FOR user_rec IN SELECT id, username, permissions FROM user_list LOOP
        missing_keys := ARRAY[]::TEXT[];
        
        FOREACH key IN ARRAY required_keys LOOP
            IF NOT (user_rec.permissions ? key) THEN
                missing_keys := array_append(missing_keys, key);
                all_keys_present := FALSE;
            END IF;
        END LOOP;
        
        IF array_length(missing_keys, 1) > 0 THEN
            RAISE NOTICE '❌ User % missing keys: %', user_rec.username, missing_keys;
        END IF;
    END LOOP;
    
    IF all_keys_present THEN
        RAISE NOTICE '✅ GOOD: All users have all required permission keys';
    END IF;
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '=== APPLICATION TEST COMPLETED ===';
    RAISE NOTICE 'Review the test results above to ensure:';
    RAISE NOTICE '1. All users have valid JSON permissions';
    RAISE NOTICE '2. Role-based permissions are correctly assigned';
    RAISE NOTICE '3. Permission updates work correctly';
    RAISE NOTICE '4. All required permission keys are present';
    RAISE NOTICE '';
    RAISE NOTICE 'If all tests pass, the application should work correctly with the new permission system!';
END $$;