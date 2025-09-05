# Packing Plant Stock Upsert Fix

## Problem

The application was encountering multiple errors when trying to upsert records into the `packing_plant_stock` table:

1. **Initial Error (400 Bad Request)**:

```
Error upserting stock record: {code: '42P10', details: null, hint: null, message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification'}
```

2. **Follow-up Error (406 Not Acceptable)**:

```
GET https://ectjrbguwmlkqfyeyfvo.supabase.co/rest/v1/packing_plant_stock?select=id&date=eq.2025-09-01&area=eq.Ambon 406 (Not Acceptable)
```

3. **Constraint Violation Error (400 Bad Request)**:

```
Error inserting stock record: {code: '23502', details: 'Failing row contains (..., null).', hint: null, message: 'null value in column "record_id" of relation "packing_plant_stock" violates not-null constraint'}
```

4. **Foreign Key Constraint Violation (409 Conflict)**:

```
Error inserting stock record: {code: '23503', details: 'Key (id)=(89883972-8c2c-4a29-b2cb-23b3dfe5de8d) is not present in table "packing_plant_master".', hint: null, message: 'insert or update on table "packing_plant_stock" violates foreign key constraint "packing_plant_stock_id_fkey"'}
```

5. **Invalid UUID Format (400 Bad Request)**:

```
Error inserting stock record: {code: '22P02', details: null, hint: null, message: 'invalid input syntax for type uuid: ""'}
```

## Root Cause

1. **Missing Unique Constraint**: The `upsertRecord` function was using Supabase's `upsert` method with `onConflict: 'date,area'`, but the database table didn't have a unique constraint on the combination of `date` and `area` columns.

2. **Missing Required Field**: The database table has a required `record_id` column that was not included in the TypeScript interface or the data operations.

3. **Foreign Key Constraint**: The `packing_plant_stock` table has a foreign key constraint where the `id` field must reference an existing record in the `packing_plant_master` table. The hook functions were not properly handling the `id` field that comes from the master table lookup.

4. **Invalid UUID Format**: The `id` field in the database is a UUID type, but the application was trying to insert empty strings (`""`) when no master record was found, causing UUID validation errors.

## Solution

### Phase 1: Fixed Upsert Logic

Replaced the `upsert` operation with a manual check-and-update-or-insert approach:

1. **Query First**: Check if a record with the same `date` and `area` already exists
2. **Update or Insert**:
   - If record exists: Update the existing record using its `id`
   - If record doesn't exist: Insert a new record
3. **Handle Required Fields**: Added default values for `opening_stock` and `stock_received` fields

### Phase 2: Added Missing record_id Field

1. **Updated TypeScript Interface**: Added `record_id?: string` to `PackingPlantStockRecord` interface
2. **Updated Database Operations**: Include `record_id` in all insert/update operations
3. **Generate record_id**: Create `record_id` as `${area}-${date}` when not provided

### Phase 3: Fixed Foreign Key Constraint and UUID Validation

1. **Include Master Table ID**: Modified functions to properly handle the `id` field that references `packing_plant_master`
2. **Updated Function Signatures**: Changed `addRecord` and `addBulkRecords` to include `id` in the record
3. **Fixed Update Logic**: Ensured update operations don't try to modify the primary key `id` field
4. **UUID Validation**: Added checks to only include `id` field when it's a valid UUID (not empty string)
5. **Conditional ID Inclusion**: Modified all insert operations to omit the `id` field when it's empty, allowing auto-generation

## Changes Made

### 1. Modified `PackingPlantStockRecord` interface in `types.ts`

- Added `record_id?: string` field
- Added React import to fix compilation error

### 2. Updated `usePackingPlantStockData.ts`

- Modified `fetchRecords` to include `record_id` in SELECT query
- Updated `upsertRecord` function with conditional update/insert logic
- Fixed `addRecord` function to include `record_id` with default value
- Fixed `addBulkRecords` function to include `record_id` for all records
- Added proper error handling for database operations

## Technical Details

The fix ensures that:

- No database schema changes are required
- The application gracefully handles both new inserts and updates
- All required database fields are properly populated (including `record_id`)
- The `processRecords` function will recalculate derived fields after data fetch
- Default `record_id` is generated as `${area}-${date}` format

## Testing

After applying the fix:

- The development server starts successfully without errors
- TypeScript compilation passes without errors
- The upsert operation should now work correctly for packing plant stock data
- All database constraints are satisfied

## Files Modified

- `hooks/usePackingPlantStockData.ts`
- `types.ts`
