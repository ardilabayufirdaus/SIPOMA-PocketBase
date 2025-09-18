-- Migration to add counter_total column to ccr_footer_data table
-- Jalankan script ini di Supabase SQL Editor setelah migrasi sebelumnya

-- Add counter_total column to ccr_footer_data table
ALTER TABLE ccr_footer_data ADD COLUMN IF NOT EXISTS counter_total NUMERIC;

-- Update existing records to set counter_total = total (if needed for migration)
-- Uncomment the line below if you want to copy existing total values to counter_total
-- UPDATE ccr_footer_data SET counter_total = total WHERE counter_total IS NULL;

-- Add index for counter_total if needed
CREATE INDEX IF NOT EXISTS idx_ccr_footer_data_counter_total ON ccr_footer_data(counter_total);