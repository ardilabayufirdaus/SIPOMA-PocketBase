-- SQL script to update the users table role constraint
-- This needs to be run in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with all the roles including Tonasa roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'Super Admin',
    'Admin', 
    'Admin Tonasa 2/3',
    'Admin Tonasa 4',
    'Admin Tonasa 5',
    'Operator',
    'Operator Tonasa 2/3', 
    'Operator Tonasa 4',
    'Operator Tonasa 5',
    'Guest'
));

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'users_role_check';