# Table Display Enhancement: Empty Values for Non-Actual Data

## 📋 Enhancement Summary

Perbaikan pada tabel "This Month Projection Detail" di halaman **Stock Forecast** untuk menampilkan nilai kosong pada kolom **Stock Out (Ton)** dan **Closing Stock (Ton)** jika belum ada data aktualnya.

## 🎯 Problem Statement

Sebelumnya, tabel menampilkan predicted values untuk semua baris termasuk yang belum memiliki data aktual. Ini membingungkan karena user tidak dapat membedakan antara data actual vs predicted pada kolom-kolom tersebut.

## ✅ Solution Implemented

### **Before:**

```tsx
// Stock Out Column - Always showed values
<div className="flex items-center gap-1">
  {formatNumber(item.stockOut)}
  {item.isActual && (
    <span className="text-xs text-green-600">●</span>
  )}
</div>

// Closing Stock Column - Always showed values
<div className="flex items-center gap-1">
  {formatNumber(item.closingStock)}
  {item.isActual && (
    <span className="text-xs text-green-600">●</span>
  )}
</div>
```

### **After:**

```tsx
// Stock Out Column - Conditional display
{
  item.isActual ? (
    <div className="flex items-center gap-1">
      {formatNumber(item.stockOut)}
      <span className="text-xs text-green-600">●</span>
    </div>
  ) : (
    <span className="text-slate-400">-</span>
  );
}

// Closing Stock Column - Conditional display
{
  item.isActual ? (
    <div className="flex items-center gap-1">
      {formatNumber(item.closingStock)}
      <span className="text-xs text-green-600">●</span>
    </div>
  ) : (
    <span className="text-slate-400">-</span>
  );
}
```

## 🔧 Changes Made

### 1. **Stock Out (Ton) Column**

- **Actual Data**: Menampilkan nilai dengan indikator hijau (●)
- **Predicted Data**: Menampilkan "-" dengan warna abu-abu

### 2. **Closing Stock (Ton) Column**

- **Actual Data**: Menampilkan nilai dengan indikator hijau (●)
- **Predicted Data**: Menampilkan "-" dengan warna abu-abu

### 3. **Visual Improvements**

- Added conditional styling untuk better differentiation
- Actual data: highlighted background
- Predicted data: subtle gray text

## 📊 Impact

### **User Experience:**

- ✅ Clear distinction between actual vs predicted data
- ✅ No confusion about data reliability
- ✅ Better visual hierarchy in the table
- ✅ Consistent with other conditional columns (Deviation, Achievement %)

### **Data Integrity:**

- ✅ Only shows actual values when data is confirmed
- ✅ Prevents misinterpretation of predicted data as actual
- ✅ Maintains accuracy in reporting

### **Business Benefits:**

- ✅ More accurate decision making
- ✅ Better transparency in data sources
- ✅ Reduced risk of using unreliable data

## 🎨 Visual Indicators

| Data Type     | Stock Out Display | Closing Stock Display | Indicator     |
| ------------- | ----------------- | --------------------- | ------------- |
| **Actual**    | `{value} ●`       | `{value} ●`           | Green dot (●) |
| **Predicted** | `-`               | `-`                   | Gray dash (-) |

## 🧪 Testing Guidelines

### **Test Cases:**

1. **Mixed Data**: Verify rows with actual data show values + indicator
2. **Future Dates**: Verify future dates show "-" for both columns
3. **Visual Styling**: Confirm actual data has highlighted background
4. **Responsiveness**: Check table behavior on different screen sizes

### **Expected Behavior:**

- Past dates with data entry: Show actual values with green dot
- Future dates: Show dash (-) for Stock Out and Closing Stock
- Other columns remain unaffected
- Table statistics calculations remain accurate

## 📝 Technical Notes

- Changes made in: `pages/packing_plant/PackingPlantStockForecast.tsx`
- Affected columns: Stock Out (Ton), Closing Stock (Ton)
- Conditional rendering based on `item.isActual` property
- No impact on data calculation or backend logic
- Backward compatible change

## 🚀 Deployment Status

- ✅ **Implementation**: Complete
- ✅ **Testing**: Ready for validation
- ✅ **Compilation**: No errors
- ✅ **Hot Reload**: Working properly

---

**Enhancement completed on**: September 8, 2025  
**Developer**: GitHub Copilot  
**Status**: ✅ READY FOR TESTING
