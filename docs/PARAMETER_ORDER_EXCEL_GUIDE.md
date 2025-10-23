## Panduan Penggunaan Export/Import Excel untuk Pengaturan Urutan Parameter

### Fitur Export Excel

Fitur ini memungkinkan Anda untuk mengekspor urutan parameter saat ini ke dalam format Excel. Anda dapat menggunakan file Excel ini untuk:

1. Membuat perubahan urutan parameter secara massal
2. Menyimpan konfigurasi urutan parameter sebagai cadangan
3. Mendistribusikan urutan parameter standar ke pengguna lain

### Fitur Import Excel

Fitur ini memungkinkan Anda untuk mengimpor urutan parameter dari file Excel yang telah diedit. Anda dapat:

1. Mengedit nilai pada kolom "Order" untuk mengubah urutan parameter
2. Mengatur ulang parameter dalam jumlah banyak secara cepat
3. Menerapkan urutan parameter standar yang telah didistribusikan

### Cara Menggunakan:

#### Export ke Excel:

1. Klik tombol "Export to Excel" pada modal pengaturan urutan parameter
2. File Excel akan diunduh dengan format "Parameter*Order*[Unit]\_[Timestamp].xlsx"
3. Buka file Excel dengan aplikasi spreadsheet seperti Microsoft Excel atau Google Sheets

#### Edit File Excel:

1. Pada file Excel, Anda akan melihat daftar parameter dengan kolom:
   - Order: Urutan parameter (kolom yang dapat diedit, dengan latar belakang kuning)
   - ID: ID parameter (jangan diubah)
   - Parameter Name: Nama parameter
   - Unit: Satuan parameter
   - Data Type: Tipe data parameter
   - Category: Kategori parameter

2. Untuk mengubah urutan parameter:
   - Edit nilai pada kolom "Order" (kolom pertama)
   - Pastikan urutan dimulai dari 1 dan tidak ada nilai duplikat
   - Jangan mengubah nilai pada kolom ID, karena ini digunakan sebagai pengidentifikasi unik

#### Import dari Excel:

1. Setelah mengedit file Excel, simpan perubahan
2. Klik tombol "Import from Excel" pada modal pengaturan urutan parameter
3. Pilih file Excel yang telah diedit
4. Sistem akan menerapkan urutan parameter baru berdasarkan nilai di kolom "Order"
5. Klik tombol "Done" untuk menyimpan urutan parameter baru ke database

### Tips Penggunaan:

- Gunakan fitur sort dan filter pada Excel untuk memudahkan pengaturan urutan parameter
- Anda dapat mengurutkan parameter berdasarkan nama, satuan, atau kategori sebelum menetapkan nilai urutan baru
- Untuk pengaturan yang kompleks, pertimbangkan untuk menggunakan rumus Excel untuk menetapkan urutan secara otomatis
- Pastikan untuk selalu memeriksa urutan parameter setelah mengimpor untuk memastikan hasilnya sesuai dengan yang diharapkan

### Pemecahan Masalah:

- Jika beberapa parameter tidak muncul setelah import, pastikan kolom ID tidak diubah
- Jika urutan parameter terlihat acak, pastikan nilai di kolom "Order" adalah angka berurutan
- Jika terjadi kesalahan saat import, periksa format file Excel dan pastikan struktur kolom tidak berubah

### Keuntungan Menggunakan Fitur Ini:

- Pengaturan parameter yang lebih cepat dan efisien
- Kemampuan untuk menyimpan dan berbagi konfigurasi urutan parameter
- Pengaturan urutan parameter yang konsisten di seluruh sistem
