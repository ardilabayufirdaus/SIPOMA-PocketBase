-- Add indexes for CCR downtime data performance optimization
-- Date: October 4, 2025

-- Index on date column for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_data_date ON ccr_downtime_data (date);

-- Index on unit column for faster unit-based filtering
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_data_unit ON ccr_downtime_data (unit);

-- Composite index on date and unit for combined filtering
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_data_date_unit ON ccr_downtime_data (date, unit);

-- Index on pic column for PIC-based queries
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_data_pic ON ccr_downtime_data (pic);