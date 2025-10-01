-- ALTERNATIVE: Simpler migration approach if the complex one fails
-- This version uses a more straightforward approach with PL/pgSQL function

-- Create a function to transform hourly_values
CREATE OR REPLACE FUNCTION transform_hourly_values(
  old_values JSONB,
  user_name TEXT DEFAULT 'Unknown',
  timestamp_val TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::jsonb;
  hour_key TEXT;
  hour_value JSONB;
BEGIN
  -- If timestamp not provided, use current time
  IF timestamp_val IS NULL THEN
    timestamp_val := NOW()::TEXT;
  END IF;

  -- Iterate through each key-value pair in the old hourly_values
  FOR hour_key IN SELECT jsonb_object_keys(old_values)
  LOOP
    hour_value := old_values -> hour_key;

    -- Build new structure: {value, user_name, timestamp}
    result := jsonb_set(
      result,
      ARRAY[hour_key],
      jsonb_build_object(
        'value', hour_value,
        'user_name', user_name,
        'timestamp', timestamp_val
      )
    );
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Now run the migration using the function
BEGIN;

-- Add temporary column
ALTER TABLE ccr_parameter_data ADD COLUMN hourly_values_new JSONB DEFAULT '{}'::jsonb;

-- Transform data using the function
UPDATE ccr_parameter_data
SET hourly_values_new = transform_hourly_values(
  hourly_values,
  COALESCE(name, 'Unknown'),
  NOW()::TEXT
)
WHERE hourly_values IS NOT NULL AND hourly_values != '{}'::jsonb;

-- For empty records, set empty object
UPDATE ccr_parameter_data
SET hourly_values_new = '{}'::jsonb
WHERE hourly_values IS NULL OR hourly_values = '{}'::jsonb;

-- Validation
DO $$
DECLARE
  total_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(CASE WHEN hourly_values_new != '{}'::jsonb THEN 1 END)
  INTO total_count, migrated_count
  FROM ccr_parameter_data;

  RAISE NOTICE 'Migration completed: % total records, % migrated', total_count, migrated_count;
END $$;

-- Safe column replacement
ALTER TABLE ccr_parameter_data RENAME COLUMN hourly_values TO hourly_values_old;
ALTER TABLE ccr_parameter_data RENAME COLUMN hourly_values_new TO hourly_values;

-- Add index
CREATE INDEX IF NOT EXISTS idx_ccr_parameter_data_hourly_values ON ccr_parameter_data USING GIN (hourly_values);

COMMIT;

-- Clean up function (optional)
-- DROP FUNCTION IF EXISTS transform_hourly_values(JSONB, TEXT, TEXT);

-- Verification query
-- SELECT id, date, parameter_id, hourly_values FROM ccr_parameter_data LIMIT 5;