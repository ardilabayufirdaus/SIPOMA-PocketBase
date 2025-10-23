
-- Script untuk membuat indeks pada ccr_parameter_data
-- Run this SQL via PocketBase Admin UI > Settings > Import Collections

-- Indeks untuk field date
CREATE INDEX IF NOT EXISTS idx_ccr_param_date ON ccr_parameter_data (date);

-- Indeks untuk field parameter_id
CREATE INDEX IF NOT EXISTS idx_ccr_param_parameter_id ON ccr_parameter_data (parameter_id);

-- Indeks untuk field plant_unit
CREATE INDEX IF NOT EXISTS idx_ccr_param_plant_unit ON ccr_parameter_data (plant_unit);

-- Indeks untuk kombinasi date,parameter_id
CREATE INDEX IF NOT EXISTS idx_ccr_param_date_parameter_id ON ccr_parameter_data (date, parameter_id);

-- Indeks untuk kombinasi date,plant_unit
CREATE INDEX IF NOT EXISTS idx_ccr_param_date_plant_unit ON ccr_parameter_data (date, plant_unit);

-- Indeks untuk kombinasi parameter_id,date
CREATE INDEX IF NOT EXISTS idx_ccr_param_parameter_id_date ON ccr_parameter_data (parameter_id, date);

-- Indeks untuk kombinasi parameter_id,plant_unit
CREATE INDEX IF NOT EXISTS idx_ccr_param_parameter_id_plant_unit ON ccr_parameter_data (parameter_id, plant_unit);

-- Indeks untuk kombinasi date,parameter_id,plant_unit
CREATE INDEX IF NOT EXISTS idx_ccr_param_date_parameter_id_plant_unit ON ccr_parameter_data (date, parameter_id, plant_unit);

-- Pesan konfirmasi
SELECT 'Indeks untuk ccr_parameter_data berhasil dibuat' AS message;
