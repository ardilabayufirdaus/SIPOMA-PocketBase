# 🚨 SOLUSI ERROR 42501: must be owner of table objects

## ❌ **Error yang Terjadi:**

```
ERROR: 42501: must be owner of table objects
```

## 🔍 **Penyebab:**

User SQL Editor tidak memiliki permission untuk mengubah table `storage.objects`. Ini normal di Supabase karena table storage dikelola secara khusus.

## ✅ **SOLUSI BENAR:**

### STEP 1: Buat Bucket Manual (WAJIB)

1. **Buka Supabase Dashboard**
2. **Storage** → **"Create a new bucket"**
3. **Isi form:**
   ```
   Name: avatars
   Public bucket: ✅ (HARUS dicentang)
   File size limit: 5242880
   Allowed MIME types: image/jpeg,image/png,image/gif,image/webp
   ```
4. **Create bucket**

### STEP 2: Setup Policies (Via SQL)

1. **SQL Editor** → **"New query"**
2. **Gunakan script:** `supabase-policies-only.sql`
3. **ATAU copy-paste:**

```sql
-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '_', 1)
);

CREATE POLICY "Avatars are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '_', 1)
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '_', 1)
);
```

4. **Run script**

### STEP 3: Verifikasi Setup

1. **Check bucket exists:** Storage → lihat bucket 'avatars'
2. **Check policies:** SQL Editor → `SELECT * FROM pg_policies WHERE tablename = 'objects';`
3. **Test di app:** Settings → Avatar Storage Test

## 🔧 **Alternative Method (Jika SQL masih error):**

### Via Supabase Dashboard Policy Editor:

1. **Storage** → **Policies** → **"New policy"**
2. **Buat 4 policies manual:**

**Policy 1 - Upload:**

```
Policy name: Users can upload their own avatar
Operation: INSERT
Target roles: authenticated
Check expression: bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '_', 1)
```

**Policy 2 - Read:**

```
Policy name: Avatars are publicly accessible
Operation: SELECT
Target roles: public
Check expression: bucket_id = 'avatars'
```

**Policy 3 - Update:**

```
Policy name: Users can update their own avatar
Operation: UPDATE
Target roles: authenticated
Check expression: bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '_', 1)
```

**Policy 4 - Delete:**

```
Policy name: Users can delete their own avatar
Operation: DELETE
Target roles: authenticated
Check expression: bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '_', 1)
```

## ✅ **Hasil yang Diharapkan:**

Setelah setup benar:

- ✅ **No permission errors**
- ✅ **Storage test SUCCESS**
- ✅ **Users bisa upload foto profil**

## 📋 **File yang Benar untuk Digunakan:**

- ✅ `supabase-policies-only.sql` - Hanya policies (SAFE)
- ❌ `supabase-setup.sql` - Contains bucket creation (PERMISSION ERROR)

**Status**: Setup manual via Dashboard adalah cara paling aman dan reliable!
