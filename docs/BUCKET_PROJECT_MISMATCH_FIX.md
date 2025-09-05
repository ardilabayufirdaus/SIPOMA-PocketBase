# 🚨 BUCKET PROJECT MISMATCH - SOLUSI LENGKAP

## ❌ **MASALAH TERIDENTIFIKASI:**

Bucket `avatars` dibuat di **project Supabase yang BERBEDA** dengan yang digunakan aplikasi.

- **App menggunakan:** `https://ectjrbguwmlkqfyeyfvo.supabase.co`
- **Bucket dibuat di:** Project lain (URL berbeda)

**Bukti:** API call sukses tapi `Total buckets: 0` padahal bucket ada di Dashboard.

---

## ✅ **SOLUSI 1: BUAT BUCKET DI PROJECT YANG BENAR** ⭐ **RECOMMENDED**

### **Step 1: Buka Dashboard yang Benar**

🔗 **Link langsung:** https://supabase.com/dashboard/project/ectjrbguwmlkqfyeyfvo

### **Step 2: Buat Bucket Avatars**

1. **Storage** → **"Create a new bucket"**
2. **Form settings:**
   ```
   Name: avatars
   Public bucket: ✅ (WAJIB dicentang)
   File size limit: 5242880 (5MB)
   Allowed MIME types: image/jpeg,image/png,image/gif,image/webp
   ```
3. **Create bucket**

### **Step 3: Setup Policies**

1. **SQL Editor** → **"New query"**
2. **Copy & paste:**

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

3. **Run script**

### **Step 4: Test Setup**

1. **App** → **Settings** → **"🚀 Run Bucket Debug"**
2. **Hasil expected:** `Total buckets: 1` ✅
3. **Test upload** di ProfileEditModal

---

## ✅ **SOLUSI 2: UPDATE ENV VARIABLE**

Jika ingin pakai bucket yang sudah ada:

### **Step 1: Check URL Bucket Existing**

1. **Buka Dashboard** tempat bucket `avatars` ada
2. **Copy URL** dari browser (format: `https://XXXX.supabase.co`)

### **Step 2: Update .env**

1. **Edit file:** `.env`
2. **Ganti URL:**
   ```env
   VITE_SUPABASE_URL=https://URL_BUCKET_YANG_BENAR.supabase.co
   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=KEY_YANG_SESUAI
   ```

### **Step 3: Restart**

```bash
npm run dev
```

---

## 🎯 **VERIFICATION STEPS:**

Setelah solusi dijalankan:

1. **Debug Test:** `Total buckets: 1` ✅
2. **Bucket Found:** `Avatars bucket found` ✅
3. **Access Test:** `Can access bucket` ✅
4. **Upload Test:** Profile photo upload works ✅

---

## 📋 **FILES UNTUK DIGUNAKAN:**

- ✅ **supabase-policies-only.sql** - SQL policies (SAFE)
- ❌ **supabase-setup.sql** - Contains bucket creation (PERMISSION ERROR)

**Status**: Project mismatch identified, fix dengan buat bucket di project yang benar!
