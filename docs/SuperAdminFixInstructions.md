# Panduan Perbaikan Hak Akses Super Admin (Development Mode)

## Latar Belakang
Pada mode development, Super Admin tidak mendapatkan hak akses penuh seperti pada mode preview/production. Hal ini terjadi karena perbedaan cara data permisi dihandle antara kedua mode tersebut.

## Solusi yang Diterapkan
Kami telah mengimplementasikan solusi client-side untuk mode development yang secara otomatis memberikan hak akses penuh untuk user dengan role Super Admin.

Solusi meliputi:
1. Hook `useSuperAdminAccess` yang mengoverride permisi Super Admin di memori
2. AppWrapper yang menerapkan hook tersebut khusus untuk mode development
3. Modifikasi index.tsx untuk menggunakan komponen yang berbeda berdasarkan mode (development vs production)

## Cara Pengujian

1. **Restart server development**
   ```
   npm run dev
   ```

2. **Bersihkan cache browser**
   - Buka Developer Tools (F12)
   - Tab Application -> Storage -> Clear Site Data
   - Atau buka browser dalam mode Incognito/Private Window

3. **Login sebagai Super Admin**
   - Gunakan kredensial Super Admin
   - Pastikan menggunakan akun dengan role "Super Admin"

4. **Verifikasi hak akses**
   - Cek akses ke semua bagian aplikasi: dashboard, inspection, project management, dll.
   - Cek akses ke semua unit pabrik: Tonasa 2/3, Tonasa 4, Tonasa 5
   - Verifikasi bahwa semua tombol dan fungsi yang seharusnya tersedia untuk Super Admin sudah muncul

## Troubleshooting

Jika masih mengalami masalah:

1. **Periksa konsol browser**
   - Buka Developer Tools (F12) -> Console
   - Cari pesan "[Development Mode] Overriding Super Admin permissions"
   - Jika tidak ada pesan tersebut, berarti hook tidak berjalan dengan benar

2. **Periksa localStorage**
   - Buka Developer Tools -> Application -> Storage -> Local Storage
   - Cek nilai "pocketbase_auth" dan verifikasi bahwa field permissions sudah terisi penuh

3. **Reset aplikasi**
   - Hapus semua data di localStorage
   - Logout dan login kembali
   - Jika masih gagal, restart server development: `npm run dev`

## Solusi Jangka Panjang
Solusi ini adalah workaround client-side untuk mode development. Untuk solusi jangka panjang, perlu dipertimbangkan:

1. Sinkronisasi skema database antara development dan production
2. Memastikan struktur data permisi konsisten di semua environment
3. Implementasi mekanisme permission inheritance untuk Super Admin di level database

## Catatan Penting
- Solusi ini hanya berlaku untuk mode development
- Pada mode production/preview, hak akses Super Admin sudah berfungsi dengan benar
- Perubahan ini tidak mempengaruhi atau memodifikasi database, hanya mengubah data di memori client