
-- Add username column to users table
ALTER TABLE users 
ADD COLUMN username TEXT UNIQUE;

-- Update existing users with a default username (e.g., from email)
UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL;

-- Add comment to describe the column
COMMENT ON COLUMN users.username IS 'Unique username for login';
