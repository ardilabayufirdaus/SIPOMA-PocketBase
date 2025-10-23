# Inisialisasi Database PocketBase

## Status Terbaru ✅

**Collections sudah ada**, tetapi **record default di cop_parameters belum ada**.

## Masalah

Error 404 terjadi karena record "default" tidak ada di collection `cop_parameters`.

## Solusi Cepat

### 1. Buat Record Default Manual

Buka PocketBase Admin Panel (`http://141.11.25.69:8090/_/`):

1. Pergi ke **Collections** → **cop_parameters**
2. Klik **New Record**
3. Isi field:
   - **id**: `default`
   - **parameter_ids**: `[]` (array kosong)
4. Klik **Save**

### 2. Verifikasi

Jalankan script cek:

```bash
node scripts/init-database.cjs
```

Output yang benar:

```
🔍 Mengecek record default di cop_parameters...
✅ Record default ditemukan: { id: 'default', parameter_ids: [] }
```

## Collections Yang Sudah Ada ✅

- ✅ cop_parameters
- ✅ parameter_settings
- ✅ silo_capacities
- ✅ report_settings
- ✅ pic_settings

## Jika Perlu Buat Collections Manual

Jika collections belum ada, buat di PocketBase Admin Panel dengan schema di atas.

## Testing

Setelah membuat record default, restart aplikasi dan error 404 akan hilang.</content>
<parameter name="filePath">d:\Repository Github\sipoma-ver-2\sipoma-versi-2\docs\DATABASE_INITIALIZATION_UPDATED.md
