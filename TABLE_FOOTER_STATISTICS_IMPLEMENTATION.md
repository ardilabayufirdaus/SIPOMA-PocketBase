# Table Footer Statistics Implementation - This Month Projection Detail

## Overview

Implementasi footer statistik pada tabel This Month Projection Detail untuk menampilkan nilai Average, Min, Max, dan Total dari semua kolom numerik dalam tabel.

## Fitur Yang Ditambahkan

### 1. Perhitungan Statistik

- **Average**: Nilai rata-rata dari semua data
- **Min**: Nilai minimum dari semua data
- **Max**: Nilai maksimum dari semua data
- **Total**: Jumlah total dari semua data

### 2. Kolom Yang Dihitung

- Opening Stock (Ton)
- Stock Received (Ton)
- Stock Out (Ton)
- Predicted Out (Ton)
- Deviation (Ton)
- Achievement (%)
- Closing Stock (Ton)
- Net Flow (Ton)
- Efficiency (%)

### 3. Visual Design

- **Footer Background**: `bg-slate-100` dengan border atas yang tebal
- **Average Row**: Font semi-bold dengan warna `text-slate-700`
- **Min/Max Rows**: Font medium dengan warna `text-slate-600`
- **Total Row**: Font bold dengan warna `text-slate-800` dan border atas sebagai pemisah

## Technical Implementation

### 1. Statistik Calculator (useMemo)

```typescript
const tableStats = useMemo(() => {
  if (processedChartData.length === 0) {
    return {
      openingStock: { avg: 0, min: 0, max: 0, total: 0 },
      stockReceived: { avg: 0, min: 0, max: 0, total: 0 },
      // ... dst untuk semua kolom
    };
  }

  const calculateStats = (values: number[]) => {
    const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
    if (validValues.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };

    const total = validValues.reduce((sum, val) => sum + val, 0);
    const avg = total / validValues.length;
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    return {
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  };
}, [processedChartData]);
```

### 2. Footer Table Structure

```tsx
<tfoot className="bg-slate-100 border-t-2 border-slate-300">
  {/* Average Row */}
  <tr className="font-semibold text-slate-700">
    <td className="px-4 py-3 text-xs font-bold">Average</td>
    <td className="px-4 py-3 text-xs">{tableStats.openingStock.avg}</td>
    {/* ... kolom lainnya */}
  </tr>

  {/* Min Row */}
  <tr className="font-medium text-slate-600">
    <td className="px-4 py-3 text-xs font-bold">Min</td>
    <td className="px-4 py-3 text-xs">{tableStats.openingStock.min}</td>
    {/* ... kolom lainnya */}
  </tr>

  {/* Max Row */}
  <tr className="font-medium text-slate-600">
    <td className="px-4 py-3 text-xs font-bold">Max</td>
    <td className="px-4 py-3 text-xs">{tableStats.openingStock.max}</td>
    {/* ... kolom lainnya */}
  </tr>

  {/* Total Row */}
  <tr className="font-bold text-slate-800 border-t border-slate-300">
    <td className="px-4 py-3 text-xs font-bold">Total</td>
    <td className="px-4 py-3 text-xs">{tableStats.openingStock.total}</td>
    {/* ... kolom lainnya */}
  </tr>
</tfoot>
```

## Features & Benefits

### 1. Data Analysis

- **Quick Summary**: Pengguna dapat melihat rangkuman statistik langsung dari tabel
- **Performance Overview**: Nilai Min/Max membantu identifikasi outlier
- **Trend Analysis**: Average menunjukkan performa rata-rata periode

### 2. Data Validation

- **Error Handling**: Filter nilai NaN dan infinite
- **Responsive Calculation**: Otomatis update saat data berubah
- **Empty State**: Menampilkan 0 saat tidak ada data

### 3. Visual Clarity

- **Color Coding**: Setiap baris statistik memiliki styling berbeda
- **Typography**: Font weight yang berbeda untuk hierarki informasi
- **Spacing**: Konsisten dengan desain tabel utama

## Special Handling

### 1. Kolom Persentase

- Achievement (%) dan Efficiency (%) ditampilkan dengan simbol %
- Total tidak ditampilkan untuk kolom persentase (ditandai dengan "-")

### 2. Kolom Non-Numerik

- Status dan Type kolom ditandai dengan "-" di footer
- Date kolom menggunakan label statistik sebagai identifikasi

### 3. Data Quality

- Validasi nilai dengan `!isNaN(v) && isFinite(v)`
- Pembulatan ke 2 desimal untuk keterbacaan
- Fallback ke 0 untuk kondisi edge case

## Usage Example

Footer akan menampilkan:

```
Average    150.25   200.50   175.75   180.25   -5.50    102.3%   175.25   25.75    95.8%   -   -
Min        100.00   150.00   120.00   150.00   -20.00   85.0%    120.00   -30.00   80.0%   -   -
Max        250.00   300.00   250.00   220.00   15.00    120.0%   280.00   80.00    110.0%  -   -
Total      4507.50  6015.00  5272.50  5407.50  -165.00  -        5257.50  772.50   -       -   -
```

## Dependencies

- React hooks: `useMemo` untuk optimisasi perhitungan
- TypeScript untuk type safety
- Tailwind CSS untuk styling responsif

## Implementation Status

✅ **COMPLETE** - Footer statistik telah berhasil diimplementasikan dengan:

- Perhitungan Average, Min, Max, Total yang akurat
- Visual design yang konsisten dengan tema aplikasi
- Error handling dan data validation
- Responsive layout dan typography
- Integration dengan sistem filter yang ada

## File Modified

- `pages/packing_plant/PackingPlantStockForecast.tsx`: Penambahan `tableStats` useMemo dan `tfoot` section

## Testing Notes

- Tested dengan data kosong (menampilkan 0)
- Tested dengan data outlier (NaN, Infinity)
- Tested dengan berbagai filter bulan dan area
- Responsive design validated pada berbagai ukuran layar
