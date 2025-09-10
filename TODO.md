# TODO: Perbaikan Konfigurasi Supabase

## Status: In Progress

### 1. Perbaiki supabaseClient.ts

- [x] Ganti process.env ke import.meta.env
- [x] Pastikan supabaseUrl didefinisikan dengan benar
- [x] Nonaktifkan auth untuk menghindari GoTrueClient

### 2. Perbaiki supabaseAdmin.ts

- [x] Pastikan konsistensi konfigurasi
- [x] Nonaktifkan auth jika tidak diperlukan untuk operasi admin
- [x] Perbaiki TypeScript error untuk email_confirmed_at

### 3. Perbaiki supabase.ts

- [x] Pastikan konsistensi dengan client lainnya
- [x] Nonaktifkan auth

### 4. Verifikasi Operasi Users

- [x] Pastikan semua query menggunakan tabel users langsung
- [x] Hapus dependensi pada auth Supabase

### 5. Testing

- [x] Jalankan aplikasi dan verifikasi tidak ada error
- [x] Pastikan kredensial hanya dari tabel users

## Status: Completed

### 6. Perbaikan Bug useCallback

- [x] Tambahkan import useCallback di hooks/useUsers.ts
- [x] Verifikasi aplikasi berjalan tanpa error

### 7. Debugging Login

- [x] Tambahkan logging di LoginPage untuk debug password
- [ ] Test login dengan kredensial yang diberikan
- [ ] Identifikasi masalah password mismatch

### 8. Tambah Fitur Simpan Login

- [x] Tambahkan checkbox "Simpan login" di halaman login
- [x] Implementasi penyimpanan kredensial di localStorage
- [x] Auto-fill form dengan kredensial tersimpan

### 9. Setup Supabase Storage Bucket

- [x] Buat SQL script untuk konfigurasi bucket publik
- [x] Setup policies untuk akses tanpa authentication
- [x] Buat bucket terpisah untuk avatar/profile photos
- [x] Berikan contoh penggunaan di aplikasi untuk file umum dan avatar
- [x] Perbaiki RLS policy untuk upload avatar
- [x] Update ProfileEditModal dengan error handling yang lebih baik
