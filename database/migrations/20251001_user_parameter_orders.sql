-- User Parameter Orders Table for persistent parameter reordering per user
CREATE TABLE IF NOT EXISTS user_parameter_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL, -- e.g., 'ccr_data_entry', 'cop_analysis', etc.
    parameter_type VARCHAR(50) NOT NULL, -- e.g., 'ccr_parameters', 'cop_parameters'
    category VARCHAR(50), -- plant category (optional, for filtering)
    unit VARCHAR(50), -- plant unit (optional, for filtering)
    parameter_order JSONB NOT NULL, -- array of parameter IDs in order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module, parameter_type, category, unit) -- ensure one order per user/module/type/category/unit
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_parameter_orders_user_id ON user_parameter_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_parameter_orders_module ON user_parameter_orders(module);
CREATE INDEX IF NOT EXISTS idx_user_parameter_orders_parameter_type ON user_parameter_orders(parameter_type);
CREATE INDEX IF NOT EXISTS idx_user_parameter_orders_category_unit ON user_parameter_orders(category, unit);

-- Enable RLS
ALTER TABLE user_parameter_orders DISABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_parameter_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER trigger_update_user_parameter_orders_updated_at
    BEFORE UPDATE ON user_parameter_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_user_parameter_orders_updated_at();