-- SQL untuk mengatur Supabase Storage Bucket agar dapat diakses tanpa authentication
-- Jalankan query ini di SQL Editor Supabase Dashboard

-- ===========================================
-- BUCKET UNTUK FILE UMUM (sipoma-files)
-- ===========================================

-- 1. Buat bucket storage umum jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('sipoma-files', 'sipoma-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Buat policy untuk mengizinkan akses publik ke bucket umum
-- Policy untuk SELECT (read) - mengizinkan semua orang melihat file
CREATE POLICY "Public Access Files" ON storage.objects
FOR SELECT USING (bucket_id = 'sipoma-files');

-- 3. Policy untuk INSERT (upload) - mengizinkan semua orang upload file
CREATE POLICY "Public Upload Files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sipoma-files');

-- 4. Policy untuk UPDATE (update file) - mengizinkan semua orang update file
CREATE POLICY "Public Update Files" ON storage.objects
FOR UPDATE USING (bucket_id = 'sipoma-files');

-- 5. Policy untuk DELETE (hapus file) - mengizinkan semua orang hapus file
CREATE POLICY "Public Delete Files" ON storage.objects
FOR DELETE USING (bucket_id = 'sipoma-files');

-- ===========================================
-- BUCKET UNTUK AVATAR/PROFILE PHOTOS (avatars)
-- ===========================================

-- 6. Buat bucket khusus untuk avatar/profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 7. SOLUSI: Buat RLS policies yang permisif untuk bucket avatars
-- Hapus policy yang ada jika ada
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Avatars" ON storage.objects;

-- 8. Buat policy untuk SELECT (read) - mengizinkan semua orang melihat avatar
CREATE POLICY "Public Access Avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 9. Policy untuk INSERT (upload) - mengizinkan semua orang upload avatar
CREATE POLICY "Public Upload Avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- 10. Policy untuk UPDATE - mengizinkan semua orang update avatar
CREATE POLICY "Public Update Avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');

-- 11. Policy untuk DELETE - mengizinkan semua orang hapus avatar
CREATE POLICY "Public Delete Avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars');

-- ===========================================
-- VERIFIKASI KONFIGURASI
-- ===========================================

-- 11. Verifikasi semua bucket sudah public
SELECT id, name, public FROM storage.buckets WHERE id IN ('sipoma-files', 'avatars');

-- ===========================================
-- CONTOH PENGGUNAAN DI APLIKASI
-- ===========================================

-- Upload file umum tanpa auth:
-- const { data, error } = await supabase.storage
--   .from('sipoma-files')
--   .upload('documents/report.pdf', file);

-- Upload avatar tanpa auth:
-- const { data, error } = await supabase.storage
--   .from('avatars')
--   .upload(`user-${userId}/avatar.jpg`, avatarFile);

-- Download file umum tanpa auth:
-- const { data } = supabase.storage
--   .from('sipoma-files')
--   .getPublicUrl('documents/report.pdf');

-- Download avatar tanpa auth:
-- const { data } = supabase.storage
--   .from('avatars')
--   .getPublicUrl(`user-${userId}/avatar.jpg`);

-- URL publik akan seperti:
-- https://[project-ref].supabase.co/storage/v1/object/public/sipoma-files/documents/report.pdf
-- https://[project-ref].supabase.co/storage/v1/object/public/avatars/user-123/avatar.jpg

-- ===========================================
-- CATATAN KEAMANAN
-- ===========================================
-- Setup ini membuat bucket sepenuhnya publik untuk kemudahan development.
-- Untuk production, pertimbangkan:
-- 1. Gunakan signed URLs untuk file sensitif
-- 2. Implementasi autentikasi untuk operasi upload/update/delete
-- 3. Buat bucket terpisah untuk file sensitif dengan RLS
-- 4. Monitor penggunaan storage secara berkala
-- 5. Set limit ukuran file dan tipe file yang diizinkan

-- ===========================================
-- ROLLBACK (jika perlu)
-- ===========================================
-- DROP POLICY "Public Access Files" ON storage.objects;
-- DROP POLICY "Public Upload Files" ON storage.objects;
-- DROP POLICY "Public Update Files" ON storage.objects;
-- DROP POLICY "Public Delete Files" ON storage.objects;
-- DROP POLICY "Public Access Avatars" ON storage.objects;
-- DROP POLICY "Public Upload Avatars" ON storage.objects;
-- DROP POLICY "Public Update Avatars" ON storage.objects;
-- DROP POLICY "Public Delete Avatars" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id IN ('sipoma-files', 'avatars');
