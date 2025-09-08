# CCR Import/Export Testing Guide

## Testing Import/Export Functionality

### 1. **Export Test**

1. Buka halaman CCR Parameter Data Entry
2. Pilih Category dan Unit yang memiliki parameter
3. Pilih tanggal (pastikan ada data atau input beberapa data test)
4. Klik tombol "Export to Excel"
5. Verify file yang di-download:
   - Nama file format: `CCR_Parameter_Data_{Category}_{Unit}_{Date}.xlsx`
   - Metadata rows (Date, Category, Unit)
   - Header row dengan nama parameter dan unit
   - Data rows untuk jam 1-24
   - Format angka menggunakan format Indonesia (titik untuk ribuan, koma untuk desimal)

### 2. **Import Test**

1. Gunakan file yang sudah di-export
2. Ubah beberapa nilai dalam file Excel (pastikan format sesuai)
3. Di aplikasi, pilih Category dan Unit yang sama
4. Pilih tanggal yang sama atau berbeda
5. Klik "Import from Excel" dan pilih file
6. Verify:
   - Metadata validation warning jika tanggal/category/unit berbeda
   - Success message dengan jumlah data yang diimport
   - Data ter-update di tabel
   - Data tersimpan di database

### 3. **Format Number Testing**

Test dengan berbagai format angka:

- `1234.5` (format biasa)
- `1.234,5` (format Indonesia)
- `1,234.5` (format US)
- `1.234.567,89` (format Indonesia dengan ribuan)
- `1,234,567.89` (format US dengan ribuan)

### 4. **Edge Cases Testing**

- File Excel kosong
- File dengan header yang salah
- File dengan parameter yang tidak ada
- File dengan jam yang invalid (>24 atau <1)
- File dengan nilai yang tidak bisa di-parse
- Import file dengan category/unit yang berbeda

## Expected Behavior

### Export Features:

✅ **Metadata Inclusion**: Date, Category, Unit di baris pertama  
✅ **Proper Headers**: Parameter names dengan unit dalam kurung  
✅ **Number Formatting**: Format Indonesia (1.234,56)  
✅ **Complete Hours**: Data untuk jam 1-24  
✅ **Sanitized Filename**: Karakter special dihilangkan

### Import Features:

✅ **Metadata Validation**: Warning jika metadata tidak cocok  
✅ **Flexible Number Parsing**: Support format Indonesia dan US  
✅ **Parameter Matching**: Match parameter name (dengan/tanpa unit)  
✅ **Error Handling**: Detail error dan warning messages  
✅ **Data Refresh**: Auto refresh setelah import  
✅ **User Attribution**: Import menggunakan user yang sedang login

### Enhanced Features:

✅ **Detailed Logging**: Console log untuk debugging  
✅ **Processing Summary**: Alert dengan detail import results  
✅ **Validation Warnings**: Notifikasi untuk masalah minor  
✅ **Robust Parsing**: Handle berbagai format angka

## Fixed Issues:

- ✅ Format number parsing yang lebih robust
- ✅ Metadata validation untuk ensure compatibility
- ✅ Better error messages dan logging
- ✅ Direct database update instead of using handleParameterDataChange
- ✅ Current user attribution untuk imported data
- ✅ Data refresh after successful import
