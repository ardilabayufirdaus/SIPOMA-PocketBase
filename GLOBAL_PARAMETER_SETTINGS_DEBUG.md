# 🔍 DEBUGGING: Global Parameter Settings Loading

## 📊 **CURRENT STATUS**

Dari console log yang diberikan, kita dapat melihat bahwa:

```javascript
Loading settings for: {
  user: 'ardila.firdaus@sig.id',
  role: 'Super Admin',
  plantCategory: 'Tonasa 2/3',
  plantUnit: 'Cement Mill 220'
}
```

✅ **Hook sudah berjalan dengan benar:**

- User terautentikasi sebagai Super Admin
- Plant category dan unit sudah dipilih
- LoadSettings function terpanggil

## 🔧 **ENHANCED DEBUG LOGGING**

Saya telah menambahkan debug logging yang lebih comprehensive untuk troubleshooting:

### **1. Hook Level Debugging** (`useGlobalParameterSettings.ts`)

```typescript
// Query result logging
console.log("Query result:", {
  data,
  fetchError,
  queryType: currentUser.role === "Super Admin" ? "global" : "personal",
});

// Final settings logging
console.log("Final settings loaded:", {
  resultSettings,
  hasSettings: !!resultSettings,
  parametersCount: resultSettings?.selected_parameters?.length || 0,
  isGlobal: resultSettings?.is_global,
});
```

### **2. Component Level Debugging** (`IndexTab.tsx`)

```typescript
// Settings application logging
console.log("GlobalSettings changed:", {
  globalSettings,
  hasSettings: !!globalSettings,
  parametersCount: globalSettings?.selected_parameters?.length || 0,
  parameters: globalSettings?.selected_parameters,
});

// Load trigger logging
console.log("Dependency changed for loadSettings:", {
  currentUser: !!currentUser,
  userRole: currentUser?.role,
  selectedCategory,
  selectedUnit,
});
```

## 📋 **EXPECTED DEBUG FLOW**

Dengan logging yang ditambahkan, kita harus melihat sequence seperti ini di console:

### **1. Initial Load:**

```javascript
"Dependency changed for loadSettings: {currentUser: true, userRole: 'Super Admin', selectedCategory: 'Tonasa 2/3', selectedUnit: 'Cement Mill 220'}";
"Triggering loadSettings...";
"Loading settings for: {user: 'ardila.firdaus@sig.id', role: 'Super Admin', ...}";
```

### **2. Query Execution:**

```javascript
"Query result: {data: [...], fetchError: null, queryType: 'global'}";
```

### **3. Settings Application:**

```javascript
"Final settings loaded: {resultSettings: {...}, hasSettings: true, parametersCount: 5, isGlobal: true}";
"GlobalSettings changed: {globalSettings: {...}, hasSettings: true, parametersCount: 5, parameters: [...]}";
"Applying settings to selectedParameters: ['param1', 'param2', ...]";
"SelectedParameters updated, new size: 5";
```

## 🚨 **POSSIBLE SCENARIOS**

### **Scenario A: No Settings Found**

```javascript
"Query result: {data: [], fetchError: null, queryType: 'global'}";
"Final settings loaded: {resultSettings: null, hasSettings: false, parametersCount: 0, isGlobal: undefined}";
"GlobalSettings changed: {globalSettings: null, hasSettings: false, parametersCount: 0, parameters: undefined}";
"No global settings to apply or empty parameters";
```

**Solution**: Create initial global settings by saving parameters

### **Scenario B: Database Error**

```javascript
"Query result: {data: null, fetchError: {code: 'PGRST...', message: '...'}, queryType: 'global'}";
"Error loading global parameter settings: ...";
```

**Solution**: Check Supabase connection, table exists, RLS policies

### **Scenario C: Settings Found but Not Applied**

```javascript
"Final settings loaded: {resultSettings: {...}, hasSettings: true, parametersCount: 5, isGlobal: true}";
"GlobalSettings changed: {globalSettings: {...}, hasSettings: true, parametersCount: 5, parameters: [...]}";
// But selectedParameters doesn't change
```

**Solution**: Check React state updates, parameter validation

## 🔧 **TROUBLESHOOTING STEPS**

### **Step 1: Check Database**

Buka Supabase Dashboard → SQL Editor dan jalankan:

```sql
-- Check if table exists
SELECT COUNT(*) FROM global_parameter_settings;

-- Check existing settings for this plant
SELECT * FROM global_parameter_settings
WHERE plant_category = 'Tonasa 2/3'
AND plant_unit = 'Cement Mill 220'
AND is_global = true;

-- Check all global settings
SELECT id, plant_category, plant_unit, selected_parameters, is_global, updated_by, created_at
FROM global_parameter_settings
WHERE is_global = true
ORDER BY created_at DESC;
```

### **Step 2: Test Save Operation**

Kalau belum ada settings, coba save dulu:

1. Buka pengaturan parameter (gear icon)
2. Pilih beberapa parameter
3. Save settings
4. Check console untuk save logs
5. Refresh page dan lihat apakah settings ter-load

### **Step 3: Network Debugging**

1. Buka Browser DevTools → Network tab
2. Filter by "global_parameter_settings"
3. Refresh page
4. Check HTTP request/response
5. Verify query parameters dan response data

### **Step 4: Component State Debugging**

Add temporary debug di component:

```typescript
// Add this in IndexTab component untuk debug
useEffect(() => {
  console.log(
    "Current selectedParameters state:",
    Array.from(selectedParameters)
  );
}, [selectedParameters]);

console.log("Render state:", {
  selectedParametersSize: selectedParameters.size,
  availableParametersCount: availableParameters.length,
  showSettings,
  loading,
});
```

## 📊 **QUICK DIAGNOSTIC COMMANDS**

Run di browser console saat di halaman Plant Operations:

```javascript
// Check component state
console.log("Current state:", {
  selectedParameters: Array.from(selectedParameters || []),
  globalSettings: globalSettings,
  currentUser: currentUser,
});

// Manual trigger loadSettings
if (typeof loadSettings === "function") {
  loadSettings("Tonasa 2/3", "Cement Mill 220");
}
```

## ✅ **NEXT STEPS**

1. **Refresh halaman** dan check console untuk sequence logs yang baru
2. **Look for specific error messages** atau unexpected behavior
3. **Test save operation** jika belum ada settings
4. **Check database directly** untuk verify data exists
5. **Report back dengan complete console output** untuk analysis lebih lanjut

Dengan enhanced debugging ini, kita akan mendapat visibility penuh terhadap apa yang terjadi di setiap step! 🔍
