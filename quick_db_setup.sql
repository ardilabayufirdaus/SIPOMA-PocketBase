-- SIPOMA v2 Database Setup - Essential Tables for Permissions
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Operator', 'Guest')),
    last_active TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_hash VARCHAR(255) NOT NULL
);

-- Permissions table (THIS IS THE MISSING TABLE CAUSING THE 406 ERROR)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_name VARCHAR(100) NOT NULL,
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('NONE', 'READ', 'WRITE', 'ADMIN')),
    plant_units TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User permissions junction table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- Plant units table (needed for plant operations permissions)
CREATE TABLE IF NOT EXISTS plant_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert actual plant units from Supabase
INSERT INTO plant_units (id, unit, category, description) VALUES
('0636a9bc-42f3-4073-b14a-c45f5d937b07', 'Cement Mill 220', 'Tonasa 2/3', NULL),
('dcbfd18e-452d-43d9-873e-975615747da9', 'Cement Mill 320', 'Tonasa 2/3', NULL),
('5fd367d9-71a4-48ee-a06d-d07868db49ca', 'Cement Mill 419', 'Tonasa 4', NULL),
('0a54b6f7-3027-46c4-82af-31a52737e20a', 'Cement Mill 420', 'Tonasa 4', NULL),
('dc4b7da4-7a22-41fe-927f-f4d5b7bb667f', 'Cement Mill 552', 'Tonasa 5', NULL),
('8223f1d1-fd19-4622-b609-ed425e36348c', 'Cement Mill 553', 'Tonasa 5', NULL)
ON CONFLICT (id) DO NOTHING;

-- Create default admin user
-- Password: admin123 (hashed)
INSERT INTO users (username, full_name, role, password_hash, is_active) VALUES
('admin', 'System Administrator', 'Super Admin', '$2b$10$8K1p/5w6QyTJ9L8qR9dUeO8qR9dUeO8qR9dUeO8qR9dUeO8qR9dUe', true)
ON CONFLICT (username) DO NOTHING;

-- Create default permissions
INSERT INTO permissions (module_name, permission_level, plant_units) VALUES
('dashboard', 'ADMIN', '[]'::jsonb),
('plant_operations', 'ADMIN', '["Tonasa 2/3", "Tonasa 4", "Tonasa 5"]'::jsonb),
('packing_plant', 'ADMIN', '[]'::jsonb),
('project_management', 'ADMIN', '[]'::jsonb),
('system_settings', 'ADMIN', '[]'::jsonb),
('user_management', 'ADMIN', '[]'::jsonb)
ON CONFLICT DO NOTHING;

-- Link admin user to all permissions
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
CROSS JOIN permissions p
WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Users created:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Permissions created:', COUNT(*) FROM permissions
UNION ALL
SELECT 'User permissions linked:', COUNT(*) FROM user_permissions
UNION ALL
SELECT 'Plant units created:', COUNT(*) FROM plant_units;