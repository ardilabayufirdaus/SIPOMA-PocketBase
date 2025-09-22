-- Create autonomous_risk_data table migration
-- This table stores autonomous risk data entries for plant operations

CREATE TABLE IF NOT EXISTS autonomous_risk_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit VARCHAR(255) NOT NULL,
    potential_disruption TEXT NOT NULL,
    preventive_action TEXT NOT NULL,
    mitigation_plan TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Identified', 'In Progress', 'Resolved')),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_autonomous_risk_data_unit ON autonomous_risk_data(unit);
CREATE INDEX IF NOT EXISTS idx_autonomous_risk_data_status ON autonomous_risk_data(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_risk_data_date ON autonomous_risk_data(date);
CREATE INDEX IF NOT EXISTS idx_autonomous_risk_data_created_at ON autonomous_risk_data(created_at);

-- Enable Row Level Security
ALTER TABLE autonomous_risk_data ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read autonomous_risk_data
CREATE POLICY "Allow authenticated users to read autonomous_risk_data" ON autonomous_risk_data
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert autonomous_risk_data
CREATE POLICY "Allow authenticated users to insert autonomous_risk_data" ON autonomous_risk_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update autonomous_risk_data
CREATE POLICY "Allow authenticated users to update autonomous_risk_data" ON autonomous_risk_data
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete autonomous_risk_data
CREATE POLICY "Allow authenticated users to delete autonomous_risk_data" ON autonomous_risk_data
    FOR DELETE USING (auth.role() = 'authenticated');