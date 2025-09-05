# Menambahkan Kolom Budget ke Tabel Projects

## Catatan

- Kolom `budget` menggunakan tipe `BIGINT` untuk menyimpan nilai rupiah (tanpa desimal)
- Default value adalah 0 untuk project yang belum memiliki budget
- Kolom bersifat nullable (bisa NULL) untuk fleksibilitas
- Format tampilan menggunakan "Rp" sebagai prefix (contoh: Rp 50.000.000)
- Perubahan tipe data di `types/supabase.ts` sudah disesuaikanangkah-langkah:

### 1. Akses Supabase Dashboard

- Buka [Supabase Dashboard](https://app.supabase.com/)
- Login ke akun Anda
- Pilih project yang sesuai

### 2. Buka SQL Editor

- Di sidebar kiri, klik **SQL Editor**
- Atau buka tab **Database** > **SQL Editor**

### 3. Jalankan SQL Command

Salin dan jalankan SQL berikut:

```sql
-- Add budget column to projects table
ALTER TABLE projects
ADD COLUMN budget BIGINT DEFAULT 0;

-- Update existing projects with default budget if needed
UPDATE projects SET budget = 0 WHERE budget IS NULL;

-- Add comment to describe the column
COMMENT ON COLUMN projects.budget IS 'Project budget in Indonesian Rupiah (IDR)';
```

### 4. Verifikasi Perubahan

- Buka tab **Database** > **Tables**
- Pilih tabel `projects`
- Pastikan kolom `budget` sudah muncul dengan tipe `DECIMAL(15,2)`

### 5. Test Data (Opsional)

Untuk memastikan kolom berfungsi, Anda bisa test dengan query:

```sql
-- Test insert project with budget
INSERT INTO projects (title, budget) VALUES ('Test Project', 50000000);

-- Test update budget
UPDATE projects SET budget = 75000000 WHERE title = 'Test Project';

-- Verify data
SELECT * FROM projects WHERE title = 'Test Project';
```

## Catatan:

- Kolom `budget` menggunakan tipe `DECIMAL(15,2)` untuk menyimpan nilai currency dengan 2 desimal
- Default value adalah 0 untuk project yang belum memiliki budget
- Kolom bersifat nullable (bisa NULL) untuk fleksibilitas
- Perubahan tipe data di `types/supabase.ts` sudah disesuaikan

## File yang Sudah Diupdate:

1. `types/supabase.ts` - Definisi tipe untuk kolom budget
2. `add-budget-column.sql` - Script SQL untuk menambahkan kolom
3. Aplikasi sudah siap menggunakan kolom budget setelah database diupdate
