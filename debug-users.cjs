const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function checkUserDetails() {
  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING USER DETAILS ===\n');

    // Get all users
    const users = await pb.collection('users').getFullList({
      fields: 'id,username,name,role,permissions',
    });

    console.log('All users:');
    users.forEach((user) => {
      console.log(
        `ID: ${user.id}, Username: ${user.username}, Name: ${user.name}, Role: ${user.role}, Permissions: ${user.permissions ? 'SET' : 'NULL'}`
      );
    });

    console.log('\n=== CHECKING PERMISSIONS COLLECTION ===\n');

    // Get all permissions
    const permissions = await pb.collection('user_permissions').getFullList({
      fields: 'id,user_id,role,permissions_data',
    });

    console.log('All permissions:');
    permissions.forEach((perm) => {
      console.log(
        `User ID: ${perm.user_id}, Role: ${perm.role}, Permissions: ${perm.permissions_data.substring(0, 50)}...`
      );
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserDetails();
