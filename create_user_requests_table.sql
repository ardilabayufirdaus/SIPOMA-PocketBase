-- Migration: Create user_requests table for registration system
-- This table handles user registration requests that require admin approval

-- Drop existing table if it exists with wrong structure
DROP TABLE IF EXISTS user_requests CASCADE;

-- Create the correct user_requests table
CREATE TABLE user_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_requests_email ON user_requests(email);
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_requested_at ON user_requests(requested_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_requests_updated_at
    BEFORE UPDATE ON user_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
-- ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own requests
-- CREATE POLICY "Users can view own requests" ON user_requests
--     FOR SELECT USING (auth.uid()::text = email);

-- Policy: Anyone can create a request (for registration)
-- CREATE POLICY "Anyone can create registration request" ON user_requests
--     FOR INSERT WITH CHECK (true);

-- Policy: Only admins can update request status
-- CREATE POLICY "Admins can update request status" ON user_requests
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM users
--             WHERE users.id = auth.uid()
--             AND users.role IN ('Super Admin', 'Admin')
--         )
--     );

-- Policy: Only admins can delete requests
-- CREATE POLICY "Admins can delete requests" ON user_requests
--     FOR DELETE USING (
--         EXISTS (
--             SELECT 1 FROM users
--             WHERE users.id = auth.uid()
--             AND users.role IN ('Super Admin', 'Admin')
--         )
--     );

-- Insert sample data for testing (optional)
-- INSERT INTO user_requests (email, name, status) VALUES
-- ('test@example.com', 'Test User', 'pending')
-- ON CONFLICT (email) DO NOTHING;