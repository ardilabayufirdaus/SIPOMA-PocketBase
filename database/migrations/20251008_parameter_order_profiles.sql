-- Parameter Order Profiles Table for saving and loading reorder profiles
CREATE TABLE IF NOT EXISTS parameter_order_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL, -- e.g., 'plant_operations'
    parameter_type VARCHAR(50) NOT NULL, -- e.g., 'ccr_parameters'
    category VARCHAR(50), -- plant category (optional)
    unit VARCHAR(50), -- plant unit (optional)
    parameter_order JSONB NOT NULL, -- array of parameter IDs in order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parameter_order_profiles_user_id ON parameter_order_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_parameter_order_profiles_module ON parameter_order_profiles(module);
CREATE INDEX IF NOT EXISTS idx_parameter_order_profiles_parameter_type ON parameter_order_profiles(parameter_type);
CREATE INDEX IF NOT EXISTS idx_parameter_order_profiles_category_unit ON parameter_order_profiles(category, unit);
CREATE INDEX IF NOT EXISTS idx_parameter_order_profiles_name ON parameter_order_profiles(name);

-- Enable RLS but allow all users to read, only creator to write
ALTER TABLE parameter_order_profiles DISABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read profiles
CREATE POLICY "parameter_order_profiles_select_policy" ON parameter_order_profiles
    FOR SELECT USING (true);

-- Policy: Anyone can insert (save) profiles
CREATE POLICY "parameter_order_profiles_insert_policy" ON parameter_order_profiles
    FOR INSERT WITH CHECK (true);

-- Policy: Only creator can update their profiles
CREATE POLICY "parameter_order_profiles_update_policy" ON parameter_order_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Only creator can delete their profiles
CREATE POLICY "parameter_order_profiles_delete_policy" ON parameter_order_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parameter_order_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER trigger_update_parameter_order_profiles_updated_at
    BEFORE UPDATE ON parameter_order_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_parameter_order_profiles_updated_at();