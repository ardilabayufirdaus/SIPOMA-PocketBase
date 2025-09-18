-- Database Schema untuk SIPOMA v2
-- Generated berdasarkan analisis kode aplikasi

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

-- Permissions table
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

-- User requests table
CREATE TABLE IF NOT EXISTS user_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    request_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Info', 'Warning', 'Critical')),
    read BOOLEAN DEFAULT false
);

-- Plant units table
CREATE TABLE IF NOT EXISTS plant_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parameter settings table
CREATE TABLE IF NOT EXISTS parameter_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parameter VARCHAR(255) NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('Number', 'Text')),
    unit VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    min_value NUMERIC,
    max_value NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Running', 'Stopped', 'Maintenance')),
    output NUMERIC NOT NULL,
    uptime NUMERIC NOT NULL CHECK (uptime >= 0 AND uptime <= 100),
    temperature NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs table
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    value VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    trend NUMERIC NOT NULL,
    icon VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production data table
CREATE TABLE IF NOT EXISTS production_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    unit VARCHAR(100) NOT NULL,
    production NUMERIC NOT NULL,
    efficiency NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CCR Parameter Data table
CREATE TABLE IF NOT EXISTS ccr_parameter_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parameter_id UUID NOT NULL,
    date DATE NOT NULL,
    hourly_values JSONB DEFAULT '{}',
    plant_unit VARCHAR(100),
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, parameter_id)
);

-- CCR Downtime Data table
CREATE TABLE IF NOT EXISTS ccr_downtime_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    pic VARCHAR(255) NOT NULL,
    problem TEXT NOT NULL,
    unit VARCHAR(100) NOT NULL,
    action TEXT,
    corrective_action TEXT,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Close')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global Parameter Settings table
CREATE TABLE IF NOT EXISTS global_parameter_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parameter VARCHAR(255) NOT NULL,
    value TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packing Plant Stock table
CREATE TABLE IF NOT EXISTS packing_plant_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID,
    date DATE NOT NULL,
    area VARCHAR(100) NOT NULL,
    opening_stock NUMERIC NOT NULL DEFAULT 0,
    stock_received NUMERIC NOT NULL DEFAULT 0,
    stock_out NUMERIC NOT NULL DEFAULT 0,
    closing_stock NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COP Parameters table
CREATE TABLE IF NOT EXISTS cop_parameters (
    id VARCHAR(50) PRIMARY KEY,
    parameter_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
-- CCR Footer Data table
CREATE TABLE IF NOT EXISTS ccr_footer_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    parameter_id UUID NOT NULL,
    plant_unit VARCHAR(100),
    total NUMERIC,
    average NUMERIC,
    minimum NUMERIC,
    maximum NUMERIC,
    shift1_total NUMERIC DEFAULT 0,
    shift2_total NUMERIC DEFAULT 0,
    shift3_total NUMERIC DEFAULT 0,
    shift3_cont_total NUMERIC DEFAULT 0,
    shift1_difference NUMERIC DEFAULT 0,
    shift2_difference NUMERIC DEFAULT 0,
    shift3_difference NUMERIC DEFAULT 0,
    shift3_cont_difference NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, parameter_id, plant_unit)
);

-- WhatsApp Report Settings table
CREATE TABLE IF NOT EXISTS whatsapp_report_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jenis VARCHAR(10) NOT NULL CHECK (jenis IN ('text', 'number')),
    parameter_id UUID REFERENCES parameter_settings(id) ON DELETE SET NULL,
    data TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    kalkulasi VARCHAR(20) CHECK (kalkulasi IN ('selisih', 'total', 'average', 'min', 'max', 'counter_total')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ccr_parameter_data_date ON ccr_parameter_data(date);
CREATE INDEX IF NOT EXISTS idx_ccr_parameter_data_parameter_id ON ccr_parameter_data(parameter_id);
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_data_date ON ccr_downtime_data(date);
CREATE INDEX IF NOT EXISTS idx_packing_plant_stock_date ON packing_plant_stock(date);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_timestamp ON user_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_report_settings_jenis ON whatsapp_report_settings(jenis);
CREATE INDEX IF NOT EXISTS idx_whatsapp_report_settings_category ON whatsapp_report_settings(category);

-- Insert default COP parameters record
INSERT INTO cop_parameters (id, parameter_ids) VALUES ('default', '{}') ON CONFLICT (id) DO NOTHING;