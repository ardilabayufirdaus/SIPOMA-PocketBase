# Integrasi Data Footer CCR dengan Supabase

## Overview

Fitur ini mengintegrasikan data footer (total, rata-rata, min, max, dan data shift) dari halaman CCR Parameter Data Entry dengan database Supabase secara otomatis.

## Authentication & Security Notes

- **No Supabase Authentication**: Fitur ini TIDAK menggunakan Supabase Auth
- **Internal User System**: Menggunakan sistem authentication internal melalui tabel `users`
- **RLS Disabled**: Row Level Security dinonaktifkan untuk akses langsung ke database
- **Session Management**: Menggunakan localStorage untuk session management user

## Struktur Database

### Tabel Baru: `ccr_footer_data`

```sql
CREATE TABLE ccr_footer_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    parameter_id UUID NOT NULL,
    plant_unit VARCHAR(100),
    total NUMERIC,
    average NUMERIC,
    minimum NUMERIC,
    maximum NUMERIC,
    shift1_total NUMERIC DEFAULT 0,
    shift2_total NUMERIC DEFAULT 0,
    shift3_total NUMERIC DEFAULT 0,
    shift3_cont_total NUMERIC DEFAULT 0,
    shift1_difference NUMERIC DEFAULT 0,
    shift2_difference NUMERIC DEFAULT 0,
    shift3_difference NUMERIC DEFAULT 0,
    shift3_cont_difference NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, parameter_id, plant_unit)
);
```

## File yang Dimodifikasi

### 1. `database_schema.sql`

- Menambahkan definisi tabel `ccr_footer_data`
- Menambahkan indexes untuk performa optimal

### 2. `hooks/useCcrFooterData.ts` (Baru)

- Hook untuk mengelola operasi CRUD data footer
- Fungsi: `saveFooterData`, `getFooterDataForDate`, `deleteFooterData`

### 3. `pages/plant_operations/CcrDataEntryPage.tsx`

- Menambahkan import hook `useCcrFooterData`
- Menambahkan useEffect untuk auto-save data footer
- Implementasi debounced saving (1 detik delay)

### 4. `ccr_footer_data_migration.sql` (Baru)

- Script migrasi untuk membuat tabel di Supabase
- Termasuk RLS policies dan indexes

## Cara Kerja

1. **Perhitungan Footer**: Data footer dihitung menggunakan hook `useFooterCalculations`
2. **Auto-Save**: Ketika data footer berubah, useEffect akan memicu penyimpanan otomatis
3. **Debouncing**: Penyimpanan di-delay 1 detik untuk menghindari spam request
4. **Error Handling**: Error ditangani dengan logging yang proper

## Penggunaan

### Menjalankan Migrasi Database

1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Jalankan script dari `ccr_footer_data_migration.sql`

### Menggunakan Hook

```typescript
import { useCcrFooterData } from '../../hooks/useCcrFooterData';

const { saveFooterData, getFooterDataForDate } = useCcrFooterData();

// Simpan data footer
await saveFooterData({
  date: '2025-09-17',
  parameter_id: 'param-uuid',
  plant_unit: 'CCR',
  total: 100,
  average: 25,
  minimum: 10,
  maximum: 50,
  // ... data shift lainnya
});

// Ambil data footer untuk tanggal tertentu
const footerData = await getFooterDataForDate('2025-09-17');
```

## Keamanan

- **RLS DISABLED**: Row Level Security dinonaktifkan untuk tabel `ccr_footer_data`
- **Authentication Internal**: Menggunakan sistem authentication internal aplikasi melalui tabel `users`
- **Bypass Supabase Auth**: Tidak menggunakan authentication Supabase, hanya menggunakan kredensial dari tabel users internal
- **Direct Database Access**: Operasi database langsung tanpa authentication middleware Supabase
- Data di-validate sebelum disimpan

## Monitoring

- Logging untuk setiap operasi penyimpanan
- Error logging untuk debugging
- Console logs untuk development

## Testing

Build berhasil tanpa error kompilasi. Fitur siap untuk testing di environment development.

## Next Steps

1. Test integrasi di environment development
2. Validasi data tersimpan dengan benar di Supabase
3. Monitor performa dan optimasi jika diperlukan
4. Update dokumentasi API jika ada perubahan
