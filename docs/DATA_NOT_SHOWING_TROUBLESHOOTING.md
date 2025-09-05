# TROUBLESHOOTING: Data Import Tersimpan di Supabase tapi Tidak Muncul di Aplikasi

## Masalah

Data berhasil diimport dan tersimpan di Supabase, tetapi tidak muncul di aplikasi.

## Kemungkinan Penyebab & Solusi

### 1. 🔍 **Filter Tidak Sesuai**

**Kemungkinan terbesar**: Data tersimpan dengan tanggal/area yang berbeda dengan filter yang aktif

**Cara Cek**:

- Pastikan filter **Area**, **Bulan**, dan **Tahun** sesuai dengan data yang diimport
- Contoh: Jika import data September 2025 tapi filter menampilkan Agustus 2025, data tidak akan muncul

### 2. 📅 **Format Tanggal Tidak Sesuai**

Data tersimpan dengan format tanggal yang tidak cocok dengan filter

**Cara Cek**:

- Buka console browser (F12)
- Klik tombol **🔍 Debug** yang sudah ditambahkan
- Lihat log untuk memahami format tanggal yang tersimpan vs filter

### 3. 🔄 **Cache/State Tidak Terupdate**

Data di-fetch tapi state aplikasi belum terupdate

## 🛠️ Debugging Steps yang Sudah Ditambahkan

### Langkah 1: Gunakan Tombol Debug

1. Buka aplikasi Stock Data Entry
2. Klik tombol **🔍 Debug** (warna kuning)
3. Buka Console browser (F12 → Console tab)
4. Lihat informasi debug yang muncul

### Langkah 2: Periksa Console Log

Console akan menampilkan:

```
=== DEBUG REFRESH ===
Current filter state: {filterArea: "Area A", filterMonth: 8, filterYear: 2025}
Total Records: 50
Filtered: 0
Available areas in data: ["Area A", "Area B"]
Available dates in data: ["2025-09-01", "2025-09-02"]
Filter validation: {hasFilterArea: true, currentMonthRecordsCount: 10, currentYearRecordsCount: 50}
```

### Langkah 3: Analisis Data

Dari log di atas, kita bisa melihat:

- **Total Records**: Berapa banyak data yang di-fetch dari database
- **Filtered**: Berapa banyak yang lolos filter (jika 0 = masalah filter)
- **Available areas**: Area apa saja yang tersedia di data
- **Available dates**: Tanggal apa saja yang ada
- **Filter validation**: Apakah filter yang aktif ada di data

## ✅ Solusi Berdasarkan Hasil Debug

### Jika `Filtered: 0` tapi `Total Records > 0`:

**Masalah**: Filter tidak cocok dengan data
**Solusi**:

1. Periksa **Area** di dropdown - pastikan sesuai dengan data yang diimport
2. Periksa **Bulan** - pastikan sesuai dengan tanggal di Excel
3. Periksa **Tahun** - pastikan sesuai dengan tahun di Excel

### Jika `Total Records: 0`:

**Masalah**: Data tidak ter-fetch dari database
**Solusi**:

1. Refresh halaman browser
2. Periksa koneksi internet
3. Cek apakah data benar-benar tersimpan di Supabase

### Jika `hasFilterArea: false`:

**Masalah**: Area di filter tidak ada di data
**Solusi**: Ganti Area di dropdown ke area yang tersedia

## 🎯 Contoh Kasus Umum

### Kasus 1: Import data September tapi filter menampilkan Agustus

```
Filter: {filterMonth: 7, filterYear: 2025}  // Agustus 2025
Data:   ["2025-09-01", "2025-09-02"]        // September 2025
Result: Tidak muncul karena month tidak cocok
```

**Solusi**: Ubah filter bulan ke September (bulan ke-9)

### Kasus 2: Import data "Area B" tapi filter menampilkan "Area A"

```
Filter: {filterArea: "Area A"}
Data:   area: "Area B"
Result: Tidak muncul karena area tidak cocok
```

**Solusi**: Ubah filter area ke "Area B"

## 🔧 Fitur Debug yang Ditambahkan

### 1. Enhanced Logging

- Filter operation sekarang log semua detail
- Import operation log sample data yang berhasil
- Fetch operation log jumlah data yang di-retrieve

### 2. Debug Button

- Tombol **🔍 Debug** untuk quick diagnosis
- Menampilkan summary di alert dan detail di console

### 3. Real-time Filter Validation

- Cek apakah filter values ada di data
- Count records per filter criteria

## 📋 Checklist Troubleshooting

- [ ] Klik tombol 🔍 Debug dan baca hasilnya
- [ ] Pastikan filter Area sesuai dengan data yang diimport
- [ ] Pastikan filter Bulan sesuai dengan tanggal di Excel
- [ ] Pastikan filter Tahun sesuai dengan data
- [ ] Periksa console log untuk detail error
- [ ] Refresh browser jika diperlukan

Setelah mengikuti langkah ini, data yang tersimpan di Supabase pasti akan muncul di aplikasi! 🚀
