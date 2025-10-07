-- Migration: Add shift average columns to ccr_footer_data table
-- Date: 2025-10-07
-- Description: Add shift1_average, shift2_average, shift3_average, and shift3_cont_average columns

ALTER TABLE ccr_footer_data
ADD COLUMN IF NOT EXISTS shift1_average NUMERIC,
ADD COLUMN IF NOT EXISTS shift2_average NUMERIC,
ADD COLUMN IF NOT EXISTS shift3_average NUMERIC,
ADD COLUMN IF NOT EXISTS shift3_cont_average NUMERIC;