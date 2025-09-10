# Setup Supabase Storage untuk Upload Avatar

## Masalah yang Ditemukan

Error "new row violates row-level security policy" saat upload avatar ke bucket Supabase.

## Solusi

Buat Row Level Security (RLS) policies yang permisif untuk bucket avatars agar upload bisa dilakukan tanpa autentikasi.

## Langkah-langkah Setup

### 1. Buka Supabase Dashboard

- Login ke [Supabase Dashboard](https://supabase.com/dashboard)
- Pilih project Anda

### 2. Buka SQL Editor

- Klik menu "SQL Editor" di sidebar kiri
- Klik "New Query"

### 3. Jalankan Query Setup Storage

Copy dan paste seluruh isi file `supabase_storage_setup.sql` ke SQL Editor, lalu klik "Run":

```sql
-- Jalankan seluruh query dari supabase_storage_setup.sql
```

### 4. Verifikasi Setup

Setelah menjalankan query, verifikasi dengan query berikut:

```sql
-- Cek apakah bucket sudah dibuat dan public
SELECT id, name, public FROM storage.buckets WHERE id IN ('sipoma-files', 'avatars');

-- Cek apakah policies sudah dibuat
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### 5. Test Upload Avatar

- Jalankan aplikasi di `http://localhost:5179`
- Coba upload avatar di halaman profile
- Upload sekarang harus berhasil tanpa error RLS

## Catatan Penting

### Keamanan

Setup ini menonaktifkan RLS untuk kemudahan development. Untuk production:

1. **Aktifkan kembali RLS** dengan policies yang lebih ketat
2. **Gunakan signed URLs** untuk file sensitif
3. **Implementasi autentikasi** untuk upload/update/delete
4. **Monitor penggunaan storage** secara berkala

### Rollback (jika perlu)

Jika ingin mengembalikan ke kondisi sebelumnya:

```sql
-- Aktifkan kembali RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Hapus bucket jika tidak diperlukan
DELETE FROM storage.buckets WHERE id IN ('sipoma-files', 'avatars');
```

## Troubleshooting

### Masih ada error RLS?

- Pastikan query SQL sudah dijalankan dengan benar
- Restart aplikasi setelah setup storage
- Cek console browser untuk error detail

### Bucket tidak ditemukan?

- Pastikan bucket 'avatars' sudah dibuat di Storage dashboard
- Cek nama bucket di kode aplikasi (harus 'avatars')

### Upload berhasil tapi gambar tidak muncul?

- Pastikan bucket sudah diset public
- Cek URL public yang dihasilkan di console
