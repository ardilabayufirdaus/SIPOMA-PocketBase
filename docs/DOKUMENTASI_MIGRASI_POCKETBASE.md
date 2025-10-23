# Rekomendasi Perubahan Dokumen untuk Migrasi Supabase ke PocketBase

Berikut adalah daftar file dokumentasi yang perlu diperbarui untuk mencerminkan migrasi dari Supabase ke PocketBase:

## 1. README.md Utama

Bagian yang perlu diubah:

- Baris 8: Deskripsi teknologi (ubah Supabase menjadi PocketBase)
- Baris 24: Fitur autentikasi (ubah ke PocketBase)
- Baris 58: Stack teknologi (ubah ke PocketBase)
- Baris 77: Prasyarat (ubah ke PocketBase)
- Baris 98, 242: Petunjuk setup (ubah ke konfigurasi PocketBase)
- Baris 172, 397: Credits (tambahkan PocketBase)
- Baris 248: Migrasi (ubah ke PocketBase)
- Baris 279-280: Contoh variabel lingkungan (ubah ke PocketBase)

## 2. docs/README.md

Bagian yang perlu diubah:

- Baris 14: Penyimpanan foto (ubah ke PocketBase Files)
- Baris 27-29: Variabel lingkungan (ubah ke PocketBase)
- Baris 34: Setup Storage (ubah ke PocketBase Files)

## 3. Scripts dan Migrasi

- Perbarui scripts/migrate-to-pocketbase.cjs untuk menggunakan PocketBase API sepenuhnya
- Perbarui scripts/MIGRATION_README.md untuk mencerminkan perubahan ke PocketBase

## Contoh Perubahan Utama

### 1. Deskripsi Teknologi

Dari:

```
A modern, real-time plant operations management system built with React 18, TypeScript, and Supabase.
```

Menjadi:

```
A modern, real-time plant operations management system built with React 18, TypeScript, and PocketBase.
```

### 2. Variabel Lingkungan

Dari:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Menjadi:

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_POCKETBASE_EMAIL=admin@example.com
VITE_POCKETBASE_PASSWORD=your_secure_password
```

### 3. Petunjuk Setup

Dari:

```
# Edit .env with your Supabase credentials
# Run Supabase migrations
```

Menjadi:

```
# Edit .env with your PocketBase credentials
# Import PocketBase collections schema
```

## Rekomendasi Tambahan

1. Buat dokumen panduan migrasi untuk pengembang baru yang mencakup:
   - Perbedaan struktur koleksi antara Supabase dan PocketBase
   - Panduan penggunaan PocketBase API vs Supabase API
   - Pola umum untuk konversi query

2. Perbarui dokumentasi API dan skema data untuk mencerminkan perubahan struktur database PocketBase
