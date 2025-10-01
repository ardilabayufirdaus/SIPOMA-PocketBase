-- Migration to add user tracking per hour in ccr_parameter_data
-- Transform hourly_values from {hour: value} to {hour: {value, user_name, timestamp}}
-- SAFE VERSION: Uses transaction and validation to prevent data loss

BEGIN;

-- Step 1: Add temporary column to store the new structure
ALTER TABLE ccr_parameter_data ADD COLUMN hourly_values_new JSONB DEFAULT '{}'::jsonb;

-- Step 2: Migrate existing data with validation
-- Migrate existing data: for each existing record, transform hourly_values
UPDATE ccr_parameter_data
SET hourly_values_new = (
  SELECT jsonb_object_agg(
    key::int,
    jsonb_build_object(
      'value', hourly_values -> key,
      'user_name', COALESCE(name, 'Unknown'),
      'timestamp', NOW()::text
    )
  )
  FROM jsonb_object_keys(hourly_values) AS key
  WHERE hourly_values IS NOT NULL AND hourly_values != '{}'::jsonb
)
WHERE hourly_values IS NOT NULL AND hourly_values != '{}'::jsonb;

-- For records with no hourly_values, set empty object
UPDATE ccr_parameter_data
SET hourly_values_new = '{}'::jsonb
WHERE hourly_values IS NULL OR hourly_values = '{}'::jsonb;

-- Step 3: Validation - ensure all records have been migrated
DO $$
DECLARE
  total_records INTEGER;
  records_with_data INTEGER;
  migrated_records INTEGER;
BEGIN
  -- Get stats
  SELECT
    COUNT(*),
    COUNT(CASE WHEN hourly_values IS NOT NULL AND hourly_values != '{}'::jsonb THEN 1 END),
    COUNT(CASE WHEN hourly_values_new IS NOT NULL AND hourly_values_new != '{}'::jsonb THEN 1 END)
  INTO total_records, records_with_data, migrated_records
  FROM ccr_parameter_data;

  -- Check if migration was successful
  IF migrated_records < records_with_data THEN
    RAISE EXCEPTION 'Migration validation failed: Only % out of % records with data were migrated', migrated_records, records_with_data;
  END IF;

  RAISE NOTICE 'Migration validation passed: % total records, % records with data, % successfully migrated', total_records, records_with_data, migrated_records;
END $$;

-- Step 4: Safe column replacement (only if validation passed)
-- Create backup of old column (optional, for extra safety)
ALTER TABLE ccr_parameter_data RENAME COLUMN hourly_values TO hourly_values_old;

-- Rename new column to replace old one
ALTER TABLE ccr_parameter_data RENAME COLUMN hourly_values_new TO hourly_values;

-- Step 5: Update indexes for new JSONB column
CREATE INDEX IF NOT EXISTS idx_ccr_parameter_data_hourly_values ON ccr_parameter_data USING GIN (hourly_values);

-- Step 6: Optional - Drop old column after successful migration
-- Uncomment the line below only after confirming migration success in production
-- ALTER TABLE ccr_parameter_data DROP COLUMN hourly_values_old;

COMMIT;

-- Post-migration verification (run this manually after migration)
-- SELECT COUNT(*) as total_records,
--        COUNT(CASE WHEN hourly_values IS NOT NULL THEN 1 END) as migrated_records
-- FROM ccr_parameter_data;