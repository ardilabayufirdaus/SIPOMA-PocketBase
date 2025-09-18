-- Migration: Add plant_unit column to whatsapp_report_settings table
-- Date: 2025-09-18
-- Description: Add plant_unit column to support specific plant unit configuration for WhatsApp report settings

-- Add plant_unit column to existing table
ALTER TABLE whatsapp_report_settings
ADD COLUMN IF NOT EXISTS plant_unit VARCHAR(50);

-- Add comment to the column for documentation
COMMENT ON COLUMN whatsapp_report_settings.plant_unit IS 'Specific plant unit for this setting. If null, applies to all units in the category';

-- Add index for plant_unit column for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_report_settings_plant_unit ON whatsapp_report_settings(plant_unit);

-- Optional: Add composite index for category and plant_unit for common queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_report_settings_category_plant_unit ON whatsapp_report_settings(category, plant_unit);