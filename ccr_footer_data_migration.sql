-- Migration script untuk menambahkan tabel ccr_footer_data
-- Jalankan script ini di Supabase SQL Editor
-- NOTE: RLS DISABLED - menggunakan authentication internal aplikasi

-- CCR Footer Data table
CREATE TABLE IF NOT EXISTS ccr_footer_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    parameter_id UUID NOT NULL,
    plant_unit VARCHAR(100),
    total NUMERIC,
    average NUMERIC,
    minimum NUMERIC,
    maximum NUMERIC,
    shift1_total NUMERIC DEFAULT 0,
    shift2_total NUMERIC DEFAULT 0,
    shift3_total NUMERIC DEFAULT 0,
    shift3_cont_total NUMERIC DEFAULT 0,
    shift1_difference NUMERIC DEFAULT 0,
    shift2_difference NUMERIC DEFAULT 0,
    shift3_difference NUMERIC DEFAULT 0,
    shift3_cont_difference NUMERIC DEFAULT 0,
    shift1_average NUMERIC DEFAULT 0,
    shift2_average NUMERIC DEFAULT 0,
    shift3_average NUMERIC DEFAULT 0,
    shift3_cont_average NUMERIC DEFAULT 0,
    counter_total NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, parameter_id, plant_unit)
);

-- ALTER TABLE statements untuk menambahkan kolom baru jika tabel sudah ada
ALTER TABLE ccr_footer_data ADD COLUMN IF NOT EXISTS shift1_average NUMERIC DEFAULT 0;
ALTER TABLE ccr_footer_data ADD COLUMN IF NOT EXISTS shift2_average NUMERIC DEFAULT 0;
ALTER TABLE ccr_footer_data ADD COLUMN IF NOT EXISTS shift3_average NUMERIC DEFAULT 0;
ALTER TABLE ccr_footer_data ADD COLUMN IF NOT EXISTS shift3_cont_average NUMERIC DEFAULT 0;
ALTER TABLE ccr_footer_data ADD COLUMN IF NOT EXISTS counter_total NUMERIC DEFAULT 0;

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_ccr_footer_data_date ON ccr_footer_data(date);
CREATE INDEX IF NOT EXISTS idx_ccr_footer_data_parameter_id ON ccr_footer_data(parameter_id);
CREATE INDEX IF NOT EXISTS idx_ccr_footer_data_plant_unit ON ccr_footer_data(plant_unit);

-- DISABLE Row Level Security (RLS) - menggunakan authentication internal aplikasi
ALTER TABLE ccr_footer_data DISABLE ROW LEVEL SECURITY;

-- Hapus policy yang ada jika ada (untuk safety)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON ccr_footer_data;