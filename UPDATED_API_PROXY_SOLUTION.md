# Solusi API Proxy Vercel untuk Mixed Content

## Solusi Komprehensif untuk Menangani Mixed Content

Dokumen ini menjelaskan solusi API proxy yang diimplementasikan untuk menangani masalah mixed content ketika mengakses backend HTTP dari frontend HTTPS pada deployment Vercel.

## Masalah yang Diselesaikan

Aplikasi SIPOMA yang di-deploy di Vercel menggunakan protokol HTTPS, sementara backend PocketBase berjalan di server dengan protokol HTTP. Browser modern memblokir permintaan "mixed content" ini, yang menyebabkan:

1. Kegagalan koneksi ke backend
2. Error "Mixed Content" di konsol browser
3. Pengguna tidak dapat login atau mengakses data

## Solusi Teknis

### 1. Serverless Function API Proxy

Kami mengimplementasikan serverless function di Vercel untuk mem-proxy permintaan dari frontend HTTPS ke backend HTTP.

**File Kunci:**

- `api/pb-proxy-simple.js`: Implementasi proxy serverless yang sederhana dan handal
- `api/pb-proxy-edge.js`: Implementasi alternatif menggunakan Vercel Edge Runtime
- `api/pb-proxy.js`: Implementasi awal (kini sebagai fallback)

### 2. Pengelolaan Protokol Otomatis

Fungsi `getPocketbaseUrl()` di `utils/pocketbase.ts` diperbarui untuk secara otomatis:

- Mendeteksi jika aplikasi berjalan di lingkungan HTTPS
- Mengalihkan permintaan melalui proxy API jika berjalan di HTTPS
- Menggunakan HTTP langsung jika berjalan di lingkungan lokal atau HTTP

### 3. Integrasi dengan Vercel Deployment

Konfigurasi Vercel (`vercel.json`) diperbarui untuk:

- Merutekan semua permintaan `/api/pb-proxy/*` ke fungsi proxy yang tepat
- Mengatur header CORS dan Cache-Control yang tepat
- Menangani permintaan OPTIONS untuk pre-flight checks CORS

### 4. Komponen Testing dan Diagnostik

Untuk memudahkan debugging, kami menyediakan:

- `ConnectionTester.tsx`: Komponen untuk menguji koneksi ke PocketBase langsung maupun melalui proxy
- Endpoint `/api/test.js`: API untuk memeriksa status Vercel deployment dan API proxy

## Cara Kerja Proxy API

Saat diakses melalui HTTPS (Vercel):

1. Frontend mengirim permintaan ke `/api/pb-proxy`
2. Vercel serverless function menerima permintaan
3. Serverless function meneruskan permintaan ke backend HTTP PocketBase
4. Serverless function menerima respon dari PocketBase dan meneruskannya kembali ke frontend
5. Browser menerima data dari backend melalui proxy HTTPS

## Keuntungan Implementasi Ini

- **Transparansi Total**: Tidak perlu mengubah kode aplikasi yang ada
- **Backward Compatibility**: Tetap berfungsi pada lingkungan HTTP
- **Performa Optimal**: Menggunakan proxy hanya jika diperlukan
- **Diagnostik Mudah**: Komponen tester memudahkan debugging
- **Dukungan Semua Fitur**: Mendukung semua endpoint API, autentikasi, dan file upload/download

## Pengujian Konektivitas

Untuk menguji konektivitas API:

1. Login sebagai Super Admin
2. Akses "Connection Tester" dari menu sidebar
3. Uji koneksi langsung dan melalui API proxy
4. Periksa status kesehatan dan detail lingkungan

Jika mengalami masalah:

- Periksa Network tab di browser DevTools untuk error HTTP
- Lihat log Vercel untuk pesan error serverless function
- Pastikan konfigurasi CORS di PocketBase mengizinkan origin Vercel

## Pemeliharaan ke Depan

Jika backend PocketBase pindah ke HTTPS di masa depan:

1. Perbarui variabel `pocketbaseHost` di `utils/pocketbase.ts`
2. Perbarui logika `getPocketbaseUrl()` untuk menggunakan HTTPS langsung
3. Proxy API akan tetap berfungsi sebagai fallback
