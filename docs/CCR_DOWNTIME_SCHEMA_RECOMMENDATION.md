# Rekomendasi Skema CCR Downtime Data

## Struktur Skema Optimal

Berikut adalah rekomendasi struktur skema untuk koleksi `ccr_downtime_data` yang sesuai dengan kebutuhan aplikasi Plant Operations -> CCR Data Entry -> CCR Downtime Data Entry.

### Kolom Utama

| Field             | Type   | Required | Format/Pattern |
| ----------------- | ------ | -------- | -------------- |
| date              | date   | ✓        | YYYY-MM-DD     |
| start_time        | text   | ✓        | HH:MM (24h)    |
| end_time          | text   | ✓        | HH:MM (24h)    |
| pic               | text   | ✓        |                |
| problem           | text   | ✓        |                |
| unit              | text   | ✓        |                |
| action            | text   | ✗        |                |
| corrective_action | text   | ✗        |                |
| status            | select | ✗        | Open, Close    |
| duration_minutes  | number | ✗        |                |

### Validasi & Format

1. **date**: Gunakan tipe data native `date` untuk memastikan validasi dan format yang konsisten
2. **start_time/end_time**: Format waktu HH:MM dengan validasi regex `^([01]\\d|2[0-3]):([0-5]\\d)$`
3. **status**: Gunakan enum yang sesuai dengan `DowntimeStatus` di aplikasi: "Open", "Close"
4. **duration_minutes**: Field tambahan untuk memudahkan pelaporan dan analisis

## Optimasi Indeks

Indeks berikut direkomendasikan untuk mengoptimalkan performa query pada koleksi ini:

```sql
-- Indeks untuk pencarian berdasarkan tanggal (paling sering digunakan)
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date ON ccr_downtime_data (date);

-- Indeks untuk pencarian berdasarkan unit
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_unit ON ccr_downtime_data (unit);

-- Indeks komposit untuk pencarian berdasarkan tanggal dan unit
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date_unit ON ccr_downtime_data (date, unit);

-- Indeks untuk pencarian berdasarkan PIC
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_pic ON ccr_downtime_data (pic);

-- Indeks untuk pencarian berdasarkan status
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_status ON ccr_downtime_data (status);

-- Indeks untuk pencarian berdasarkan durasi
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_duration_minutes ON ccr_downtime_data (duration_minutes);

-- Indeks komposit untuk pencarian berdasarkan tanggal dan status
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date_status ON ccr_downtime_data (date, status);

-- Indeks untuk optimalisasi sorting dan grouping
CREATE INDEX IF NOT EXISTS idx_ccr_downtime_date_created ON ccr_downtime_data (date, created);
```

## Alasan Pemilihan Indeks

1. **idx_ccr_downtime_date**: Sebagian besar query dilakukan berdasarkan tanggal
2. **idx_ccr_downtime_unit**: Filter berdasarkan unit sering digunakan
3. **idx_ccr_downtime_date_unit**: Kombinasi tanggal+unit adalah query yang paling umum
4. **idx_ccr_downtime_pic**: Filter berdasarkan PIC untuk reporting
5. **idx_ccr_downtime_status**: Filter status Open/Close untuk dashboard
6. **idx_ccr_downtime_duration_minutes**: Memungkinkan pencarian dan sorting berdasarkan durasi
7. **idx_ccr_downtime_date_status**: Untuk reporting status downtime per tanggal
8. **idx_ccr_downtime_date_created**: Mendukung sorting berdasarkan tanggal dan waktu pembuatan

## Implementasi

1. Jalankan script migrasi `database/migrations/20251019_ccr_downtime_enhanced_indexes.sql` untuk menambahkan indeks
2. Gunakan script `validate-ccr-downtime-schema.js` untuk memvalidasi dan memperbarui struktur koleksi
3. Jalankan script `calculate-downtime-durations.js` untuk menghitung dan mengisi field `duration_minutes`

## Best Practices Query

```typescript
// Query tanggal tertentu (menggunakan indeks date)
const records = await pb.collection('ccr_downtime_data').getFullList({
  filter: `date = "${normalizedDate}"`,
  sort: '-created',
});

// Query kombinasi tanggal dan unit (menggunakan indeks komposit)
const records = await pb.collection('ccr_downtime_data').getFullList({
  filter: `date = "${normalizedDate}" && unit = "${unitName}"`,
  sort: '-created',
});

// Query berdasarkan status (menggunakan indeks status)
const records = await pb.collection('ccr_downtime_data').getFullList({
  filter: `status = "Open"`,
  sort: 'date',
});

// Query downtime terlama (menggunakan indeks duration_minutes)
const records = await pb.collection('ccr_downtime_data').getFullList({
  sort: '-duration_minutes',
});
```
