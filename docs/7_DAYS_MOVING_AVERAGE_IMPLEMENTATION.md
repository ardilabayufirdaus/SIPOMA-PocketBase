# 7 Days Moving Average Implementation for Stock Out Prediction

## Overview

Implementasi kalkulasi prediksi stok keluar menggunakan 7 days moving average pada tabel "This Month Projection Detail" di halaman Packing Plant Stock Forecast.

## Implementation Details

### 1. Helper Function: `calculate7DayMovingAverage`

Fungsi yang menghitung rata-rata bergerak 7 hari untuk prediksi stok keluar dengan prioritas data sebagai berikut:

#### Priority Logic:

1. **Prioritas Utama**: Data aktual stok keluar dari 7 hari terakhir
2. **Prioritas Kedua**: Data prediksi stok keluar yang sudah dihitung sebelumnya
3. **Fallback**: Nilai rata-rata default dari perhitungan sebelumnya

#### Parameters:

- `stockRecords`: Array data stok aktual dari database
- `chartDataSoFar`: Data yang sudah diproses sebelumnya dalam chart
- `currentDate`: Tanggal saat ini yang sedang diproses
- `area`: Area packing plant yang sedang dianalisis
- `fallbackValue`: Nilai default jika tidak ada data yang cukup

#### Algorithm:

```typescript
const calculate7DayMovingAverage = (
  stockRecords: PackingPlantStockRecord[],
  chartDataSoFar: any[],
  currentDate: Date,
  area: string,
  fallbackValue: number = 100
): number => {
  // 1. Ambil data 7 hari ke belakang
  const sevenDaysAgo = new Date(currentDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 2. Filter data aktual dalam 7 hari terakhir
  const recentActualRecords = stockRecords.filter((record) => {
    if (!record.date || record.area !== area) return false;
    const recordDate = new Date(record.date);
    return recordDate >= sevenDaysAgo && recordDate <= currentDate;
  });

  // 3. Prioritas pertama: Data aktual stok keluar
  const actualStockOutData = recentActualRecords
    .map((record) => Number(record.stock_out) || 0)
    .filter((value) => value > 0);

  if (actualStockOutData.length >= 3) {
    return Math.round(sum / actualStockOutData.length);
  }

  // 4. Prioritas kedua: Data prediksi yang sudah dihitung
  const recentChartData = chartDataSoFar
    .filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate >= sevenDaysAgo &&
        itemDate < currentDate &&
        item.predictedStockOut
      );
    })
    .slice(-7);

  if (recentChartData.length >= 3) {
    return Math.round(sum / recentChartData.length);
  }

  // 5. Fallback ke nilai default
  return fallbackValue;
};
```

### 2. Integration in Chart Data Calculation

Fungsi 7 days moving average diintegrasikan dalam perhitungan `predictedStockOut` di dalam loop `chartData`:

```typescript
// Gunakan 7 days moving average untuk prediksi stok keluar
const predictedStockOut = calculate7DayMovingAverage(
  stockRecords,
  monthData, // Data yang sudah diproses sebelumnya
  currentDate,
  filterArea,
  avgStockOut
);
```

### 3. Benefits of This Implementation

#### Accuracy Improvements:

1. **Data Prioritization**: Menggunakan data aktual sebagai prioritas utama
2. **Adaptive Calculation**: Menyesuaikan dengan ketersediaan data
3. **Smooth Predictions**: Moving average memberikan prediksi yang lebih stabil
4. **Historical Context**: Mempertimbangkan tren 7 hari terakhir

#### Fallback Mechanism:

- Minimal 3 hari data untuk perhitungan yang valid
- Fallback ke data prediksi sebelumnya jika data aktual tidak cukup
- Fallback ke rata-rata historis jika semua data tidak mencukupi

### 4. Technical Implementation

#### Modified Files:

- `pages/packing_plant/PackingPlantStockForecast.tsx`

#### Key Changes:

1. Added `calculate7DayMovingAverage` helper function
2. Modified `predictedStockOut` calculation logic
3. Integrated with existing chart data processing

#### Data Flow:

```
Stock Records (Database) → 7 Days Filter → Actual Data Priority →
Moving Average Calculation → Predicted Stock Out Value →
Chart Data Display
```

### 5. Testing and Validation

#### Test Scenarios:

1. **Sufficient Actual Data**: When 3+ days of actual stock out data available
2. **Insufficient Actual Data**: When less than 3 days of actual data available
3. **No Historical Data**: When no historical data available (uses fallback)
4. **Mixed Data Scenarios**: Combination of actual and predicted data

#### Expected Behavior:

- More stable and accurate predictions
- Better adaptation to recent trends
- Smooth handling of data gaps
- Improved forecast reliability

### 6. Future Enhancements

#### Potential Improvements:

1. **Weighted Moving Average**: Give more weight to recent data
2. **Seasonal Adjustments**: Account for seasonal patterns
3. **Trend Analysis**: Incorporate trend direction in predictions
4. **Confidence Intervals**: Provide prediction confidence levels

#### Configuration Options:

- Adjustable window size (currently fixed at 7 days)
- Minimum data points threshold (currently 3 days)
- Fallback strategy customization

## Conclusion

Implementasi 7 days moving average untuk prediksi stok keluar memberikan:

- **Akurasi yang lebih baik** dengan memprioritaskan data aktual
- **Stabilitas prediksi** melalui rata-rata bergerak
- **Fleksibilitas** dengan mekanisme fallback yang robust
- **Integrasi yang seamless** dengan sistem yang sudah ada

Implementasi ini meningkatkan kualitas prediksi stok keluar di tabel "This Month Projection Detail" dengan tetap mempertahankan kompatibilitas dengan sistem existing.
