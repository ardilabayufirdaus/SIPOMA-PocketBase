const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testPlantOperationsPermission() {
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

  console.log('=== TESTING PLANT OPERATIONS PERMISSION ===\n');

  // Test dengan user yang memiliki permission string
  const testUserId = 'nirbztuqpwa5vhl'; // Super Admin dengan plant_operations: 'ADMIN'

  const perms = await pb.collection('user_permissions').getList(1, 1, {
    filter: `user_id = '${testUserId}'`,
  });

  if (perms.items.length > 0) {
    const data = JSON.parse(perms.items[0].permissions_data);
    console.log('User permissions:', data);
    console.log('plant_operations type:', typeof data.plant_operations);
    console.log('plant_operations value:', data.plant_operations);

    // Simulate permission checker logic
    const userPermission = data.plant_operations;
    const requiredLevel = 'READ';

    let hasAccess = false;

    if (typeof userPermission === 'string') {
      // Simple string comparison
      const levelOrder = { NONE: 0, READ: 1, WRITE: 2, ADMIN: 3 };
      hasAccess = levelOrder[userPermission] >= levelOrder[requiredLevel];
      console.log(`String permission check: ${userPermission} >= ${requiredLevel} = ${hasAccess}`);
    } else if (typeof userPermission === 'object') {
      // Object permission check
      const plantOps = userPermission;
      hasAccess = Object.values(plantOps).some((category) =>
        Object.values(category).some((level) => {
          const levelOrder = { NONE: 0, READ: 1, WRITE: 2, ADMIN: 3 };
          return levelOrder[level] >= levelOrder[requiredLevel];
        })
      );
      console.log(`Object permission check result: ${hasAccess}`);
    }

    console.log(`\n✅ User should have access to Plant Operations: ${hasAccess}`);
  }
}

testPlantOperationsPermission();
