-- =============================================
-- FIX: Permissions Column Data Corruption
-- =============================================
-- Script untuk memperbaiki kolom permissions yang rusak di tabel users

-- Step 0: Clean up any existing conflicting views
DROP VIEW IF EXISTS user_list CASCADE;

-- Step 1: Drop kolom permissions yang rusak dari tabel users (jika ada)
DO $$
BEGIN
    -- Check if permissions column exists in users table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'permissions'
        AND table_schema = 'public'
    ) THEN
        -- Drop the corrupted permissions column
        ALTER TABLE users DROP COLUMN permissions;
        RAISE NOTICE 'Dropped corrupted permissions column from users table';
    END IF;
END $$;

-- Step 2: Ensure user_permissions table exists with correct structure
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard VARCHAR(20) DEFAULT 'read',
    user_management VARCHAR(20) DEFAULT 'none',
    plant_operations JSONB DEFAULT '{}',
    packing_plant VARCHAR(20) DEFAULT 'none',
    project_management VARCHAR(20) DEFAULT 'none',
    system_settings VARCHAR(20) DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_dashboard_perm CHECK (dashboard IN ('none', 'read', 'write', 'admin')),
    CONSTRAINT valid_user_mgmt_perm CHECK (user_management IN ('none', 'read', 'write', 'admin')),
    CONSTRAINT valid_packing_perm CHECK (packing_plant IN ('none', 'read', 'write', 'admin')),
    CONSTRAINT valid_project_perm CHECK (project_management IN ('none', 'read', 'write', 'admin')),
    CONSTRAINT valid_system_perm CHECK (system_settings IN ('none', 'read', 'write', 'admin')),
    
    -- Unique constraint to prevent duplicate permissions for same user
    CONSTRAINT unique_user_permissions UNIQUE (user_id)
);

-- Step 3: Drop existing view and create new one with proper JSON permissions
DROP VIEW IF EXISTS user_list;

CREATE VIEW user_list AS
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
            'dashboard', COALESCE(up.dashboard, 'read'),
            'user_management', COALESCE(up.user_management, 'none'),
            'plant_operations', COALESCE(up.plant_operations, '{}'),
            'packing_plant', COALESCE(up.packing_plant, 'none'),
            'project_management', COALESCE(up.project_management, 'none'),
            'system_settings', COALESCE(up.system_settings, 'none')
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

-- Step 4: Set default permissions for existing users who don't have permissions
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users without permissions
    FOR user_record IN 
        SELECT u.id, u.role, u.username
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        WHERE up.user_id IS NULL
    LOOP
        -- Set permissions based on role
        IF user_record.role = 'Super Admin' THEN
            INSERT INTO user_permissions (
                user_id, dashboard, user_management, plant_operations, 
                packing_plant, project_management, system_settings
            ) VALUES (
                user_record.id,
                'admin',
                'admin',
                jsonb_build_object(
                    'Production', jsonb_build_object(
                        'Raw Material Preparation', 'admin',
                        'Mixing', 'admin',
                        'Extrusion', 'admin'
                    ),
                    'Quality Control', jsonb_build_object(
                        'Lab Testing', 'admin',
                        'Process Control', 'admin'
                    ),
                    'Control Room', jsonb_build_object(
                        'CCR', 'admin',
                        'Monitoring', 'admin'
                    ),
                    'Packing', jsonb_build_object(
                        'Primary Packing', 'admin',
                        'Secondary Packing', 'admin'
                    ),
                    'Warehouse', jsonb_build_object(
                        'Raw Material', 'admin',
                        'Finished Goods', 'admin'
                    )
                ),
                'admin',
                'admin',
                'admin'
            );
            
        ELSIF user_record.role = 'Admin' THEN
            INSERT INTO user_permissions (
                user_id, dashboard, user_management, plant_operations, 
                packing_plant, project_management, system_settings
            ) VALUES (
                user_record.id,
                'admin',
                'write',
                jsonb_build_object(
                    'Production', jsonb_build_object(
                        'Raw Material Preparation', 'write',
                        'Mixing', 'write',
                        'Extrusion', 'write'
                    ),
                    'Quality Control', jsonb_build_object(
                        'Lab Testing', 'write',
                        'Process Control', 'write'
                    ),
                    'Control Room', jsonb_build_object(
                        'CCR', 'write',
                        'Monitoring', 'write'
                    )
                ),
                'write',
                'write',
                'write'
            );
            
        ELSIF user_record.role = 'Manager' THEN
            INSERT INTO user_permissions (
                user_id, dashboard, user_management, plant_operations, 
                packing_plant, project_management, system_settings
            ) VALUES (
                user_record.id,
                'write',
                'read',
                jsonb_build_object(
                    'Production', jsonb_build_object(
                        'Raw Material Preparation', 'write',
                        'Mixing', 'write'
                    ),
                    'Quality Control', jsonb_build_object(
                        'Lab Testing', 'read',
                        'Process Control', 'read'
                    )
                ),
                'write',
                'read',
                'read'
            );
            
        ELSIF user_record.role = 'Supervisor' THEN
            INSERT INTO user_permissions (
                user_id, dashboard, user_management, plant_operations, 
                packing_plant, project_management, system_settings
            ) VALUES (
                user_record.id,
                'write',
                'none',
                jsonb_build_object(
                    'Production', jsonb_build_object(
                        'Raw Material Preparation', 'read',
                        'Mixing', 'read'
                    )
                ),
                'read',
                'none',
                'none'
            );
            
        ELSIF user_record.role = 'Operator' THEN
            INSERT INTO user_permissions (
                user_id, dashboard, user_management, plant_operations, 
                packing_plant, project_management, system_settings
            ) VALUES (
                user_record.id,
                'read',
                'none',
                jsonb_build_object(
                    'Production', jsonb_build_object(
                        'Raw Material Preparation', 'read'
                    )
                ),
                'read',
                'none',
                'none'
            );
            
        ELSE -- Viewer or other roles
            INSERT INTO user_permissions (
                user_id, dashboard, user_management, plant_operations, 
                packing_plant, project_management, system_settings
            ) VALUES (
                user_record.id,
                'read',
                'none',
                '{}',
                'none',
                'none',
                'none'
            );
        END IF;
        
        RAISE NOTICE 'Set permissions for user: % (role: %)', user_record.username, user_record.role;
    END LOOP;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- Step 6: Grant necessary permissions
GRANT SELECT ON user_list TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO authenticated;

-- Step 7: Enable RLS on user_permissions table
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_permissions
CREATE POLICY "Users can view their own permissions" ON user_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== PERMISSIONS FIX COMPLETED ===';
    RAISE NOTICE 'Dropped corrupted permissions column from users table';
    RAISE NOTICE 'Created proper user_permissions table structure';
    RAISE NOTICE 'Set default permissions for all existing users';
    RAISE NOTICE 'Created user_list view with proper JSON permissions';
    RAISE NOTICE 'Applied RLS policies for security';
    
    -- Show summary
    RAISE NOTICE 'Users with permissions: %', (SELECT COUNT(*) FROM user_permissions);
    RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM users);
END $$;
