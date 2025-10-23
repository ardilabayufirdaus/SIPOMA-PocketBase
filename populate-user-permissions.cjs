const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function populateUserPermissions() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== POPULATING USER PERMISSIONS ===\n');

    // Get all users
    const users = await pb.collection('users').getList(1, 1000, {
      fields: 'id,username,name,role',
    });

    console.log(`Found ${users.totalItems} users`);

    // Get default permissions for each role
    const defaultPerms = await pb.collection('default_permissions').getList(1, 50);
    const defaultPermsMap = {};
    defaultPerms.items.forEach((item) => {
      defaultPermsMap[item.role] = JSON.parse(item.permissions_data);
    });

    console.log('Default permissions loaded for roles:', Object.keys(defaultPermsMap));

    // Process each user
    for (const user of users.items) {
      const role = user.role;
      const defaultPermissions = defaultPermsMap[role];

      if (!defaultPermissions) {
        console.log(`⚠️  No default permissions found for role: ${role} (user: ${user.username})`);
        continue;
      }

      // Check if user already has permissions
      const existingPerms = await pb.collection('user_permissions').getList(1, 1, {
        filter: `user_id = "${user.id}"`,
      });

      if (existingPerms.totalItems > 0) {
        console.log(`⏭️  Permissions already exist for ${user.username}, skipping`);
        continue;
      }

      // Create user permissions record
      const userPermsData = {
        user_id: user.id,
        permissions_data: JSON.stringify(defaultPermissions),
        is_custom_permissions: false,
        role: role,
      };

      await pb.collection('user_permissions').create(userPermsData);
      console.log(`✅ Created permissions for ${user.username} (${role})`);
    }

    console.log('\n✅ All user permissions populated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

populateUserPermissions();
