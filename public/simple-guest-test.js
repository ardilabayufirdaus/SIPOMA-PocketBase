// Simple Guest Permission Test - Copy and paste this into browser console
(async () => {
  console.log('🧪 Testing Guest User Permission Persistence');

  try {
    // Wait for app to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get pb instance from window (should be available in the app)
    const pb = window.pb || window.PocketBase;
    if (!pb) {
      console.log('❌ PocketBase not found. Make sure you are logged in to the app.');
      return;
    }

    console.log('✅ PocketBase instance found');

    // 1. Find Guest user
    const guestUsers = await pb.collection('users').getList(1, 1, {
      filter: 'role = "Guest"',
    });

    if (guestUsers.items.length === 0) {
      console.log('❌ No Guest user found');
      return;
    }

    const guestUser = guestUsers.items[0];
    console.log('✅ Found Guest user:', guestUser.username, guestUser.id);

    // 2. Check current permissions
    console.log('📊 Current permissions:', guestUser.permissions);

    // 3. Save test permissions
    console.log('💾 Saving test permissions...');
    const testPermissions = {
      dashboard: 'READ',
      plant_operations: 'READ',
      inspection: 'NONE',
      project_management: 'NONE',
    };

    // Save to user_permissions collection
    const existingPerms = await pb.collection('user_permissions').getList(1, 1, {
      filter: `user_id = '${guestUser.id}'`,
    });

    const permData = {
      user_id: guestUser.id,
      permissions_data: JSON.stringify(testPermissions),
      is_custom_permissions: true,
      role: guestUser.role,
    };

    if (existingPerms.items.length > 0) {
      await pb.collection('user_permissions').update(existingPerms.items[0].id, permData);
      console.log('✅ Updated existing permissions');
    } else {
      await pb.collection('user_permissions').create(permData);
      console.log('✅ Created new permissions');
    }

    // Update users collection
    await pb.collection('users').update(guestUser.id, {
      permissions: testPermissions,
      updated: new Date().toISOString(),
    });
    console.log('✅ Updated users collection');

    // 4. Verify immediately
    const updatedUser = await pb.collection('users').getOne(guestUser.id);
    console.log('🔍 Immediate verification:', updatedUser.permissions);

    const hasDashboard = updatedUser.permissions?.dashboard === 'READ';
    const hasPlantOps = updatedUser.permissions?.plant_operations === 'READ';

    console.log('✅ Dashboard access:', hasDashboard);
    console.log('✅ Plant operations access:', hasPlantOps);

    if (hasDashboard && hasPlantOps) {
      console.log('🎉 SUCCESS: Permissions saved correctly!');
      console.log('🔄 Now refresh the page (F5) and check if permissions persist...');
    } else {
      console.log('❌ FAILURE: Permissions not saved correctly');
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
})();
