# 🔧 FIX: Kolom Permissions Tabel Users Rusak

## 🚨 **MASALAH YANG TERIDENTIFIKASI**

Kolom `permissions` di tabel `users` menyimpan data yang rusak dalam format string yang ter-escaped berulang kali:

```json
{
  "permissions": "{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"0\",\"3\":\"\\\"\",\"4\":\":\",\"5\":\"\\\"\",\"6\":\"{\",..."
}
```

**Masalah:**

- Data permissions disimpan sebagai string ter-escaped, bukan JSON yang proper
- Data tidak bisa di-parse sebagai JSON
- Aplikasi tidak bisa membaca permissions dengan benar
- User management system tidak berfungsi dengan baik

## 🔍 **ANALISIS ROOT CAUSE**

### **Penyebab Masalah:**

1. **Double/Triple Escaping**: JSON di-escape berulang kali saat disimpan
2. **Struktur Tabel Salah**: Kolom permissions di tabel users seharusnya tidak ada
3. **Missing User Permissions Table**: Data permissions seharusnya di tabel terpisah
4. **View Tidak Proper**: View user_list tidak menggunakan struktur yang benar

### **Dampak:**

- ✅ User login berhasil tapi permissions tidak terbaca
- ❌ Role-based access control tidak berfungsi
- ❌ User management interface error
- ❌ Dashboard permissions tidak ter-filter dengan benar

## ✅ **SOLUSI YANG DISIAPKAN**

### **Step 1: Struktur Database yang Benar**

**Tabel Users (tanpa kolom permissions):**

```sql
users: id, username, email, full_name, role, avatar_url, last_active, is_active, created_at, updated_at
```

**Tabel User Permissions (terpisah):**

```sql
user_permissions:
- user_id (FK ke users.id)
- dashboard (none/read/write/admin)
- user_management (none/read/write/admin)
- plant_operations (JSONB untuk permissions detail)
- packing_plant (none/read/write/admin)
- project_management (none/read/write/admin)
- system_settings (none/read/write/admin)
```

**View user_list (gabungan yang proper):**

```sql
SELECT users.*, jsonb_build_object(...) as permissions
FROM users LEFT JOIN user_permissions
```

### **Step 2: Default Permissions by Role**

**Super Admin:**

- Dashboard: admin
- User Management: admin
- Plant Operations: admin untuk semua area
- Packing Plant: admin
- Project Management: admin
- System Settings: admin

**Admin:**

- Dashboard: admin
- User Management: write
- Plant Operations: write untuk area utama
- Packing Plant: write
- Project Management: write
- System Settings: write

**Manager:**

- Dashboard: write
- User Management: read
- Plant Operations: write untuk area tertentu
- Packing Plant: write
- Project Management: read
- System Settings: read

**Supervisor:**

- Dashboard: write
- User Management: none
- Plant Operations: read untuk area terbatas
- Packing Plant: read
- Project Management: none
- System Settings: none

**Operator:**

- Dashboard: read
- User Management: none
- Plant Operations: read untuk area minimal
- Packing Plant: read
- Project Management: none
- System Settings: none

**Viewer:**

- Dashboard: read
- User Management: none
- Plant Operations: {} (kosong)
- Packing Plant: none
- Project Management: none
- System Settings: none

## 🔧 **LANGKAH IMPLEMENTASI**

### **Step 1: Backup Data Terlebih Dahulu**

```sql
-- Backup existing users data
CREATE TABLE users_backup AS SELECT * FROM users;
```

### **Step 2: Jalankan Script Fix**

1. **Buka Supabase Dashboard** → SQL Editor
2. **Copy seluruh script** dari `sql/fix_permissions_column.sql`
3. **Paste dan Execute** script tersebut
4. **Tunggu hingga selesai** (akan muncul NOTICE messages)

### **Step 3: Verifikasi Hasil**

```sql
-- Check struktur tabel setelah fix
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public';

-- Check apakah user_permissions table sudah ada
SELECT COUNT(*) FROM user_permissions;

-- Check view user_list
SELECT id, username, role, permissions
FROM user_list
LIMIT 3;
```

### **Step 4: Test di Aplikasi**

```bash
# Restart development server
npm run dev

# Test login dan check permissions
# Permissions sekarang harus berupa JSON yang proper
```

## 🧪 **TESTING CHECKLIST**

### **Database Verification:**

- [ ] Kolom permissions di tabel users sudah di-drop
- [ ] Tabel user_permissions sudah dibuat dengan struktur benar
- [ ] View user_list mengembalikan JSON permissions yang proper
- [ ] Semua user existing sudah punya permissions di tabel user_permissions

### **Application Testing:**

- [ ] User login berhasil tanpa error
- [ ] Permissions terbaca sebagai JSON object yang valid
- [ ] Role-based access control berfungsi
- [ ] User management interface menampilkan permissions dengan benar
- [ ] Dashboard filter berdasarkan permissions user

### **JSON Structure Verification:**

```javascript
// Permissions sekarang harus seperti ini:
{
  "permissions": {
    "dashboard": "admin",
    "user_management": "admin",
    "plant_operations": {
      "Production": {
        "Raw Material Preparation": "admin",
        "Mixing": "admin",
        "Extrusion": "admin"
      },
      "Quality Control": {
        "Lab Testing": "admin",
        "Process Control": "admin"
      }
    },
    "packing_plant": "admin",
    "project_management": "admin",
    "system_settings": "admin"
  }
}

// BUKAN seperti ini:
{
  "permissions": "{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"0\"...}"
}
```

## 🎯 **HASIL YANG DIHARAPKAN**

### **Before Fix:**

```json
"permissions": "{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"0\",\"3\":\":\",..."
```

### **After Fix:**

```json
"permissions": {
  "dashboard": "admin",
  "user_management": "admin",
  "plant_operations": {...},
  "packing_plant": "admin",
  "project_management": "admin",
  "system_settings": "admin"
}
```

## 🔄 **RECOVERY JIKA ADA MASALAH**

```sql
-- Jika ada error, restore dari backup
DROP TABLE IF EXISTS users;
CREATE TABLE users AS SELECT * FROM users_backup;

-- Atau drop user_permissions untuk reset
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP VIEW IF EXISTS user_list;

-- Lalu jalankan ulang fix script
```

## 📋 **SUMMARY PERUBAHAN**

1. ✅ **Dropped** kolom permissions yang rusak dari tabel users
2. ✅ **Created** tabel user_permissions dengan struktur yang benar
3. ✅ **Created** view user_list yang mengembalikan JSON permissions proper
4. ✅ **Set** default permissions untuk semua user berdasarkan role
5. ✅ **Applied** RLS policies untuk security
6. ✅ **Added** indexes untuk performance

**Status:** 🔧 **READY TO EXECUTE**
**File:** `sql/fix_permissions_column.sql`
**Action:** Copy script ke Supabase SQL Editor dan jalankan
