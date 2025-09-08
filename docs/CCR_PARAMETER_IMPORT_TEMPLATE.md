# CCR Parameter Data Import Template

## Format Excel untuk Import CCR Parameter Data

### Struktur File Excel

File Excel untuk import harus mengikuti format berikut:

#### Sheet Structure:

```
Row 1: Date:      | 2024-01-15 | 2024-01-15 | 2024-01-15
Row 2: Category:  | Plant A    | Plant A    | Plant A
Row 3: Unit:      | Unit 1     | Unit 1     | Unit 1
Row 4: (empty)    |            |            |
Row 5: Hour       | Temp (°C)  | Pressure   | Flow Rate
Row 6: 1          | 85,5       | 150,0      | 120,3
Row 7: 2          | 86,2       | 152,1      | 121,8
...               | ...        | ...        | ...
Row 29: 24        | 84,8       | 149,5      | 119,7
```

### Penting untuk Diperhatikan:

1. **Header Row**: Row yang memiliki kolom "Hour" di kolom pertama akan dideteksi sebagai header
2. **Parameter Names**: Nama parameter harus sesuai dengan Parameter Settings di Master Data
3. **Unit Specification**: Optional - bisa ditambahkan dalam kurung, contoh: "Temperature (°C)"
4. **Hour Range**: Data hanya untuk jam 1-24
5. **Number Format**: Support format regional (10.000,5 atau 10000.5)

### Contoh Data:

| Hour | Temperature (°C) | Pressure (bar) | Flow Rate (m³/h) |
| ---- | ---------------- | -------------- | ---------------- |
| 1    | 85,5             | 150,0          | 120,3            |
| 2    | 86,2             | 152,1          | 121,8            |
| 3    | 87,0             | 153,5          | 123,2            |
| ...  | ...              | ...            | ...              |
| 24   | 84,8             | 149,5          | 119,7            |

### Tips Import:

- Pastikan plant category dan unit sudah dipilih sebelum import
- File harus dalam format .xlsx atau .xls
- Kolom parameter yang tidak ada di Parameter Settings akan diabaikan
- Values kosong akan diabaikan (tidak mengubah data existing)
- Import akan update data existing untuk jam yang sama

### Error Handling:

- File invalid: Error message akan ditampilkan
- Format jam salah: Row akan di-skip
- Parameter tidak ditemukan: Column akan diabaikan
- Network error: Alert dengan detail error

Untuk contoh file template, export data existing terlebih dahulu untuk melihat format yang tepat.
