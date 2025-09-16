-- Check existing tables in the database
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if our custom users table exists
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'users'
  AND table_schema = 'public';

-- If our users table exists, show its structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check auth.users structure (Supabase built-in)
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'auth'
ORDER BY ordinal_position;