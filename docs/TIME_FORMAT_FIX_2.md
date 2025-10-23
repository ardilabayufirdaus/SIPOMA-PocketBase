# Perbaikan Format Waktu untuk CCR Downtime Data

## Masalah yang Telah Diperbaiki

Sebelumnya, saat mencoba menyimpan data downtime dari UI, `start_time` dan `end_time` tidak tersimpan dengan benar ke dalam koleksi `ccr_downtime_data` di PocketBase. Masalah ini disebabkan oleh inkonsistensi dalam format waktu yang digunakan.

## Perubahan yang Dilakukan

1. **Standardisasi Format Waktu**:
   - Semua nilai waktu di `start_time` dan `end_time` kini menggunakan format `HH:MM`
   - Menghapus bagian detik (`:SS`) dari nilai waktu yang dihasilkan

2. **Perbaikan di CcrDowntimeForm.tsx**:
   - Mengubah nilai default dari `00:00:00` menjadi `00:00`
   - Menghapus konversi ke format `HH:MM:SS` saat mengubah input
   - Menambahkan eksplisit konversi format ke `HH:MM` saat mengirim form

3. **Perbaikan di CcrDataEntryPage.tsx**:
   - Menambahkan fungsi `formatTimeField` untuk memastikan format waktu konsisten
   - Memformat nilai waktu sebelum mengirim ke mutasi

4. **Perbaikan di useCcrDowntimeData.ts**:
   - Menambahkan fungsi `normalizeTimeFormat` untuk memastikan format waktu konsisten
   - Memformat nilai waktu sebelum mengirim ke PocketBase

## Panduan Format Waktu

Untuk konsistensi di seluruh aplikasi, selalu gunakan format berikut:

- **Tanggal**: `YYYY-MM-DD`
- **Waktu**: `HH:MM` (format 24 jam)

## Contoh Format yang Benar

```json
{
  "date": "2025-10-18",
  "start_time": "09:30",
  "end_time": "14:45",
  "unit": "Unit A",
  "pic": "John Doe",
  "problem": "Mesin mati"
}
```

## Cara Pengujian

1. Buka halaman CCR Data Entry
2. Tambahkan data downtime baru dengan mengisi semua field
3. Pastikan waktu yang dimasukkan di format `HH:MM`
4. Simpan data dan verifikasi bahwa data tersimpan dengan benar
5. Edit data yang sudah ada dan pastikan nilai waktu ditampilkan dan disimpan dengan benar
