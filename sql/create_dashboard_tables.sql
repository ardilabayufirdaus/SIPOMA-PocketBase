-- =============================================
-- SIPOMA Dashboard Required Tables
-- =============================================
-- This script creates the missing tables needed for the main dashboard

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MACHINES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS machines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Stopped',
    temperature NUMERIC DEFAULT 0,
    output NUMERIC DEFAULT 0,
    uptime NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_machine_status CHECK (status IN ('Running', 'Stopped', 'Maintenance', 'Error'))
);

-- =============================================
-- ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'low',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT valid_alert_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- =============================================
-- KPIS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS kpis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '0',
    unit TEXT,
    trend NUMERIC DEFAULT 0,
    icon TEXT DEFAULT 'CogIcon',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTION DATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS production_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hour INTEGER NOT NULL,
    output NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_hour CHECK (hour >= 0 AND hour <= 23)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_production_data_hour ON production_data(hour);
CREATE INDEX IF NOT EXISTS idx_production_data_created_at ON production_data(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_data ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read machines" ON machines
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read alerts" ON alerts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read kpis" ON kpis
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read production_data" ON production_data
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update machines (for status toggle)
CREATE POLICY "Allow authenticated users to update machines" ON machines
    FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to update alerts (for marking as read)
CREATE POLICY "Allow authenticated users to update alerts" ON alerts
    FOR UPDATE TO authenticated USING (true);

-- Allow admins to insert/update/delete all data
CREATE POLICY "Allow admins full access to machines" ON machines
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "Allow admins full access to alerts" ON alerts
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "Allow admins full access to kpis" ON kpis
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "Allow admins full access to production_data" ON production_data
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample machines
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM machines LIMIT 1) THEN
        INSERT INTO machines (name, status, temperature, output, uptime) VALUES
        ('Cement Mill 1', 'Running', 75.5, 850, 95.2),
        ('Cement Mill 2', 'Running', 72.3, 820, 98.1),
        ('Kiln 1', 'Running', 1450.0, 280, 87.5),
        ('Kiln 2', 'Maintenance', 0, 0, 0),
        ('Raw Mill 1', 'Running', 68.9, 420, 92.3),
        ('Raw Mill 2', 'Stopped', 45.2, 0, 0),
        ('Coal Mill', 'Running', 89.1, 35, 89.7),
        ('Packing Unit 1', 'Running', 35.0, 1200, 94.8),
        ('Packing Unit 2', 'Running', 36.2, 1150, 91.2);
    END IF;
END $$;

-- Insert sample KPIs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM kpis LIMIT 1) THEN
        INSERT INTO kpis (title, value, unit, trend, icon) VALUES
        ('Production Rate', '95.2', '%', 2.3, 'ChartBarIcon'),
        ('Energy Efficiency', '87.5', '%', -1.2, 'FireIcon'),
        ('Equipment Uptime', '94.8', '%', 1.8, 'CogIcon'),
        ('Quality Index', '98.1', '%', 0.5, 'ArchiveBoxIcon');
    END IF;
END $$;

-- Insert sample alerts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM alerts LIMIT 1) THEN
        INSERT INTO alerts (message, severity, timestamp, read) VALUES
        ('High temperature detected in Kiln 1', 'high', NOW() - INTERVAL '2 hours', false),
        ('Cement Mill 2 scheduled maintenance required', 'medium', NOW() - INTERVAL '4 hours', false),
        ('Coal Mill filter needs replacement', 'low', NOW() - INTERVAL '6 hours', true),
        ('Production target achieved for today', 'low', NOW() - INTERVAL '8 hours', true),
        ('Raw material inventory low', 'medium', NOW() - INTERVAL '12 hours', false);
    END IF;
END $$;

-- Insert sample production data (last 24 hours)
DO $$
DECLARE
    hour_val INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM production_data LIMIT 1) THEN
        FOR hour_val IN 0..23 LOOP
            INSERT INTO production_data (hour, output, created_at) VALUES
            (hour_val, 
             800 + (RANDOM() * 200), -- Random output between 800-1000
             NOW() - INTERVAL '1 day' + (hour_val || ' hours')::INTERVAL
            );
        END LOOP;
    END IF;
END $$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT SELECT ON machines TO authenticated;
GRANT SELECT ON alerts TO authenticated;
GRANT SELECT ON kpis TO authenticated;
GRANT SELECT ON production_data TO authenticated;

-- Grant update permissions for specific operations
GRANT UPDATE ON machines TO authenticated;
GRANT UPDATE ON alerts TO authenticated;

-- Grant all permissions to service role (for admin operations)
GRANT ALL ON machines TO service_role;
GRANT ALL ON alerts TO service_role;
GRANT ALL ON kpis TO service_role;
GRANT ALL ON production_data TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Dashboard tables created successfully!';
    RAISE NOTICE 'Tables created: machines, alerts, kpis, production_data';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'RLS policies configured for security';
END $$;
