# Perbaikan Error 400 (Bad Request) pada CCR Parameter Data Entry

## Latar Belakang Masalah

Terdapat masalah pada CCR Parameter Data Entry dimana saat menyimpan data parameter ke PocketBase sering terjadi error 400 (Bad Request). Masalah ini terjadi karena beberapa faktor:

1. Format tanggal yang tidak konsisten
2. Tipe data parameter yang tidak sesuai (string vs number)
3. Kurangnya validasi sebelum menyimpan data
4. Plant unit yang tidak tersimpan dengan benar
5. Proses simpan yang terlalu sering saat pengguna mengetik

## Solusi yang Diimplementasikan

### 1. Implementasi Fungsi Simpan yang Lebih Sederhana dan Robust

File: `utils/parameterDataUpdater.ts`

Membuat fungsi `updateParameterDataFixed` yang lebih simpel dan terstruktur untuk menyimpan data parameter dengan langkah-langkah yang jelas:

- Normalisasi format tanggal
- Pengecekan data yang sudah ada
- Pengambilan informasi plant_unit dari parameter
- Format nilai yang konsisten untuk database

### 2. Validasi Format Data Parameter

File: `utils/formatParameterDataFlat.ts`

Menambahkan fungsi `formatParameterDataFlat` untuk memastikan data parameter memiliki format yang valid sebelum dikirim ke PocketBase:

- Normalisasi format tanggal ke YYYY-MM-DD
- Konversi nilai string kosong menjadi null
- Konversi string angka menjadi tipe number
- Validasi field-field yang wajib ada

### 3. Hook Baru yang Lebih Sederhana dan Handal

File: `hooks/useCcrParameterDataSimple.ts`

Membuat hook React baru yang lebih sederhana dan fokus pada fungsi-fungsi penting:

- Antrian penyimpanan (save queue) untuk mengurangi jumlah request ke server
- Delay penyimpanan untuk menghindari terlalu banyak request
- Error handling yang lebih baik
- Respons UI yang lebih cepat dengan optimistic update

### 4. Alternatif UI yang Lebih Ringan

File: `pages/plant_operations/CcrDataEntryPageSimple.tsx`

Membuat versi yang lebih sederhana dari halaman CCR Data Entry:

- Fokus pada fungsi-fungsi penting saja
- Menggunakan hook baru yang lebih handal
- Penyimpanan data hanya saat pengguna berpindah sel
- Indikator status penyimpanan

### 5. Opsi Pilihan Mode

File: `pages/PlantOperationsPage.tsx`

Menambahkan tombol untuk memilih antara versi standar dan versi simpel:

- Pengguna dapat memilih mode yang sesuai kebutuhan
- Mode simpel untuk fokus pada entry data dengan cepat dan handal
- Mode standar untuk fitur lengkap

## Cara Penggunaan

1. Buka halaman CCR Data Entry
2. Pilih mode yang diinginkan menggunakan tombol di bagian atas
3. Pada mode simpel, data akan otomatis tersimpan saat berpindah sel
4. Status penyimpanan akan ditampilkan di samping pemilih tanggal

## Keuntungan Perbaikan

1. Pengurangan error 400 (Bad Request) saat menyimpan data
2. Format data yang lebih konsisten di database
3. Pengalaman pengguna yang lebih baik dengan penyimpanan yang handal
4. Fleksibilitas pemilihan mode sesuai kebutuhan
5. Kode yang lebih terstruktur dan mudah dipelihara

## Tahap Berikutnya

1. Monitoring kinerja untuk memastikan solusi ini efektif
2. Optimasi lebih lanjut jika diperlukan
3. Migrasi fitur-fitur dari mode standar ke mode simpel secara bertahap
