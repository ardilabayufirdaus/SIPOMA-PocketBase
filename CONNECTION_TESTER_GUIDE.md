# Panduan Pemecahan Masalah Mixed Content

Dokumen ini menyediakan langkah-langkah untuk mendiagnosis dan memecahkan masalah mixed content yang dapat terjadi ketika mengakses aplikasi SIPOMA melalui HTTPS yang terhubung ke backend HTTP.

## Cara Menggunakan Connection Tester

### 1. Akses Connection Tester

1. Login sebagai Super Admin
2. Klik menu "Connection Tester" di sidebar
3. Halaman pengujian akan terbuka

### 2. Menjalankan Pengujian

Connection Tester menyediakan tiga pengujian:

- **Test API Endpoint**: Memeriksa apakah API endpoint dasar berfungsi
- **Test Koneksi Langsung**: Mencoba koneksi langsung ke backend PocketBase
- **Test Koneksi via Proxy**: Mencoba koneksi melalui API proxy

### 3. Interpretasi Hasil

#### Skenario 1: Semua Test Berhasil

- Koneksi berfungsi dengan baik
- API proxy berjalan dengan benar

#### Skenario 2: Test API Endpoint Berhasil, Lainnya Gagal

- Vercel API routing berfungsi
- Proxy API mungkin memiliki masalah

#### Skenario 3: Test Koneksi Langsung Berhasil, Test Proxy Gagal

- Mixed content diblokir
- API proxy tidak berfungsi dengan benar

#### Skenario 4: Semua Test Gagal

- Masalah konektivitas jaringan secara umum
- Backend PocketBase mungkin tidak berjalan

## Pemecahan Masalah Umum

### 403 Forbidden dari API Proxy

Jika API proxy mengembalikan 403 Forbidden:

1. Periksa header CORS di vercel.json
2. Pastikan API endpoint di PocketBase mengizinkan origin Vercel
3. Pastikan metode HTTP yang digunakan didukung

### Failed to Fetch / Network Error

1. Pastikan backend PocketBase berjalan
2. Periksa firewall atau proxy yang mungkin memblokir koneksi
3. Periksa apakah alamat IP backend benar

### Mixed Content Error di Console

1. Pastikan pocketbase.ts menggunakan fungsi getPocketbaseUrl yang benar
2. Pastikan URL PocketBase tidak hard-coded sebagai HTTP di tempat lain
3. Gunakan Chrome DevTools > Security untuk melihat sumber mixed content

## Referensi API Proxy

Untuk memahami implementasi API proxy lebih lanjut, silakan merujuk ke:

- `UPDATED_API_PROXY_SOLUTION.md`: Dokumentasi lengkap solusi
- `api/pb-proxy-simple.js`: Implementasi proxy yang sederhana
- `utils/pocketbase.ts`: Logika deteksi protokol dan URL
