# PACKING PLANT STOCK - COMPOSITE PRIMARY KEY CONFLICT FIX

## Masalah Yang Terjadi

### Error: 409 Conflict - Duplicate Key Violation

```
PATCH https://ectjrbguwmlkqfyeyfvo.supabase.co/rest/v1/packing_plant_stock?id=eq.23a774b3-7057-4538-92d9-d7b0a2d206df 409 (Conflict)

Error updating stock record: {
  code: '23505',
  details: 'Key (id, record_id)=(23a774b3-7057-4538-92d9-d7b0a2d206df-2025-09-01) already exists.',
  hint: null,
  message: 'duplicate key value violates unique constraint "packing_plant_stock_pkey"'
}
```

### Analisis Masalah

1. **Composite Primary Key**: Tabel `packing_plant_stock` memiliki composite primary key `(id, record_id)`
2. **Update Constraint Violation**: Saat melakukan UPDATE, sistem mencoba mengubah `record_id` yang merupakan bagian dari primary key
3. **Wrong Update Logic**: Logic update mengirimkan seluruh payload termasuk field yang tidak boleh diubah

## Solusi Yang Diterapkan

### 1. Update Payload Separation

**Sebelum**:

```typescript
// Mengirim seluruh payload termasuk id dan record_id
const { error: updateError } = await supabase
  .from("packing_plant_stock")
  .update(payload) // payload berisi id dan record_id
  .eq("date", record.date)
  .eq("area", record.area);
```

**Sesudah**:

```typescript
// Hanya mengirim field yang boleh diupdate
const updatePayload = {
  date: record.date,
  area: record.area,
  stock_out: record.stock_out,
  closing_stock: record.closing_stock,
  opening_stock: record.opening_stock || 0,
  stock_received: record.stock_received || 0,
};

const { error: updateError } = await supabase
  .from("packing_plant_stock")
  .update(updatePayload) // Tidak termasuk id dan record_id
  .eq("date", record.date)
  .eq("area", record.area);
```

### 2. Improved Error Handling

- **maybeSingle()**: Menggunakan `maybeSingle()` sebagai pengganti `single()` untuk menghindari error pada data kosong
- **Better Logging**: Menambahkan log yang lebih detil untuk tracking success/failure
- **Defensive Programming**: Memisahkan update dan insert payload dengan jelas

### 3. Database-Safe Operations

- **Update Operations**: Hanya mengupdate field yang mutable (non-primary key)
- **Insert Operations**: Tetap mengirimkan semua field yang diperlukan termasuk id dan record_id
- **Constraint Respect**: Menghormati constraint database tanpa mencoba mengubah primary key

## Technical Details

### Database Schema Understanding

```sql
-- Composite primary key constraint
PRIMARY KEY (id, record_id)

-- Fields yang boleh diupdate:
- date, area, stock_out, closing_stock, opening_stock, stock_received

-- Fields yang TIDAK boleh diupdate (primary key components):
- id, record_id
```

### Updated Function Flow

1. **Check Existence**: Query dengan `date` dan `area` untuk mencari record yang ada
2. **Conditional Operation**:
   - **Jika ada**: UPDATE dengan payload yang aman (tanpa primary key fields)
   - **Jika tidak ada**: INSERT dengan payload lengkap
3. **Error Handling**: Proper error logging dan recovery

## Testing

### Scenario yang Ditest

✅ **Import file Excel dengan data baru** → INSERT operation
✅ **Import file Excel dengan data existing** → UPDATE operation  
✅ **Update manual di UI** → UPDATE operation
✅ **Multiple import dari file yang sama** → Tidak ada duplicate key error

### Hasil Testing

- ❌ **Sebelum**: 409 Conflict error pada setiap attempt update
- ✅ **Sesudah**: Update dan insert bekerja normal tanpa constraint violation

## Kesimpulan

### ✅ Masalah Diperbaiki

1. **Composite primary key constraint violation** → Solved
2. **409 Conflict error saat update** → Solved
3. **Import Excel replace functionality** → Working properly
4. **Manual update di UI** → Working properly

### 🔧 Implementasi

- **Payload separation**: Update vs Insert payload yang berbeda
- **Safe database operations**: Menghormati constraint database
- **Better error handling**: Improved logging dan error recovery
- **Business logic intact**: Functionality tetap sama, hanya implementasi yang diperbaiki

### 📈 Benefits

- **Zero downtime**: Fix dapat diterapkan tanpa restart
- **Data integrity**: Tidak ada data corruption risk
- **Performance**: Tidak ada performance impact
- **Maintainability**: Code lebih clean dan mudah dipahami

Import Excel dan manual update sekarang berfungsi dengan sempurna tanpa constraint violation errors.
