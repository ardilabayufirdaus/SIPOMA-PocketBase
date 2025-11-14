-- ===========================================
-- COP ANALYSIS MOISTURE & CAPACITY INDEXES
-- ===========================================
-- Indexes untuk mempercepat load data % Moisture Content dan Capacity (ton)
-- di footer tabel COP Analysis

-- ===========================================
-- 1. PARAMETER_SETTINGS COLLECTION INDEXES
-- ===========================================
-- Digunakan untuk lookup parameter IDs berdasarkan unit, category, parameter

-- Index untuk query: parameter_settings filter unit (moisture lookup)
CREATE INDEX `idx_parameter_settings_unit` ON `parameter_settings` (
  `unit`
);

-- Index untuk query: parameter_settings filter unit + category (capacity lookup)
CREATE INDEX `idx_parameter_settings_unit_category` ON `parameter_settings` (
  `unit`,
  `category`
);

-- Index untuk query: parameter_settings filter unit + parameter (moisture parameter lookup)
CREATE INDEX `idx_parameter_settings_unit_parameter` ON `parameter_settings` (
  `unit`,
  `parameter`
);

-- Index untuk query: parameter_settings filter category + parameter (counter feeder lookup)
CREATE INDEX `idx_parameter_settings_category_parameter` ON `parameter_settings` (
  `category`,
  `parameter`
);

-- ===========================================
-- 2. CCR_PARAMETER_DATA COLLECTION INDEXES
-- ===========================================
-- Digunakan untuk perhitungan moisture content dari hourly data

-- Index untuk query: ccr_parameter_data filter date + parameter_id (moisture calculations)
CREATE INDEX `idx_ccr_parameter_data_date_parameter` ON `ccr_parameter_data` (
  `date`,
  `parameter_id`
);

-- Index untuk query: ccr_parameter_data filter date + plant_unit (bulk moisture queries)
CREATE INDEX `idx_ccr_parameter_data_date_unit` ON `ccr_parameter_data` (
  `date`,
  `plant_unit`
);

-- Index yang sudah ada (untuk referensi)
-- CREATE INDEX `idx_parameter_date` ON `ccr_parameter_data` (`date`);
-- CREATE INDEX `idx_parameter_id` ON `ccr_parameter_data` (`parameter_id`);

-- ===========================================
-- 3. CCR_FOOTER_DATA COLLECTION INDEXES
-- ===========================================
-- Digunakan untuk perhitungan capacity dari counter feeder data

-- Index untuk query: ccr_footer_data filter date + parameter_id (capacity calculations)
CREATE INDEX `idx_ccr_footer_data_date_parameter` ON `ccr_footer_data` (
  `date`,
  `parameter_id`
);

-- Index untuk query: ccr_footer_data filter date + plant_unit (bulk capacity queries)
CREATE INDEX `idx_ccr_footer_data_date_unit` ON `ccr_footer_data` (
  `date`,
  `plant_unit`
);

-- Index yang sudah ada (untuk referensi)
-- CREATE INDEX `idx_footer_date` ON `ccr_footer_data` (`date`);
-- CREATE INDEX `idx_footer_parameter_id` ON `ccr_footer_data` (`parameter_id`);
-- CREATE INDEX `idx_cop_analysis_date_param_unit` ON `ccr_footer_data` (`date`, `parameter_id`, `plant_unit`);

-- ===========================================
-- IMPLEMENTATION NOTES
-- ===========================================
--
-- 1. Jalankan SQL di atas di PocketBase database (SQLite)
-- 2. Bisa melalui:
--    - PocketBase Admin Panel → Database → SQL Query
--    - Direct SQLite access jika tersedia
--    - Database management tools (DB Browser for SQLite, dll)
--
-- 3. Verifikasi indexes:
--    SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='ccr_parameter_data';
--
-- 4. Performance impact:
--    - Moisture queries: ~30-50 individual queries → 1-2 optimized queries
--    - Capacity queries: ~30-50 individual queries → 1-2 optimized queries
--    - Combined dengan frontend caching: near-instant footer loading