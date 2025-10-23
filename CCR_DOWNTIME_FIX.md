# CCR Downtime Data Fix Summary

## Problem Analysis

The application was experiencing a `400 Bad Request` error when trying to add new CCR downtime data. After investigation, we found the following issues:

1. The PocketBase database schema for `ccr_downtime_data` collection likely doesn't have fields like:
   - `date_string`
   - `date_year`
   - `date_month`
   - `date_day`

2. Our code was trying to save these fields even though they don't exist in the schema.

3. The expected interface in `types.ts` shows only these fields are valid:
   ```typescript
   export interface CcrDowntimeData {
     id: string;
     date: string; // YYYY-MM-DD
     start_time: string; // HH:MM
     end_time: string; // HH:MM
     pic: string;
     problem: string;
     unit: string;
     action?: string;
     corrective_action?: string;
     status?: DowntimeStatus;
   }
   ```

## Changes Made

1. **Fixed the addDowntimeMutation in useCcrDowntimeData.ts**:
   - Removed the extra fields that were causing the 400 Bad Request error
   - Simplified the payload to only include fields defined in the schema
   - Kept the date normalization for consistency

2. **Created Schema Inspector Tools**:
   - Added `schema-inspector.mjs` to help developers inspect the actual database schema
   - Added `fix-data-consistency.mjs` to fix any inconsistent data in the database

## Additional Recommendations

1. Consider using a type checking tool like Zod to validate data shapes before sending to PocketBase
2. Add better error handling to display meaningful messages when a 400 Bad Request occurs
3. Document the exact schema requirements in the codebase for future reference

## How to Test the Fix

1. Try adding a new CCR downtime record through the application UI
2. Verify that the record is saved without errors
3. Run the schema inspector to verify the field structure matches what we're saving

## Ongoing Maintenance

The `fix-data-consistency.mjs` tool can be run periodically to ensure database consistency, especially after schema changes or migrations.
