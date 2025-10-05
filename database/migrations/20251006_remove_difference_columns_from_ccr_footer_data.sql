-- Migration: Remove shift difference columns from ccr_footer_data table
-- Date: 2025-10-06
-- Description: Remove shift1_difference, shift2_difference, shift3_difference, and shift3_cont_difference columns

ALTER TABLE ccr_footer_data
DROP COLUMN IF EXISTS shift1_difference,
DROP COLUMN IF EXISTS shift2_difference,
DROP COLUMN IF EXISTS shift3_difference,
DROP COLUMN IF EXISTS shift3_cont_difference;