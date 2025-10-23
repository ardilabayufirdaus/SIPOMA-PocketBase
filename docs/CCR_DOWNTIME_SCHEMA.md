# CCR Downtime Data Schema

## Definisi Skema

Koleksi `ccr_downtime_data` digunakan untuk mencatat data downtime CCR dengan struktur sebagai berikut:

| Field             | Type   | Required | Description                                      |
| ----------------- | ------ | -------- | ------------------------------------------------ |
| date              | date   | ✅       | Tanggal kejadian dalam format YYYY-MM-DD         |
| start_time        | text   | ✅       | Waktu mulai dalam format HH:MM (24 jam)          |
| end_time          | text   | ✅       | Waktu selesai dalam format HH:MM (24 jam)        |
| pic               | text   | ✅       | Person In Charge (penanggung jawab)              |
| problem           | text   | ✅       | Deskripsi masalah/kejadian                       |
| unit              | text   | ✅       | Unit terkait                                     |
| action            | text   | ❌       | Tindakan yang diambil                            |
| corrective_action | text   | ❌       | Tindakan korektif untuk mencegah kejadian serupa |
| status            | select | ❌       | Status: Open/Close                               |
| duration_minutes  | number | ❌       | Durasi downtime dalam menit                      |

## Indeks Optimasi

Untuk optimasi performa, koleksi `ccr_downtime_data` menggunakan beberapa indeks:

1. `idx_ccr_downtime_date` - Indeks pada field `date`
2. `idx_ccr_downtime_unit` - Indeks pada field `unit`
3. `idx_ccr_downtime_date_unit` - Indeks komposit pada `date` dan `unit`
4. `idx_ccr_downtime_pic` - Indeks pada field `pic`
5. `idx_ccr_downtime_status` - Indeks pada field `status`
6. `idx_ccr_downtime_duration_minutes` - Indeks pada field `duration_minutes`
7. `idx_ccr_downtime_date_status` - Indeks komposit pada `date` dan `status`
8. `idx_ccr_downtime_date_created` - Indeks komposit pada `date` dan `created`

## Validasi Format

1. `date` - Format YYYY-MM-DD (contoh: 2025-10-19)
2. `start_time`/`end_time` - Format HH:MM (contoh: 08:30, 14:15)
3. `status` - Nilai yang valid: "Open" atau "Close"

## Penggunaan

Gunakan koleksi ini untuk:

1. Mencatat insiden downtime pada CCR
2. Melacak status penanganan insiden
3. Menganalisis durasi dan frekuensi downtime per unit
4. Membuat laporan historis downtime
