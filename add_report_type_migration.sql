-- Migration to add report_type column to whatsApp_report_settings table
-- This migration adds the report_type field to differentiate between daily and shift reports

-- Add the report_type column with default value 'daily' for backward compatibility
ALTER TABLE whatsApp_report_settings
ADD COLUMN report_type TEXT NOT NULL DEFAULT 'daily'
CHECK (report_type IN ('daily', 'shift'));

-- Update existing records to have report_type = 'daily' (this is redundant with DEFAULT but explicit)
UPDATE whatsApp_report_settings
SET report_type = 'daily'
WHERE report_type IS NULL OR report_type = '';

-- Add comment to the column for documentation
COMMENT ON COLUMN whatsApp_report_settings.report_type IS 'Type of report this setting applies to: daily or shift';