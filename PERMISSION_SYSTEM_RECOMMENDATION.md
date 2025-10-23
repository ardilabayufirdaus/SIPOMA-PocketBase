# Rekomendasi Sistem Permission Per Role

## 🎯 **Masalah Saat Ini**

- Permission format tidak konsisten (string vs object)
- Sulit mengelola permission granular per plant/unit
- User experience tidak konsisten

## ✅ **Rekomendasi Sistem Permission Terbaik**

### **1. Format Permission yang Konsisten**

```typescript
// Format yang DIREKOMENDASIKAN untuk semua permissions:
interface PermissionMatrix {
  dashboard: 'NONE' | 'READ' | 'WRITE' | 'ADMIN';
  plant_operations: 'NONE' | 'READ' | 'WRITE' | 'ADMIN'; // Simplified
  inspection: 'NONE' | 'READ' | 'WRITE' | 'ADMIN';
  project_management: 'NONE' | 'READ' | 'WRITE' | 'ADMIN';
}

// Atau untuk granular control (opsional):
interface GranularPermissionMatrix {
  dashboard: 'NONE' | 'READ' | 'WRITE' | 'ADMIN';
  plant_operations: {
    [plantName: string]: {
      [unitName: string]: 'NONE' | 'READ' | 'WRITE' | 'ADMIN';
    };
  };
  // ... other modules
}
```

### **2. Default Permissions Per Role**

```typescript
const DEFAULT_ROLE_PERMISSIONS = {
  'Super Admin': {
    dashboard: 'ADMIN',
    plant_operations: 'ADMIN',
    inspection: 'ADMIN',
    project_management: 'ADMIN',
  },
  Admin: {
    dashboard: 'ADMIN',
    plant_operations: 'WRITE',
    inspection: 'WRITE',
    project_management: 'WRITE',
  },
  Operator: {
    dashboard: 'READ',
    plant_operations: 'READ',
    inspection: 'NONE',
    project_management: 'NONE',
  },
  Guest: {
    dashboard: 'NONE',
    plant_operations: 'NONE',
    inspection: 'NONE',
    project_management: 'NONE',
  },
};
```

### **3. Permission Levels**

```typescript
const PERMISSION_LEVELS = {
  NONE: 0, // No access
  READ: 1, // View only
  WRITE: 2, // View + Create/Edit
  ADMIN: 3, // Full access + Delete + Manage others
};
```

## 🔧 **Implementasi yang Dianjurkan**

### **A. Gunakan Format Sederhana (Recommended)**

```typescript
// Di permission editor, gunakan dropdown sederhana:
- NONE: Tidak ada akses
- READ: Hanya lihat
- WRITE: Lihat + Edit
- ADMIN: Full control
```

### **B. Update Permission Checker**

```typescript
hasPermission(feature: keyof PermissionMatrix, requiredLevel: string): boolean {
  const userLevel = this.user?.permissions?.[feature] || 'NONE';
  return PERMISSION_LEVELS[userLevel] >= PERMISSION_LEVELS[requiredLevel];
}
```

### **C. Sidebar Logic Tetap Sederhana**

```typescript
// Menu tampil berdasarkan permission level
{permissionChecker.hasPermission('plant_operations', 'READ') && (
  <PlantOperationsMenu />
)}
```

## 🎯 **Keuntungan Sistem Ini**

1. **Konsistensi**: Semua permission menggunakan format yang sama
2. **Sederhana**: Mudah dipahami dan dikelola
3. **Scalable**: Bisa dikembangkan ke granular permissions nanti
4. **Performance**: Lebih cepat check permission
5. **UX**: User tahu persis hak aksesnya

## 📋 **Migration Plan**

1. **Update permission format** untuk semua user existing
2. **Update UI permission editor** menggunakan format sederhana
3. **Update permission checker** untuk handle format baru
4. **Test thoroughly** dengan semua role dan scenario

## 💡 **Kesimpulan**

**Gunakan format permission sederhana (string) untuk semua modul**, bukan object kompleks. Ini lebih mudah dikelola, konsisten, dan memberikan UX yang lebih baik untuk admin dan user.

Format object granular bisa ditambahkan nanti jika benar-benar dibutuhkan untuk kebutuhan bisnis yang spesifik.
