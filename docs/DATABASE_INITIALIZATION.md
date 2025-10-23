# Inisialisasi Database PocketBase

## Masalah

Error 404 terjadi karena collections PocketBase belum dibuat di database.

## Solusi

Buat collections berikut di PocketBase Admin Panel (`http://141.11.25.69:8090/_/`):

### 1. cop_parameters

```json
{
  "name": "cop_parameters",
  "type": "base",
  "schema": [
    { "name": "id", "type": "text", "required": true },
    { "name": "parameter_ids", "type": "json", "required": true }
  ]
}
```

**Data awal:**

```json
{
  "id": "default",
  "parameter_ids": []
}
```

### 2. parameter_settings

```json
{
  "name": "parameter_settings",
  "type": "base",
  "schema": [
    { "name": "parameter", "type": "text", "required": true },
    {
      "name": "data_type",
      "type": "select",
      "required": true,
      "options": { "values": ["Number", "Text"] }
    },
    { "name": "unit", "type": "text", "required": true },
    { "name": "category", "type": "text", "required": true },
    { "name": "min_value", "type": "number" },
    { "name": "max_value", "type": "number" },
    { "name": "opc_min_value", "type": "number" },
    { "name": "opc_max_value", "type": "number" },
    { "name": "pcc_min_value", "type": "number" },
    { "name": "pcc_max_value", "type": "number" }
  ]
}
```

### 3. silo_capacities

```json
{
  "name": "silo_capacities",
  "type": "base",
  "schema": [
    { "name": "plant_category", "type": "text", "required": true },
    { "name": "unit", "type": "text", "required": true },
    { "name": "silo_name", "type": "text", "required": true },
    { "name": "capacity", "type": "number", "required": true },
    { "name": "dead_stock", "type": "number", "required": true }
  ]
}
```

### 4. report_settings

```json
{
  "name": "report_settings",
  "type": "base",
  "schema": [
    { "name": "parameter_id", "type": "text", "required": true },
    { "name": "category", "type": "text", "required": true },
    { "name": "order", "type": "number", "required": true }
  ]
}
```

### 5. pic_settings

```json
{
  "name": "pic_settings",
  "type": "base",
  "schema": [{ "name": "pic", "type": "text", "required": true }]
}
```

## Cara Membuat Collection

1. Buka PocketBase Admin Panel
2. Pergi ke "Collections"
3. Klik "New Collection"
4. Pilih "Base Collection"
5. Masukkan nama dan schema sesuai di atas
6. Simpan

## Alternatif: Menggunakan Script

Jika memiliki akses admin, jalankan:

```bash
node scripts/init-pocketbase-collections.cjs
```

Pastikan environment variables:

- POCKETBASE_EMAIL
- POCKETBASE_PASSWORD

## Status

✅ Hooks sudah diperbaiki untuk menangani error 404 dengan graceful degradation
✅ Script inisialisasi sudah dibuat
⚠️ Collections perlu dibuat manual di PocketBase Admin Panel</content>
<parameter name="filePath">d:\Repository Github\sipoma-ver-2\sipoma-versi-2\docs\DATABASE_INITIALIZATION.md
