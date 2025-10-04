-- Add order column to report_settings table
ALTER TABLE report_settings ADD COLUMN "order" INTEGER DEFAULT 0;

-- Update existing records with sequential order based on current sorting
UPDATE report_settings SET "order" = sub.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY category, parameter_id) - 1 as row_num
  FROM report_settings
) sub
WHERE report_settings.id = sub.id;

-- Add index for order column
CREATE INDEX idx_report_settings_order ON report_settings ("order");