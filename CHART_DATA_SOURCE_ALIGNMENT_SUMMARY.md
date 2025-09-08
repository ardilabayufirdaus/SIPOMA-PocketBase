# Chart Data Source Alignment Summary

## Overview

Telah dilakukan penyesuaian pada Stock Projection Chart dan Daily Stock Flow agar Stock Out/Actual Stock Out sesuai dengan sumber data tabel This Month Projection Detail. Jika data kosong, maka chart juga akan menyesuaikan (tidak menampilkan bar).

## Changes Made

### 1. Stock Projection Chart (Main Chart)

**Before:**

- Menggunakan single `stockOut` field yang berisi campuran data aktual dan prediksi
- Menggunakan referensi `processedChartData` di beberapa bagian

**After:**

- **Actual Stock Out Bar:** Menggunakan `actualStockOut` field (merah solid, #ef4444)
  - Hanya menampilkan bar untuk data aktual
  - Kosong/tidak ada bar untuk data prediksi
- **Predicted Stock Out Bar:** Menggunakan `predictedStockOut` field (orange semi-transparan, #f97316)
  - Menampilkan prediksi untuk semua hari
  - Opacity lebih rendah (0.4) ketika ada data aktual
- Semua referensi menggunakan `tableData` untuk konsistensi

### 2. Daily Stock Flow Chart

**Before:**

- Menggunakan `stockOut` field yang berisi campuran data aktual dan prediksi

**After:**

- **Actual Stock Out Bar:** Menggunakan `actualStockOut` field
  - Hanya menampilkan bar untuk data aktual
  - Kosong/tidak ada bar untuk data prediksi
- **Predicted Stock Out Line:** Tetap menggunakan `predictedStockOut` sebagai garis putus-putus

### 3. Tooltip Enhancement

**Before:**

- Menampilkan single "Out" value

**After:**

- **Actual Out:** Ditampilkan hanya jika ada data aktual
- **Predicted Out:** Selalu ditampilkan untuk semua hari
- Warna dan labeling yang jelas untuk membedakan

## Data Structure Alignment

Charts sekarang menggunakan struktur data yang sama dengan tabel:

```typescript
{
  actualStockOut: number | null,  // Hanya untuk data aktual
  predictedStockOut: number,      // Untuk semua hari (prediksi)
  stockOut: number,               // Masih digunakan untuk kalkulasi internal
  // ... fields lainnya
}
```

## Visual Improvements

1. **Konsistensi Data:** Charts dan tabel menggunakan sumber data yang sama persis
2. **Visual Distinction:** Data aktual vs prediksi dapat dibedakan dengan jelas
3. **Empty State Handling:** Chart tidak menampilkan bar untuk data yang kosong
4. **Color Coding:**
   - Merah (#ef4444): Data aktual stock out
   - Orange (#f97316): Data prediksi stock out
   - Transparansi untuk membedakan prioritas data

## Result

- Stock Projection Chart menampilkan perbedaan yang jelas antara data aktual dan prediksi
- Daily Stock Flow hanya menampilkan actual stock out untuk data yang benar-benar ada
- Konsistensi penuh antara chart dan tabel
- User experience yang lebih intuitif dalam membaca data
