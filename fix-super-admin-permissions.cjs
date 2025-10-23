const PocketBase = require('pocketbase/cjs');

// Connect to PocketBase
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkAndFixSuperAdminPermissions() {
  try {
    // First authenticate as admin
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');
    console.log('Admin authentication successful');

    // Get all users with role Super Admin
    const superAdmins = await pb.collection('users').getList(1, 100, {
      filter: 'role = "Super Admin"',
    });

    console.log(`Found ${superAdmins.totalItems} Super Admin users`);

    for (const user of superAdmins.items) {
      console.log(`Checking permissions for Super Admin: ${user.username} (${user.id})`);

      // Get existing permissions
      const permissions = await pb.collection('user_permissions').getList(1, 100, {
        filter: `user_id = "${user.id}"`,
        expand: 'permissions',
      });

      console.log(`User has ${permissions.totalItems} permission records`);

      // First, let's check if the user needs permissions created/fixed
      if (permissions.totalItems === 0) {
        console.log(`No permissions found for ${user.username}, initializing...`);
        await initializePermissionsForSuperAdmin(user.id);
        continue;
      }

      // Check for admin permissions in all modules
      const hasAllPermissions = checkSuperAdminPermissions(permissions.items);

      if (!hasAllPermissions) {
        console.log(`Permissions incomplete for ${user.username}, re-initializing...`);

        // Delete existing permissions first
        console.log('Deleting existing permissions...');
        for (const perm of permissions.items) {
          await pb.collection('user_permissions').delete(perm.id);
        }

        // Create new permissions
        await initializePermissionsForSuperAdmin(user.id);
      } else {
        console.log(`Permissions look correct for ${user.username}`);
      }
    }

    console.log('Super Admin permissions check and fix completed');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response?.data);
    }
  }
}

async function initializePermissionsForSuperAdmin(userId) {
  // These are all the modules that need ADMIN permission
  const modules = ['dashboard', 'inspection', 'project_management'];

  console.log('Creating basic module permissions...');

  // For each module, find or create permission record and link to user
  for (const module of modules) {
    const permLevel = 'ADMIN';

    // Find existing permission record or create new one
    let permRecord;
    try {
      permRecord = await pb
        .collection('permissions')
        .getFirstListItem(`module_name="${module}" && permission_level="${permLevel}"`);
      console.log(`Found existing permission for ${module}`);
    } catch (e) {
      // Create if not exists
      permRecord = await pb.collection('permissions').create({
        module_name: module,
        permission_level: permLevel,
        plant_units: [],
      });
      console.log(`Created new permission for ${module}`);
    }

    // Link permission to user
    await pb.collection('user_permissions').create({
      user_id: userId,
      permission_id: permRecord.id,
    });
  }

  // Handle plant operations permissions separately as they need plant units
  await createPlantOperationsPermissions(userId);

  console.log('All permissions initialized for Super Admin');
}

async function createPlantOperationsPermissions(userId) {
  console.log('Creating plant operations permissions...');

  // Define all plant categories and their units
  const plantCategories = {
    'Tonasa 2/3': ['220', '320'],
    'Tonasa 4': ['419', '420'],
    'Tonasa 5': ['552', '553'],
  };

  for (const [category, units] of Object.entries(plantCategories)) {
    for (const unit of units) {
      const plantUnit = [{ category, unit }];

      // Find existing permission record or create new one
      let permRecord;
      try {
        // This is approximate since JSON comparison is tricky in filters
        const perms = await pb.collection('permissions').getList(1, 20, {
          filter: `module_name="plant_operations" && permission_level="ADMIN"`,
        });

        // Find the one with matching plant units
        permRecord = perms.items.find((p) => {
          if (!p.plant_units || !Array.isArray(p.plant_units)) return false;
          if (p.plant_units.length !== 1) return false;
          return p.plant_units[0].category === category && p.plant_units[0].unit === unit;
        });
      } catch (e) {
        // No matching record
        permRecord = null;
      }

      if (!permRecord) {
        // Create new permission
        permRecord = await pb.collection('permissions').create({
          module_name: 'plant_operations',
          permission_level: 'ADMIN',
          plant_units: plantUnit,
        });
        console.log(`Created permission for ${category} unit ${unit}`);
      } else {
        console.log(`Found existing permission for ${category} unit ${unit}`);
      }

      // Link permission to user
      await pb.collection('user_permissions').create({
        user_id: userId,
        permission_id: permRecord.id,
      });
    }
  }
}

function checkSuperAdminPermissions(permissionItems) {
  // Track modules we've seen
  const modulesSeen = {
    dashboard: false,
    plant_operations: {},
    inspection: false,
    project_management: false,
  };

  // All plant units we need to ensure are covered
  const requiredPlantUnits = {
    'Tonasa 2/3': ['220', '320'],
    'Tonasa 4': ['419', '420'],
    'Tonasa 5': ['552', '553'],
  };

  // Track plant units we've seen
  const plantUnitsSeen = {};
  for (const [category, units] of Object.entries(requiredPlantUnits)) {
    plantUnitsSeen[category] = {};
    for (const unit of units) {
      plantUnitsSeen[category][unit] = false;
    }
  }

  // Check all permission records
  for (const item of permissionItems) {
    const perm = item.expand?.permissions;
    if (!perm) continue;

    const module = perm.module_name;
    const level = perm.permission_level;

    // Must have ADMIN level for all modules
    if (level !== 'ADMIN') continue;

    if (module === 'plant_operations' && Array.isArray(perm.plant_units)) {
      // Check plant unit permissions
      for (const pu of perm.plant_units) {
        if (plantUnitsSeen[pu.category] && plantUnitsSeen[pu.category][pu.unit] !== undefined) {
          plantUnitsSeen[pu.category][pu.unit] = true;
        }
      }
    } else if (modulesSeen[module] !== undefined) {
      // Mark basic module as seen
      modulesSeen[module] = true;
    }
  }

  // Check basic modules
  for (const [module, seen] of Object.entries(modulesSeen)) {
    if (module === 'plant_operations') continue;
    if (!seen) {
      console.log(`Missing ADMIN permission for module: ${module}`);
      return false;
    }
  }

  // Check plant units
  for (const [category, units] of Object.entries(plantUnitsSeen)) {
    for (const [unit, seen] of Object.entries(units)) {
      if (!seen) {
        console.log(`Missing ADMIN permission for plant unit: ${category}.${unit}`);
        return false;
      }
    }
  }

  return true;
}

// Run the script
checkAndFixSuperAdminPermissions();
