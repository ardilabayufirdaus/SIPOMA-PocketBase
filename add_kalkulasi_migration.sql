-- Migration: Add kalkulasi column to whatsapp_report_settings table
-- Date: 2025-09-18
-- Description: Add kalkulasi column to support different calculation methods for WhatsApp report settings

-- Add kalkulasi column to existing table
ALTER TABLE whatsapp_report_settings
ADD COLUMN IF NOT EXISTS kalkulasi VARCHAR(20) CHECK (kalkulasi IN ('selisih', 'total', 'average', 'min', 'max', 'counter_total'));

-- Set default value for existing records (use 'total' as default for backward compatibility)
UPDATE whatsapp_report_settings
SET kalkulasi = 'total'
WHERE kalkulasi IS NULL AND jenis = 'number';

-- Add index for kalkulasi column
CREATE INDEX IF NOT EXISTS idx_whatsapp_report_settings_kalkulasi ON whatsapp_report_settings(kalkulasi);