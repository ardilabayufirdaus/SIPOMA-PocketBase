-- Fix untuk tabel roles yang sudah ada
-- Jalankan di Supabase SQL Editor

-- Tambah kolom description jika belum ada
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert default roles dengan handling jika sudah ada
INSERT INTO roles (name, description) VALUES
  ('Super Admin', 'Full access to all modules'),
  ('Admin', 'Administrative access with some restrictions'),
  ('Operator', 'Operational access to specific modules'),
  ('Guest', 'Read-only access')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- Verifikasi tabel sudah benar
SELECT * FROM roles;