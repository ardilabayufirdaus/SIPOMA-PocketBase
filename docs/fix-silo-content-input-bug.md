# Perbaikan Bug Input Silo Content yang Hilang

## Masalah

- Setelah refresh browser, nilai input content kembali ke 0 atau kosong
- Nilai empty space tersimpan dengan benar, tetapi nilai content tidak

## Penyebab

1. Fungsi `safeShiftData` di `useCcrSiloData.ts` mengembalikan nilai default 0 ketika data dari database tidak valid
2. Nilai input mungkin tersimpan sebagai tipe data yang tidak tepat (string vs number)
3. Format angka Indonesia menggunakan koma sebagai pemisah desimal, yang bisa menyebabkan masalah konversi

## Perbaikan yang Dilakukan

1. Ubah fungsi `safeShiftData` untuk mengembalikan `undefined` daripada 0 untuk nilai kosong
2. Tambahkan validasi pada fungsi `updateSiloDataWithCreate` untuk memastikan nilai yang disimpan adalah number yang valid
3. Tambahkan konversi eksplisit di `handleSiloDataBlur` untuk memastikan nilai yang disimpan adalah number
4. Tambahkan logging untuk membantu debugging permasalahan ini

## Cara Verifikasi

1. Buka halaman CcrDataEntry
2. Input beberapa nilai di kolom content
3. Refresh browser
4. Verifikasi bahwa nilai content tetap tersimpan dan ditampilkan dengan benar

## Catatan Tambahan

- Format angka yang ditampilkan menggunakan format Indonesia (koma sebagai desimal)
- Persentase dihitung berdasarkan nilai content dan kapasitas silo
- Jika masalah masih terjadi, periksa log browser untuk informasi debugging lebih lanjut
