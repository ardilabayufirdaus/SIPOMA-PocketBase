# Langkah-langkah Finalisasi Migrasi Supabase ke PocketBase

## Migrasi yang Sudah Selesai

- [x] Mengimplementasikan PocketBase WhatsApp repositories
- [x] Mengupdate dependency-container.ts untuk menggunakan PocketBase repositories
- [x] Mengubah password update di SettingsPage.tsx ke PocketBase
- [x] Mengubah query CCR di PlantOperationsDashboardPage.tsx untuk menggunakan PocketBase filter
- [x] Mengubah utils/databaseMigration.ts untuk menggunakan PocketBase API
- [x] Mengubah UserPermissionManager dan UserPermissionManagerNew untuk menggunakan PocketBase subscriptions
- [x] Membuat helper untuk UserPermissionManager untuk membantu migrasi

## Langkah Finalisasi

1. **Hapus File dan Dependencies yang Tidak Digunakan**

   ```bash
   # Hapus file supabaseClient.ts yang sudah tidak digunakan
   rm utils/supabaseClient.ts
   ```

2. **Update Environment Variables**
   - Hapus environment variables yang terkait dengan Supabase di `.env` dan `.env.example`
   - Contoh:

     ```
     # Hapus ini
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...

     # Pastikan ini ada
     VITE_POCKETBASE_URL=...
     ```

3. **Testing**
   - Uji semua fitur yang sebelumnya menggunakan Supabase
   - Verifikasi autentikasi berfungsi dengan benar
   - Verifikasi realtime subscriptions berfungsi dengan benar
   - Verifikasi akses dan perubahan data berfungsi dengan benar

4. **Update Documentation**
   - Perbarui README.md dengan informasi tentang penggunaan PocketBase
   - Tambahkan catatan tentang migrasi yang telah dilakukan

5. **Cleanup Debugging Code**
   - Bersihkan console.log statements yang ditambahkan selama migrasi
   - Bersihkan kode komentar yang tidak lagi relevan

## Catatan Penting

- PocketBase client diexport sebagai `supabase` dalam `pocketbaseClient.ts` untuk kompatibilitas
- Helper functions dibuat untuk mempermudah migrasi
- Struktur database PocketBase harus mirip dengan Supabase untuk memastikan kompatibilitas
