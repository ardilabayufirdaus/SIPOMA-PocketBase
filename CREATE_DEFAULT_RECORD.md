# SOLUSI CEPAT: Buat Record Default cop_parameters

## Masalah

Hook `useCopParameters` error 404 karena record "qisg1822jn43kcy" tidak ada di collection `cop_parameters`.

## Solusi: Buat Record Manual

### Langkah 1: Buka PocketBase Admin Panel

```
http://141.11.25.69:8090/_/
```

### Langkah 2: Navigasi ke Collection

- Klik menu **"Collections"** di sidebar kiri
- Klik collection **"cop_parameters"**

### Langkah 3: Buat Record Baru

- Klik tombol **"+ New Record"** (pojok kanan atas)

### Langkah 4: Isi Data Record

**Form akan muncul. Isi field berikut:**

**Field Settings:**

- **parameter_ids**: `[]` (biarkan kosong, array kosong)

**Record ID (PENTING!):**

- Di bagian **"ID"** field, isi: `qisg1822jn43kcy`

### Langkah 5: Simpan

- Klik tombol **"Save"** atau **"Create"**

### Langkah 6: Verifikasi

- Record akan muncul di list dengan ID "default"
- Refresh aplikasi, error 404 akan hilang

## Status Setelah Perbaikan

- ✅ Hook akan menemukan record "default"
- ✅ Aplikasi tidak crash
- ✅ Fitur COP parameters berfungsi normal
- ✅ Database tetap PocketBase (bukan Supabase)

## Jika Masih Error

Jika masih ada error setelah membuat record, restart aplikasi browser.</content>
<parameter name="filePath">d:\Repository Github\sipoma-ver-2\sipoma-versi-2\CREATE_DEFAULT_RECORD.md
