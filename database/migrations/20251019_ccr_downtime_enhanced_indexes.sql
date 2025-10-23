-- CCR Downtime Data Enhanced Indexes
-- Tanggal: 19 Oktober 2025
-- Deskripsi: Menambahkan dan mengoptimalkan indeks untuk koleksi ccr_downtime_data

-- Indeks untuk pencarian berdasarkan tanggal (paling sering digunakan)
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date ON ccr_downtime_data (date);

-- Indeks untuk pencarian berdasarkan unit
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_unit ON ccr_downtime_data (unit);

-- Indeks komposit untuk pencarian berdasarkan tanggal dan unit
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date_unit ON ccr_downtime_data (date, unit);

-- Indeks untuk pencarian berdasarkan PIC
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_pic ON ccr_downtime_data (pic);

-- Indeks untuk pencarian berdasarkan status
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_status ON ccr_downtime_data (status);

-- Indeks untuk pencarian berdasarkan durasi (untuk analisis)
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_duration_minutes ON ccr_downtime_data (duration_minutes);

-- Indeks komposit untuk pencarian berdasarkan tanggal dan status
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date_status ON ccr_downtime_data (date, status);

-- Indeks untuk optimalisasi sorting dan grouping berdasarkan tanggal
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date_created ON ccr_downtime_data (date, created);