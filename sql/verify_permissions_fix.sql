-- =============================================
-- VERIFICATION: Check Permissions Fix Results
-- =============================================
-- Script untuk verifikasi bahwa fix permissions sudah berhasil

-- Check 1: Verify users table structure (should NOT have permissions column)
DO $$
DECLARE
    has_permissions_col BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'permissions'
        AND table_schema = 'public'
    ) INTO has_permissions_col;
    
    IF has_permissions_col THEN
        RAISE NOTICE '❌ ISSUE: users table still has permissions column!';
    ELSE
        RAISE NOTICE '✅ GOOD: users table does not have permissions column';
    END IF;
END $$;

-- Check 2: Verify user_permissions table exists
DO $$
DECLARE
    table_exists BOOLEAN;
    permissions_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_permissions'
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO permissions_count FROM user_permissions;
        RAISE NOTICE '✅ GOOD: user_permissions table exists with % records', permissions_count;
    ELSE
        RAISE NOTICE '❌ ISSUE: user_permissions table does not exist!';
    END IF;
END $$;

-- Check 3: Verify user_list view exists and returns proper JSON
DO $$
DECLARE
    view_exists BOOLEAN;
    sample_permissions JSONB;
    sample_username TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'user_list'
        AND table_schema = 'public'
    ) INTO view_exists;
    
    IF view_exists THEN
        -- Get a sample record to check JSON structure
        SELECT username, permissions INTO sample_username, sample_permissions
        FROM user_list 
        LIMIT 1;
        
        IF sample_permissions IS NOT NULL AND jsonb_typeof(sample_permissions) = 'object' THEN
            RAISE NOTICE '✅ GOOD: user_list view returns proper JSON permissions for user: %', sample_username;
            RAISE NOTICE 'Sample permissions structure: %', sample_permissions;
        ELSE
            RAISE NOTICE '❌ ISSUE: user_list view permissions are not proper JSON!';
        END IF;
    ELSE
        RAISE NOTICE '❌ ISSUE: user_list view does not exist!';
    END IF;
END $$;

-- Check 4: Verify all users have permissions assigned
DO $$
DECLARE
    total_users INTEGER;
    users_with_permissions INTEGER;
    users_without_permissions INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO users_with_permissions FROM user_permissions;
    
    users_without_permissions := total_users - users_with_permissions;
    
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with permissions: %', users_with_permissions;
    RAISE NOTICE 'Users without permissions: %', users_without_permissions;
    
    IF users_without_permissions = 0 THEN
        RAISE NOTICE '✅ GOOD: All users have permissions assigned';
    ELSE
        RAISE NOTICE '❌ ISSUE: % users are missing permissions!', users_without_permissions;
    END IF;
END $$;

-- Check 5: Show summary of users and their permissions
RAISE NOTICE '=== USER PERMISSIONS SUMMARY ===';

DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN 
        SELECT username, role, 
               permissions->>'dashboard' as dashboard_perm,
               permissions->>'user_management' as user_mgmt_perm,
               permissions->>'system_settings' as system_perm
        FROM user_list 
        ORDER BY role, username
    LOOP
        RAISE NOTICE 'User: % | Role: % | Dashboard: % | User Mgmt: % | System: %', 
            user_rec.username, user_rec.role, 
            user_rec.dashboard_perm, user_rec.user_mgmt_perm, user_rec.system_perm;
    END LOOP;
END $$;

-- Check 6: Verify RLS policies are in place
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_permissions';
    
    IF policy_count >= 2 THEN
        RAISE NOTICE '✅ GOOD: RLS policies are configured for user_permissions table';
    ELSE
        RAISE NOTICE '❌ ISSUE: Missing RLS policies for user_permissions table!';
    END IF;
END $$;

-- Check 7: Test JSON structure integrity
DO $$
DECLARE
    user_rec RECORD;
    json_valid BOOLEAN := TRUE;
BEGIN
    FOR user_rec IN 
        SELECT id, username, permissions 
        FROM user_list 
    LOOP
        -- Try to access nested JSON properties
        BEGIN
            PERFORM user_rec.permissions->>'dashboard';
            PERFORM user_rec.permissions->>'user_management';
            PERFORM user_rec.permissions->'plant_operations';
        EXCEPTION WHEN OTHERS THEN
            json_valid := FALSE;
            RAISE NOTICE '❌ ISSUE: Invalid JSON structure for user: %', user_rec.username;
        END;
    END LOOP;
    
    IF json_valid THEN
        RAISE NOTICE '✅ GOOD: All user permissions have valid JSON structure';
    END IF;
END $$;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICATION COMPLETED ===';
    RAISE NOTICE 'If all checks show ✅ GOOD, then the permissions fix was successful!';
    RAISE NOTICE 'If any checks show ❌ ISSUE, please review and re-run the fix script.';
END $$;