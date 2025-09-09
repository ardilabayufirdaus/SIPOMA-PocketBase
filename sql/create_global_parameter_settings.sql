-- SQL Script untuk membuat tabel global_parameter_settings di Supabase

-- Create table for storing global parameter settings
CREATE TABLE global_parameter_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plant_category TEXT,
    plant_unit TEXT,
    selected_parameters TEXT[] NOT NULL DEFAULT '{}',
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_global_parameter_settings_user_id ON global_parameter_settings(user_id);
CREATE INDEX idx_global_parameter_settings_plant_category ON global_parameter_settings(plant_category);
CREATE INDEX idx_global_parameter_settings_plant_unit ON global_parameter_settings(plant_unit);
CREATE INDEX idx_global_parameter_settings_is_global ON global_parameter_settings(is_global);

-- Create composite index for common query patterns
CREATE INDEX idx_global_parameter_settings_category_unit ON global_parameter_settings(plant_category, plant_unit);
CREATE INDEX idx_global_parameter_settings_user_category_unit ON global_parameter_settings(user_id, plant_category, plant_unit);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_global_parameter_settings_updated_at 
    BEFORE UPDATE ON global_parameter_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS)
ALTER TABLE global_parameter_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own settings and global settings
CREATE POLICY "Users can view their own settings and global settings" 
    ON global_parameter_settings 
    FOR SELECT 
    USING (
        auth.uid() = user_id OR 
        is_global = true
    );

-- Create policy for users to manage their own settings
CREATE POLICY "Users can manage their own settings" 
    ON global_parameter_settings 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Create policy for Super Admins to manage global settings
-- This uses the existing users table with role information
CREATE POLICY "Super Admins can manage global settings" 
    ON global_parameter_settings 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Super Admin'
        ) AND is_global = true
    );

-- Grant necessary permissions
GRANT ALL ON global_parameter_settings TO authenticated;
GRANT USAGE ON SEQUENCE global_parameter_settings_id_seq TO authenticated;
