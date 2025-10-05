-- Migration: Remove max per shift columns from ccr_footer_data table
-- Date: October 6, 2025
-- Description: Remove shift1_max, shift2_max, shift3_max, shift3_cont_max columns as they are no longer needed

-- Remove max columns from ccr_footer_data table
ALTER TABLE ccr_footer_data
DROP COLUMN IF EXISTS shift1_max,
DROP COLUMN IF EXISTS shift2_max,
DROP COLUMN IF EXISTS shift3_max,
DROP COLUMN IF EXISTS shift3_cont_max;