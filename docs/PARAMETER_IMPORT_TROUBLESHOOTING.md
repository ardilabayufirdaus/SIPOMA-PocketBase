# Troubleshooting Import Parameter Settings

## Masalah yang Sering Terjadi

### 1. Data Tidak Tersimpan Setelah Import

**Kemungkinan Penyebab:**

- Format file Excel tidak sesuai
- Nama sheet tidak tepat
- Nama kolom tidak recognized
- Data type tidak valid
- Connection database bermasalah

**Solusi:**

#### A. Pastikan Format File Excel Benar

- File harus berformat `.xlsx` atau `.xls`
- Sheet harus bernama **"Parameter Settings"** (case-sensitive)
- Minimal harus ada kolom: `parameter`, `data_type`, `unit`, `category`

#### B. Format Kolom yang Benar

```
| parameter | data_type | unit | category | min_value | max_value |
|-----------|-----------|------|----------|-----------|-----------|
| Temperature | Number | °C | Production | 0 | 100 |
| Pressure | Number | bar | Production | 0 | 50 |
| Quality | Text | - | Quality Control | | |
```

#### C. Variasi Nama Kolom yang Diterima

System akan mencoba mengenali variasi nama kolom:

- **parameter**: `parameter`, `Parameter`, `PARAMETER`
- **data_type**: `data_type`, `Data_Type`, `DATA_TYPE`, `type`
- **unit**: `unit`, `Unit`, `UNIT`
- **category**: `category`, `Category`, `CATEGORY`

#### D. Data Type yang Valid

- **Number**: `Number`, `number`, `numeric`, `num`
- **Text**: `Text`, `text`, `string`, `str`

### 2. Debug Steps

#### Step 1: Buka Browser Console

1. Tekan F12 di browser
2. Pilih tab "Console"
3. Lakukan import
4. Perhatikan log messages

#### Step 2: Periksa Log Messages

Cari log seperti:

```
Found Parameter Settings sheet
Sheet headers detected: ["parameter", "data_type", "unit", "category"]
Processing row 1: {...}
Valid parameter settings after processing: [...]
Attempting to import X parameter settings...
```

#### Step 3: Periksa Error Messages

Jika ada error, perhatikan:

- Error di database insert
- Error validasi data
- Error parsing Excel

### 3. Fixes yang Telah Diterapkan

#### A. Improved Database Operations

- Better delete operation menggunakan proper ID selection
- Enhanced error handling dengan try-catch
- Proper transaction handling

#### B. Enhanced Data Validation

- Case-insensitive column detection
- Data type normalization
- Whitespace trimming
- Empty value filtering

#### C. Better Debugging

- Comprehensive console logging
- Step-by-step processing logs
- Error details dalam alert messages

### 4. Testing Your Import

#### Test File Format:

Buat file Excel dengan struktur berikut:

**Sheet Name: "Parameter Settings"**

| parameter   | data_type | unit | category        |
| ----------- | --------- | ---- | --------------- |
| Temperature | Number    | °C   | Production      |
| Pressure    | Number    | bar  | Production      |
| Flow Rate   | Number    | m³/h | Production      |
| pH Level    | Number    | -    | Quality Control |
| Status      | Text      | -    | Control Room    |

#### Expected Console Output:

```
Found Parameter Settings sheet
Sheet headers detected: ["parameter", "data_type", "unit", "category"]
Processing row 1: {original: {...}, processed: {...}, isValid: true}
Processing row 2: {original: {...}, processed: {...}, isValid: true}
...
Valid parameter settings after processing: [5 items]
Attempting to import 5 parameter settings...
Import completed successfully: {totalSections: 1, parameterCount: 5}
```

### 5. Common Issues and Solutions

#### Issue: "No valid data found"

**Solution:**

- Check sheet name is exactly "Parameter Settings"
- Verify required columns exist
- Ensure data rows have values

#### Issue: "Data not appearing in UI"

**Solution:**

- Refresh the page
- Check filter settings
- Verify plant units are imported first

#### Issue: "Database error"

**Solution:**

- Check network connection
- Verify Supabase connection
- Check browser console for specific errors

### 6. Best Practices

1. **Import Order**: Always import Plant Units first, then Parameter Settings
2. **Data Validation**: Verify data in Excel before import
3. **Backup**: Export existing data before importing new data
4. **Testing**: Test with small dataset first
5. **Monitoring**: Watch console logs during import

### 7. Contact Information

Jika masalah masih berlanjut:

1. Check browser console logs
2. Export current data untuk backup
3. Try dengan file Excel yang lebih simple
4. Hubungi developer dengan screenshot error logs
