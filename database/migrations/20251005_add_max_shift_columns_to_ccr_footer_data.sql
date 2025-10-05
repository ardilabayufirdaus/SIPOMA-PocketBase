-- Migration: Add max per shift columns to ccr_footer_data table
-- Date: October 5, 2025
-- Description: Add shift1_max, shift2_max, shift3_max, shift3_cont_max columns to store maximum values per shift

-- Add max columns to ccr_footer_data table
ALTER TABLE ccr_footer_data
ADD COLUMN IF NOT EXISTS shift1_max numeric,
ADD COLUMN IF NOT EXISTS shift2_max numeric,
ADD COLUMN IF NOT EXISTS shift3_max numeric,
ADD COLUMN IF NOT EXISTS shift3_cont_max numeric;

-- Add comments for documentation
COMMENT ON COLUMN ccr_footer_data.shift1_max IS 'Maximum value for shift 1 (hours 8-15)';
COMMENT ON COLUMN ccr_footer_data.shift2_max IS 'Maximum value for shift 2 (hours 16-22)';
COMMENT ON COLUMN ccr_footer_data.shift3_max IS 'Maximum value for shift 3 (hours 23-24)';
COMMENT ON COLUMN ccr_footer_data.shift3_cont_max IS 'Maximum value for shift 3 continuation (hours 1-7)';