-- ROLLBACK Migration: Revert ccr_parameter_data to original structure
-- This will restore the original hourly_values column and remove the new structure

BEGIN;

-- Step 1: Check if backup column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ccr_parameter_data' AND column_name = 'hourly_values_old'
  ) THEN
    RAISE EXCEPTION 'Backup column hourly_values_old does not exist. Cannot rollback.';
  END IF;

  RAISE NOTICE 'Backup column found. Proceeding with rollback...';
END $$;

-- Step 2: Drop the new index if it exists
DROP INDEX IF EXISTS idx_ccr_parameter_data_hourly_values;

-- Step 3: Drop the new hourly_values column (contains migrated data)
ALTER TABLE ccr_parameter_data DROP COLUMN IF EXISTS hourly_values;

-- Step 4: Restore the original column from backup
ALTER TABLE ccr_parameter_data RENAME COLUMN hourly_values_old TO hourly_values;

-- Step 5: Verification - ensure rollback was successful
DO $$
DECLARE
  total_records INTEGER;
  records_with_data INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(CASE WHEN hourly_values IS NOT NULL AND hourly_values != '{}'::jsonb THEN 1 END)
  INTO total_records, records_with_data
  FROM ccr_parameter_data;

  RAISE NOTICE 'Rollback completed successfully: % total records, % records with data restored', total_records, records_with_data;
END $$;

COMMIT;

-- Post-rollback verification
-- SELECT
--   id,
--   parameter_id,
--   date,
--   hourly_values,
--   name
-- FROM ccr_parameter_data
-- LIMIT 5;
