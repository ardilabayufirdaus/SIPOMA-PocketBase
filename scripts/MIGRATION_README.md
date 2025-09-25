# Database Migration: Add Cement Type Values to Parameter Settings

## Overview

This migration adds support for OPC (Ordinary Portland Cement) and PCC (Portland Composite Cement) specific min/max values to the `parameter_settings` table.

## Changes

- **New Columns Added:**
  - `opc_min_value` (numeric): Minimum value for OPC cement type
  - `opc_max_value` (numeric): Maximum value for OPC cement type
  - `pcc_min_value` (numeric): Minimum value for PCC cement type
  - `pcc_max_value` (numeric): Maximum value for PCC cement type

## Migration Steps

### Option 1: Automatic Migration (Recommended)

1. Ensure you have the correct environment variables set:

   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the migration script:
   ```bash
   node scripts/run_migration.js
   ```

### Option 2: Manual Migration via Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/migration_add_cement_values.sql`
4. Click **Run** to execute the migration

## Verification

After running the migration, verify that the new columns exist:

```sql
-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'parameter_settings'
AND column_name IN ('opc_min_value', 'opc_max_value', 'pcc_min_value', 'pcc_max_value')
ORDER BY column_name;
```

Expected output:

```
column_name    | data_type | is_nullable
---------------|-----------|-------------
opc_max_value  | numeric   | YES
opc_min_value  | numeric   | YES
pcc_max_value  | numeric   | YES
pcc_min_value  | numeric   | YES
```

## Rollback

If you need to rollback this migration:

```sql
-- Remove the added columns
ALTER TABLE parameter_settings
DROP COLUMN opc_min_value,
DROP COLUMN opc_max_value,
DROP COLUMN pcc_min_value,
DROP COLUMN pcc_max_value;
```

## Impact

- **Frontend**: The application will now support cement type-specific parameter ranges
- **COP Analysis**: Users can filter by cement type (OPC/PCC) to see appropriate min/max values
- **Data Integrity**: Existing data remains unchanged; new columns are nullable

## Testing

After migration:

1. Test parameter settings form - should show OPC/PCC input fields
2. Test COP Analysis page - should have cement type filter
3. Test data export/import - should include new columns
4. Verify COP calculations use correct min/max based on cement type filter
