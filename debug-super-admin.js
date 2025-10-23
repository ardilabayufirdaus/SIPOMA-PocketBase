// Debug script untuk memverifikasi hak akses Super Admin
// Jalankan di konsol browser setelah login sebagai Super Admin

(() => {
  // Get user data from various sources
  const pbAuth = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
  const secureStorageUser = (() => {
    try {
      // secureStorage menggunakan localStorage dengan enkripsi sederhana
      // Ini hanya contoh, akses sebenarnya tergantung implementasi
      const item = localStorage.getItem('currentUser');
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  })();

  // Create debug report
  const report = {
    userRole: pbAuth?.model?.role || 'Unknown',
    hasPermissionsInPocketbaseAuth: !!pbAuth?.model?.permissions,
    hasPermissionsInSecureStorage: !!secureStorageUser?.permissions,
    permissionsSummary: {},
    detailedPermissions: pbAuth?.model?.permissions || {},
  };

  // Analyze permissions
  if (pbAuth?.model?.permissions) {
    const perms = pbAuth.model.permissions;
    report.permissionsSummary = {
      dashboard: perms.dashboard,
      inspection: perms.inspection,
      project_management: perms.project_management,
      system_settings: perms.system_settings,
      user_management: perms.user_management,
      packing_plant: perms.packing_plant,
      plant_operations: Object.keys(perms.plant_operations || {}).length + ' categories',
    };
  }

  // Create styled console output
  console.group('%c🔒 Super Admin Permissions Debug Report', 'color:blue;font-weight:bold;font-size:14px');
  console.log('%cUser role: %c' + report.userRole, 'font-weight:bold', report.userRole === 'Super Admin' ? 'color:green;font-weight:bold' : 'color:red');
  console.log('%cPocketBase Auth has permissions: %c' + report.hasPermissionsInPocketbaseAuth, 'font-weight:bold', report.hasPermissionsInPocketbaseAuth ? 'color:green' : 'color:red');
  console.log('%cSecureStorage has permissions: %c' + report.hasPermissionsInSecureStorage, 'font-weight:bold', report.hasPermissionsInSecureStorage ? 'color:green' : 'color:red');

  console.group('%cPermission Summary', 'color:blue');
  for (const [key, value] of Object.entries(report.permissionsSummary)) {
    console.log(`${key}: %c${value}`, value === 'ADMIN' ? 'color:green;font-weight:bold' : 'color:orange');
  }
  console.groupEnd();

  console.log('%cDetailed Permissions:', 'color:blue');
  console.log(report.detailedPermissions);

  // Test PermissionChecker behavior
  console.group('%cPermissionChecker Tests', 'color:blue');
  
  // Simulate PermissionChecker class
  const hasPermission = (feature, level = 'READ') => {
    if (!pbAuth?.model) return false;
    if (pbAuth.model.role === 'Super Admin') {
      console.log(`%c✅ Super Admin check passes for ${feature}:${level}`, 'color:green');
      return true;
    }
    
    const permissions = pbAuth.model.permissions || {};
    const permission = permissions[feature];
    
    if (typeof permission === 'string') {
      const result = ['READ', 'WRITE', 'ADMIN'].indexOf(level) <= ['READ', 'WRITE', 'ADMIN'].indexOf(permission);
      console.log(`${result ? '✅' : '❌'} Feature ${feature}: Required ${level}, Has ${permission || 'NONE'}`);
      return result;
    }
    
    if (feature === 'plant_operations' && typeof permission === 'object') {
      // Simplified check
      console.log(`plant_operations structure: ${Object.keys(permission || {}).length} categories`);
      return Object.keys(permission || {}).length > 0;
    }
    
    return false;
  };
  
  // Test critical permissions
  console.log('Dashboard permission test: ' + hasPermission('dashboard', 'ADMIN'));
  console.log('User management permission test: ' + hasPermission('user_management', 'ADMIN'));
  console.log('Plant operations permission test: ' + hasPermission('plant_operations', 'READ'));
  console.groupEnd();
  
  console.groupEnd();
  
  return report;
})();