-- SQL untuk membuat indexes pada tabel Supabase untuk optimasi performa
-- Jalankan di SQL Editor Supabase Dashboard

-- ===========================================
-- INDEXES UNTUK TABEL global_parameter_settings
-- ===========================================

-- Index untuk user_id (digunakan dalam query eq)
CREATE INDEX IF NOT EXISTS idx_global_parameter_settings_user_id
ON global_parameter_settings (user_id);

-- Index untuk is_global (digunakan dalam query eq)
CREATE INDEX IF NOT EXISTS idx_global_parameter_settings_is_global
ON global_parameter_settings (is_global);

-- Index untuk plant_category (digunakan dalam query eq)
CREATE INDEX IF NOT EXISTS idx_global_parameter_settings_plant_category
ON global_parameter_settings (plant_category);

-- Index untuk plant_unit (digunakan dalam query eq)
CREATE INDEX IF NOT EXISTS idx_global_parameter_settings_plant_unit
ON global_parameter_settings (plant_unit);

-- Index komposit untuk query kombinasi (user_id, is_global, plant_category, plant_unit)
CREATE INDEX IF NOT EXISTS idx_global_parameter_settings_combined
ON global_parameter_settings (user_id, is_global, plant_category, plant_unit);

-- Index untuk updated_at (digunakan dalam order by)
CREATE INDEX IF NOT EXISTS idx_global_parameter_settings_updated_at
ON global_parameter_settings (updated_at DESC);

-- ===========================================
-- INDEXES UNTUK TABEL users
-- ===========================================

-- Index untuk created_at (digunakan dalam order by)
CREATE INDEX IF NOT EXISTS idx_users_created_at
ON users (created_at DESC);

-- Index untuk role (jika sering difilter berdasarkan role)
CREATE INDEX IF NOT EXISTS idx_users_role
ON users (role);

-- Index untuk is_active (jika sering difilter)
CREATE INDEX IF NOT EXISTS idx_users_is_active
ON users (is_active);

-- ===========================================
-- INDEXES UNTUK TABEL alerts
-- ===========================================

-- Index untuk timestamp (digunakan dalam order by)
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp
ON alerts (timestamp DESC);

-- Index untuk severity (jika sering difilter berdasarkan severity)
CREATE INDEX IF NOT EXISTS idx_alerts_severity
ON alerts (severity);

-- ===========================================
-- INDEXES UNTUK TABEL projects
-- ===========================================

-- Index untuk status (jika sering difilter)
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects (status);

-- Index untuk created_at (jika sering di-order)
CREATE INDEX IF NOT EXISTS idx_projects_created_at
ON projects (created_at DESC);

-- ===========================================
-- INDEXES UNTUK TABEL project_tasks
-- ===========================================

-- Index untuk project_id (foreign key, sering di-query)
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id
ON project_tasks (project_id);

-- Index untuk planned_start dan planned_end (jika sering di-query untuk scheduling)
CREATE INDEX IF NOT EXISTS idx_project_tasks_planned_dates
ON project_tasks (planned_start, planned_end);

-- ===========================================
-- INDEXES UNTUK TABEL cop_parameters
-- ===========================================

-- Index untuk id (primary key sudah ada, tapi untuk eq query)
CREATE INDEX IF NOT EXISTS idx_cop_parameters_id
ON cop_parameters (id);

-- ===========================================
-- VERIFIKASI INDEXES
-- ===========================================

-- Query untuk melihat semua indexes yang sudah dibuat
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ===========================================
-- CATATAN PENGGUNAAN
-- ===========================================
-- Indexes ini akan mempercepat query yang sering digunakan dalam aplikasi
-- Monitor performa query menggunakan EXPLAIN ANALYZE
-- Jika ada query lambat baru, tambahkan indexes sesuai kebutuhan