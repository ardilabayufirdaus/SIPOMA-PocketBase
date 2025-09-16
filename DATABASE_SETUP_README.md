# Database Setup SIPOMA v2

## File SQL yang Dibuat

1. `database_schema.sql` - Skema database lengkap dengan semua tabel
2. `create_default_admin.sql` - Setup user admin default
3. `supabase_types_setup.sql` - Instruksi generate TypeScript types

## Setup Database

### 1. Jalankan Schema

```sql
-- Jalankan file database_schema.sql di Supabase SQL Editor
```

### 2. Setup Admin User

```sql
-- Jalankan file create_default_admin.sql untuk membuat admin default
-- Username: admin
-- Password: admin123 (hash sudah di-generate)
```

### 3. Generate TypeScript Types

```bash
# Generate types dari Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts

# Atau untuk local development
npx supabase gen types typescript --local > types/supabase.ts
```

### 4. Konfigurasi Supabase Client

Update `utils/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

## Tabel Database

- `users` - Manajemen user dan authentication
- `permissions` - Definisi permission matrix
- `user_permissions` - Junction table user-permission
- `user_requests` - Request management
- `user_activity_logs` - Audit trail aktivitas user
- `alerts` - Sistem notifikasi
- `plant_units` - Master data unit pabrik
- `parameter_settings` - Konfigurasi parameter CCR
- `machines` - Data mesin pabrik
- `kpis` - Key Performance Indicators
- `production_data` - Data produksi harian
- `ccr_parameter_data` - Data entry parameter CCR
- `ccr_downtime_data` - Data downtime CCR
- `global_parameter_settings` - Setting parameter global
- `packing_plant_stock` - Data stock packing plant
- `cop_parameters` - Parameter COP monitoring

## Environment Variables

Tambahkan ke `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

Jika ada error TypeScript terkait Supabase types:

1. Pastikan types/supabase.ts sudah di-generate
2. Import Database type di supabase client
3. Restart TypeScript language server
