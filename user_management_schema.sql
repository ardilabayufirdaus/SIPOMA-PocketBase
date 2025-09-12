-- =============================================
-- SIPOMA User Management Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords in production
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'operator',
    avatar_url TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_role CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'Supervisor', 'Operator', 'Viewer')),
    CONSTRAINT valid_username CHECK (LENGTH(username) >= 3),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================
-- USER PERMISSIONS TABLE
-- =============================================
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
    CONSTRAINT valid_system_perm CHECK (system_settings IN ('none', 'read', 'write', 'admin'))
);

-- =============================================
-- REGISTRATION REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS registration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =============================================
-- ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PLANT UNITS TABLE (for permissions)
-- =============================================
CREATE TABLE IF NOT EXISTS plant_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(category, unit)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_plant_units_category ON plant_units(category);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist to avoid duplicate errors
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to approve user registration
CREATE OR REPLACE FUNCTION approve_user_registration(
    request_id UUID,
    user_data JSONB
) RETURNS JSONB AS $$
DECLARE
    new_user_id UUID;
    result JSONB;
BEGIN
    -- Create new user
    INSERT INTO users (
        username,
        email,
        password,
        full_name,
        role
    ) VALUES (
        user_data->>'username',
        user_data->>'email',
        user_data->>'password',
        user_data->>'full_name',
        COALESCE(user_data->>'role', 'operator')
    ) RETURNING id INTO new_user_id;

    -- Create default permissions
    INSERT INTO user_permissions (user_id) VALUES (new_user_id);

    -- Update registration request
    UPDATE registration_requests
    SET status = 'approved',
        approved_at = NOW(),
        approved_by = (user_data->>'approved_by')::UUID
    WHERE id = request_id;

    -- Log activity
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (new_user_id, 'user_created', jsonb_build_object('method', 'registration_approval'));

    result := jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'User created successfully'
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user with permissions
CREATE OR REPLACE FUNCTION get_user_with_permissions(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    username VARCHAR,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    avatar_url TEXT,
    last_active TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
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
        jsonb_build_object(
            'dashboard', COALESCE(up.dashboard, 'read'),
            'user_management', COALESCE(up.user_management, 'none'),
            'plant_operations', COALESCE(up.plant_operations, '{}'),
            'packing_plant', COALESCE(up.packing_plant, 'none'),
            'project_management', COALESCE(up.project_management, 'none'),
            'system_settings', COALESCE(up.system_settings, 'none')
        ) as permissions
    FROM users u
    LEFT JOIN user_permissions up ON u.id = up.user_id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage registration requests" ON registration_requests;
DROP POLICY IF EXISTS "Users can view their own activity" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity" ON activity_logs;

-- Users table policies
DROP POLICY IF EXISTS "Allow all select" ON users;
CREATE POLICY "Allow all select" ON users FOR SELECT USING (true);
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- User permissions policies
CREATE POLICY "Users can view their own permissions" ON user_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- Registration requests policies
CREATE POLICY "Admins can manage registration requests" ON registration_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- Activity logs policies
CREATE POLICY "Users can view their own activity" ON activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- =============================================
-- FIX FOR EXISTING PLANT_UNITS TABLE
-- =============================================

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plant_units'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE plant_units ADD COLUMN description TEXT;
    END IF;
END $$;

-- =============================================
-- SAMPLE DATA - SAFE INSERT APPROACH
-- =============================================

-- Insert default plant units using a safe approach
DO $$
DECLARE
    plant_unit RECORD;
BEGIN
    -- Define plant units to insert
    FOR plant_unit IN
        SELECT * FROM (VALUES
            ('Production', 'Raw Material Preparation', 'Unit persiapan bahan baku'),
            ('Production', 'Mixing', 'Unit pencampuran'),
            ('Production', 'Extrusion', 'Unit ekstrusi'),
            ('Quality Control', 'Lab Testing', 'Unit pengujian laboratorium'),
            ('Quality Control', 'Process Control', 'Unit kontrol proses'),
            ('Control Room', 'CCR', 'Central Control Room'),
            ('Control Room', 'Monitoring', 'Unit monitoring'),
            ('Packing', 'Primary Packing', 'Unit packing primer'),
            ('Packing', 'Secondary Packing', 'Unit packing sekunder'),
            ('Warehouse', 'Raw Material', 'Gudang bahan baku'),
            ('Warehouse', 'Finished Goods', 'Gudang barang jadi')
        ) AS t(category, unit, description)
    LOOP
        -- Insert only if doesn't exist
        INSERT INTO plant_units (category, unit, description)
        SELECT plant_unit.category, plant_unit.unit, plant_unit.description
        WHERE NOT EXISTS (
            SELECT 1 FROM plant_units
            WHERE category = plant_unit.category
            AND unit = plant_unit.unit
        );
    END LOOP;
END $$;

-- Insert default super admin user safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin') THEN
        INSERT INTO users (username, email, password, full_name, role) VALUES
        ('superadmin', 'admin@sipoma.com', '$2b$10$rOz8vZKQvJcXc8QyJcXc8QyJcXc8QyJcXc8QyJcXc8QyJcXc8QyJcXc8Qy', 'Super Administrator', 'Super Admin');
    END IF;
END $$;

-- Insert default permissions for super admin safely
DO $$
DECLARE
    superadmin_id UUID;
BEGIN
    SELECT id INTO superadmin_id FROM users WHERE username = 'superadmin';

    IF superadmin_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = superadmin_id) THEN
        INSERT INTO user_permissions (user_id, dashboard, user_management, plant_operations, packing_plant, project_management, system_settings)
        VALUES (
            superadmin_id,
            'admin',
            'admin',
            jsonb_build_object(
                'Production', jsonb_build_object('Raw Material Preparation', 'admin', 'Mixing', 'admin', 'Extrusion', 'admin'),
                'Quality Control', jsonb_build_object('Lab Testing', 'admin', 'Process Control', 'admin'),
                'Control Room', jsonb_build_object('CCR', 'admin', 'Monitoring', 'admin'),
                'Packing', jsonb_build_object('Primary Packing', 'admin', 'Secondary Packing', 'admin'),
                'Warehouse', jsonb_build_object('Raw Material', 'admin', 'Finished Goods', 'admin')
            ),
            'admin',
            'admin',
            'admin'
        );
    END IF;
END $$;

-- =============================================
-- VIEWS FOR EASY QUERYING
-- =============================================

-- View for user list with permissions
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
    jsonb_build_object(
        'dashboard', COALESCE(up.dashboard, 'read'),
        'user_management', COALESCE(up.user_management, 'none'),
        'plant_operations', COALESCE(up.plant_operations, '{}'),
        'packing_plant', COALESCE(up.packing_plant, 'none'),
        'project_management', COALESCE(up.project_management, 'none'),
        'system_settings', COALESCE(up.system_settings, 'none')
    ) as permissions
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id;

-- View for active users
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM user_list WHERE is_active = true;

-- View for registration requests with user details (minimal)
CREATE OR REPLACE VIEW registration_requests_with_users AS
SELECT
    rr.id,
    rr.email,
    rr.name,
    rr.status,
    NULL as approved_by_name
FROM registration_requests rr;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to hash password (for production use proper hashing)
CREATE OR REPLACE FUNCTION hash_password(plain_password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- In production, use proper password hashing like bcrypt
    -- This is just a placeholder
    RETURN encode(digest(plain_password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to validate user credentials
CREATE OR REPLACE FUNCTION validate_user_credentials(
    input_username VARCHAR,
    input_password VARCHAR
) RETURNS TABLE (
    id UUID,
    username VARCHAR,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    is_active BOOLEAN,
    permissions JSONB
) AS $$
BEGIN
    -- Debug output
    RAISE NOTICE 'Input username: %', input_username;
    RAISE NOTICE 'Input password (raw): %', input_password;

    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.is_active,
        jsonb_build_object(
            'dashboard', COALESCE(up.dashboard, 'read'),
            'user_management', COALESCE(up.user_management, 'none'),
            'plant_operations', COALESCE(up.plant_operations, '{}'),
            'packing_plant', COALESCE(up.packing_plant, 'none'),
            'project_management', COALESCE(up.project_management, 'none'),
            'system_settings', COALESCE(up.system_settings, 'none')
        ) as permissions
    FROM users u
    LEFT JOIN user_permissions up ON u.id = up.user_id
    WHERE u.username = input_username
    AND u.password = input_password
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANTS FOR APPLICATION ACCESS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON registration_requests TO authenticated;
GRANT SELECT, INSERT ON activity_logs TO authenticated;
GRANT SELECT ON plant_units TO authenticated;
GRANT SELECT ON user_list TO authenticated;
GRANT SELECT ON active_users TO authenticated;
GRANT SELECT ON registration_requests_with_users TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION approve_user_registration(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_with_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_credentials(VARCHAR, VARCHAR) TO authenticated;
