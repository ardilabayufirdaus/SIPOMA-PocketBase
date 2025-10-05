-- Migration: Add counter columns to ccr_footer_data table
-- Date: 2025-10-06
-- Description: Add shift1_counter, shift2_counter, shift3_counter, and shift3_cont_counter columns

ALTER TABLE ccr_footer_data
ADD COLUMN IF NOT EXISTS shift1_counter NUMERIC,
ADD COLUMN IF NOT EXISTS shift2_counter NUMERIC,
ADD COLUMN IF NOT EXISTS shift3_counter NUMERIC,
ADD COLUMN IF NOT EXISTS shift3_cont_counter NUMERIC;