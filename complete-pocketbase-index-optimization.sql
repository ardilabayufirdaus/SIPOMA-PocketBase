-- ===========================================
-- COMPLETE POCKETBASE INDEX OPTIMIZATION
-- ===========================================
-- Analisis indeks yang sudah ada vs yang dibutuhkan
-- untuk mempercepat load data di semua koleksi

-- ===========================================
-- 1. ANALISIS INDEKS YANG SUDAH ADA
-- ===========================================

-- ✅ SUDAH OPTIMAL:
-- - users: role, is_active, created
-- - ccr_downtime_data: date, unit, date+unit, pic, status, duration, date+status
-- - ccr_footer_data: date, parameter_id, unit_id, date+unit, plant_unit
-- - ccr_information: date, plant_unit (UNIQUE date+plant_unit)
-- - ccr_material_usage: date, unit, category, shift, date+unit, date+category, unit+shift, date+unit+shift (UNIQUE)
-- - ccr_parameter_data: parameter_id, date+parameter, plant_unit, date+unit
-- - ccr_silo_data: date, date+silo_id, created
-- - parameter_settings: unit+category, unit+parameter, category+parameter
-- - parameter_order_profiles: user_id, module, parameter_type, user+module+type, name, user+module+type+category+unit, module+type+created, UNIQUE user+module+type+name, created+desc, category, unit
-- - simple_report_settings: category, parameter_id, order, category+parameter
-- - user_actions: created, success
-- - user_permissions: UNIQUE user_id, role
-- - user_sessions: session_start, session_end, user_id

-- ❌ PERLU DITAMBAHKAN INDEKS:

-- ===========================================
-- 2. INDEKS TAMBAHAN YANG DIPERLUKAN
-- ===========================================

-- AUTONOMOUS_RISK_DATA - Tidak ada indeks, perlu untuk filter date + unit
CREATE INDEX `idx_autonomous_risk_data_date` ON `autonomous_risk_data` (`date`);
CREATE INDEX `idx_autonomous_risk_data_unit` ON `autonomous_risk_data` (`unit`);
CREATE INDEX `idx_autonomous_risk_data_date_unit` ON `autonomous_risk_data` (`date`, `unit`);

-- CCR_DOWNTIME_DATA - Tambah indeks untuk status filtering yang lebih cepat
CREATE INDEX `idx_ccr_downtime_status_date` ON `ccr_downtime_data` (`status`, `date`);

-- CCR_FOOTER_DATA - Tambah indeks untuk moisture/capacity calculations
CREATE INDEX `idx_ccr_footer_data_date_parameter_id` ON `ccr_footer_data` (`date`, `parameter_id`);
CREATE INDEX `idx_ccr_footer_data_date_plant_unit` ON `ccr_footer_data` (`date`, `plant_unit`);

-- CCR_MATERIAL_USAGE - Tambah indeks untuk category filtering
CREATE INDEX `idx_ccr_material_usage_category_unit` ON `ccr_material_usage` (`plant_category`, `plant_unit`);
CREATE INDEX `idx_ccr_material_usage_date_category_unit` ON `ccr_material_usage` (`date`, `plant_category`, `plant_unit`);

-- CCR_PARAMETER_DATA - Tambah indeks untuk bulk moisture queries
CREATE INDEX `idx_ccr_parameter_data_date_plant_unit` ON `ccr_parameter_data` (`date`, `plant_unit`);
CREATE INDEX `idx_ccr_parameter_data_plant_unit_date` ON `ccr_parameter_data` (`plant_unit`, `date`);

-- CCR_SILO_DATA - Tambah indeks untuk silo filtering
CREATE INDEX `idx_ccr_silo_data_silo_id` ON `ccr_silo_data` (`silo_id`);

-- COP_ANALYSIS_CACHE - Tidak ada indeks, perlu untuk cache management
CREATE INDEX `idx_cop_analysis_cache_expires_at` ON `cop_analysis_cache` (`expires_at`);
CREATE INDEX `idx_cop_analysis_cache_category_unit_year_month` ON `cop_analysis_cache` (`category`, `unit`, `year`, `month`);
CREATE INDEX `idx_cop_analysis_cache_last_accessed` ON `cop_analysis_cache` (`last_accessed`);

-- NOTIFICATIONS - Tidak ada indeks, perlu untuk user notifications
CREATE INDEX `idx_notifications_user_id` ON `notifications` (`user_id`);
CREATE INDEX `idx_notifications_created` ON `notifications` (`created`);
CREATE INDEX `idx_notifications_read_at` ON `notifications` (`read_at`);
CREATE INDEX `idx_notifications_user_created` ON `notifications` (`user_id`, `created`);

-- PLANT_UNITS - Tidak ada indeks, perlu untuk unit lookups
CREATE INDEX `idx_plant_units_unit` ON `plant_units` (`unit`);
CREATE INDEX `idx_plant_units_category` ON `plant_units` (`category`);
CREATE INDEX `idx_plant_units_category_unit` ON `plant_units` (`category`, `unit`);

-- PROJECT_TASKS - Tidak ada indeks, perlu untuk project management
CREATE INDEX `idx_project_tasks_project_id` ON `project_tasks` (`project_id`);
CREATE INDEX `idx_project_tasks_planned_end` ON `project_tasks` (`planned_end`);
CREATE INDEX `idx_project_tasks_actual_end` ON `project_tasks` (`actual_end`);

-- REPORT_SETTINGS - Tidak ada indeks, perlu untuk report ordering
CREATE INDEX `idx_report_settings_category_order` ON `report_settings` (`category`, `order`);

-- SILO_CAPACITIES - Tidak ada indeks, perlu untuk silo lookups
CREATE INDEX `idx_silo_capacities_plant_category` ON `silo_capacities` (`plant_category`);
CREATE INDEX `idx_silo_capacities_unit` ON `silo_capacities` (`unit`);
CREATE INDEX `idx_silo_capacities_category_unit` ON `silo_capacities` (`plant_category`, `unit`);

-- USER_ACTIONS - Tambah indeks untuk audit trails
CREATE INDEX `idx_user_actions_user_id` ON `user_actions` (`user_id`);
CREATE INDEX `idx_user_actions_module` ON `user_actions` (`module`);
CREATE INDEX `idx_user_actions_action_type` ON `user_actions` (`action_type`);
CREATE INDEX `idx_user_actions_user_module` ON `user_actions` (`user_id`, `module`);

-- USER_PARAMETER_ORDERS - Tidak ada indeks, perlu untuk user preferences
CREATE INDEX `idx_user_parameter_orders_user_id` ON `user_parameter_orders` (`user_id`);
CREATE INDEX `idx_user_parameter_orders_module` ON `user_parameter_orders` (`module`);
CREATE INDEX `idx_user_parameter_orders_user_module` ON `user_parameter_orders` (`user_id`, `module`);

-- USER_SESSIONS - Tambah indeks untuk session management
CREATE INDEX `idx_user_sessions_is_active` ON `user_sessions` (`is_active`);
CREATE INDEX `idx_user_sessions_last_activity` ON `user_sessions` (`last_activity`);
CREATE INDEX `idx_user_sessions_user_active` ON `user_sessions` (`user_id`, `is_active`);

-- WORK_INSTRUCTIONS - Tidak ada indeks, perlu untuk documentation
CREATE INDEX `idx_work_instructions_plant_category` ON `work_instructions` (`plant_category`);
CREATE INDEX `idx_work_instructions_plant_unit` ON `work_instructions` (`plant_unit`);
CREATE INDEX `idx_work_instructions_category_unit` ON `work_instructions` (`plant_category`, `plant_unit`);

-- ===========================================
-- 3. INDEKS KHUSUS COP ANALYSIS OPTIMIZATION
-- ===========================================

-- COP Analysis specific - untuk moisture dan capacity calculations
CREATE INDEX `idx_ccr_parameter_data_moisture_lookup` ON `ccr_parameter_data` (`plant_unit`, `date`);
CREATE INDEX `idx_ccr_footer_data_capacity_lookup` ON `ccr_footer_data` (`plant_unit`, `date`, `parameter_id`);

-- Parameter settings optimization untuk COP Analysis
CREATE INDEX `idx_parameter_settings_cop_lookup` ON `parameter_settings` (`unit`, `category`, `parameter`);

-- ===========================================
-- 4. IMPLEMENTATION PRIORITY
-- ===========================================

-- HIGH PRIORITY (Critical untuk performance):
-- 1. ccr_parameter_data_date_plant_unit
-- 2. ccr_footer_data_date_parameter_id
-- 3. ccr_footer_data_date_plant_unit
-- 4. cop_analysis_cache_expires_at
-- 5. cop_analysis_cache_category_unit_year_month

-- MEDIUM PRIORITY (Important untuk UX):
-- 6. autonomous_risk_data_date_unit
-- 7. ccr_material_usage_category_unit
-- 8. plant_units_category_unit
-- 9. silo_capacities_category_unit
-- 10. user_actions_user_module

-- LOW PRIORITY (Nice to have):
-- 11. notifications_user_created
-- 12. user_sessions_user_active
-- 13. work_instructions_category_unit
-- 14. project_tasks_project_id

-- ===========================================
-- 5. MONITORING & VERIFICATION
-- ===========================================

-- Query untuk verifikasi indeks:
-- SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='ccr_parameter_data';

-- Query untuk performance monitoring:
-- EXPLAIN QUERY PLAN SELECT * FROM ccr_parameter_data WHERE date = '2024-01-01' AND plant_unit = 'Unit1';

-- Query untuk index usage statistics:
-- PRAGMA index_list(ccr_parameter_data);
-- PRAGMA index_info(idx_ccr_parameter_data_date_plant_unit);