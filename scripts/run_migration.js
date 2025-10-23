/**
 * Migration Script: Add OPC and PCC min/max values to parameter_settings table
 *
 * INSTRUCTIONS:
 * 1. Open Supabase Dashboard (https://supabase.com/dashboard)
 * 2. Go to your project
 * 3. Navigate to SQL Editor
 * 4. Copy and paste the contents of migration_add_cement_values.sql
 * 5. Run the SQL script
 *
 * This will add the following columns to parameter_settings table:
 * - opc_min_value: numeric (Minimum value for OPC cement type)
 * - opc_max_value: numeric (Maximum value for OPC cement type)
 * - pcc_min_value: numeric (Minimum value for PCC cement type)
 * - pcc_max_value: numeric (Maximum value for PCC cement type)
 */

console.log('Migration script for adding cement type values to parameter_settings table');
console.log('Please run the SQL script manually in Supabase SQL Editor');
console.log('File location: scripts/migration_add_cement_values.sql');

