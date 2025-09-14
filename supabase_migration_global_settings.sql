-- Migration untuk menambahkan kolom user_id ke tabel global_parameter_settings
-- Jalankan di SQL Editor Supabase Dashboard

-- Tambahkan kolom user_id jika belum ada
ALTER TABLE global_parameter_settings
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update kolom user_id untuk data yang sudah ada (opsional, tergantung kebutuhan)
-- Jika ada data lama tanpa user_id, bisa di-set ke NULL atau user tertentu

-- Pastikan RLS policies diperbarui jika diperlukan
-- Contoh policy untuk user_id
DROP POLICY IF EXISTS "Users can view their own settings" ON global_parameter_settings;
CREATE POLICY "Users can view their own settings" ON global_parameter_settings
FOR SELECT USING (auth.uid() = user_id OR is_global = true);

DROP POLICY IF EXISTS "Users can insert their own settings" ON global_parameter_settings;
CREATE POLICY "Users can insert their own settings" ON global_parameter_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON global_parameter_settings;
CREATE POLICY "Users can update their own settings" ON global_parameter_settings
FOR UPDATE USING (auth.uid() = user_id);

-- Super Admin bisa mengelola semua settings
DROP POLICY IF EXISTS "Super Admin can manage all settings" ON global_parameter_settings;
CREATE POLICY "Super Admin can manage all settings" ON global_parameter_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'Super Admin'
  )
);