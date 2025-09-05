# Quick Add Feature - Stock Data Entry

## Fitur Baru: Entry Data Stock yang Lebih Efisien

### Deskripsi

Fitur Quick Add memungkinkan penambahan data stock secara langsung di bawah tabel tanpa perlu membuka modal dialog. Data akan ditambahkan secara berurutan berdasarkan tanggal terakhir yang ada.

### Cara Kerja

#### 1. **Quick Add Row**

- Ketika ada data dalam tabel, akan muncul baris "Tambah data untuk tanggal [tanggal berikutnya]" di bawah tabel
- Klik baris tersebut untuk mengaktifkan mode quick add
- Baris input akan muncul dengan:
  - Tanggal otomatis (hari berikutnya dari data terakhir)
  - Area sudah terisi sesuai filter yang aktif
  - Opening Stock otomatis (dari closing stock hari sebelumnya)
  - Stock Received dihitung otomatis berdasarkan formula

#### 2. **Input Data**

- **Stock Out**: Input pertama yang akan di-focus otomatis
- **Closing Stock**: Input kedua
- Ketik angka dan akan otomatis diformat (misal: 1000 → 1.000,00)
- Stock Received akan dihitung secara real-time

#### 3. **Keyboard Shortcuts**

- **Enter** pada field Stock Out: Pindah ke field Closing Stock
- **Enter** pada field Closing Stock: Simpan data
- **Escape**: Batal dan keluar dari mode quick add

#### 4. **Mode Auto-Continue**

- Centang checkbox "Lanjut otomatis ke tanggal berikutnya"
- Setelah menyimpan data, form akan otomatis siap untuk tanggal berikutnya
- Memungkinkan entry data berhari-hari secara berturut-turut dengan cepat

#### 5. **Tombol Add Data yang Smart**

- Jika tanggal berikutnya masih dalam periode filter yang aktif, tombol akan menampilkan tanggal spesifik
- Otomatis menggunakan quick add mode untuk efisiensi
- Jika di luar periode filter, akan membuka modal dialog biasa

### Keuntungan

1. **Efisiensi**: Tidak perlu membuka/tutup modal berulang kali
2. **Otomatisasi**: Tanggal, area, dan opening stock terisi otomatis
3. **Visualisasi Real-time**: Stock received dihitung dan ditampilkan langsung
4. **Keyboard Friendly**: Bisa dioperasikan hanya dengan keyboard
5. **Batch Entry**: Mode auto-continue untuk entry data berhari-hari

### Kompatibilitas

- Terintegrasi penuh dengan sistem yang ada
- Menggunakan validasi dan kalkulasi yang sama dengan modal form
- Data tersimpan dalam format yang sama dengan metode entry lainnya
- Mendukung dark mode dan responsive design

### Technical Implementation

- State management untuk quick add mode
- Real-time calculation untuk stock received
- Automatic date progression
- Keyboard event handling
- Smart button state management
- Auto-focus management untuk UX yang optimal
