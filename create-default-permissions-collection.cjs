const PocketBase = require('pocketbase/cjs');

/**
 * Create default_permissions collection in PocketBase
 * Run this script once to set up the collection for storing custom default permissions
 */
async function createDefaultPermissionsCollection() {
  // Get credentials from environment variables
  const pbUrl = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
  const pbEmail = process.env.VITE_POCKETBASE_EMAIL || 'admin@example.com';
  const pbPassword = process.env.VITE_POCKETBASE_PASSWORD || 'password123';

  const pb = new PocketBase(pbUrl);

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(pbEmail, pbPassword);

    console.log('Checking if default_permissions collection exists...');

    // Check if collection already exists
    let collection;
    try {
      collection = await pb.collections.getOne('default_permissions');
      console.log('✅ Collection already exists:', collection.id);
    } catch (error) {
      if (error.status === 404) {
        console.log('Creating default_permissions collection...');

        // Create the collection
        collection = await pb.collections.create({
          name: 'default_permissions',
          type: 'base',
          schema: [
            {
              name: 'role',
              type: 'text',
              required: true,
            },
            {
              name: 'permissions_data',
              type: 'text',
              required: true,
            },
          ],
        });

        console.log('✅ Collection created successfully:', collection.id);
      } else {
        throw error;
      }
    }

    // Check existing records
    const existingRecords = await pb.collection('default_permissions').getFullList();
    console.log(`Found ${existingRecords.length} existing records`);

    // Create initial records for all roles using default permissions
    const roles = ['Super Admin', 'Admin', 'Manager', 'Operator', 'Outsourcing', 'Guest'];
    const defaultPermissions = {
      'Super Admin': {
        dashboard: 'ADMIN',
        plant_operations: {},
        inspection: 'ADMIN',
        project_management: 'ADMIN',
      },
      Admin: {
        dashboard: 'ADMIN',
        plant_operations: {},
        inspection: 'ADMIN',
        project_management: 'ADMIN',
      },
      Manager: {
        dashboard: 'ADMIN',
        plant_operations: {},
        inspection: 'WRITE',
        project_management: 'WRITE',
      },
      Operator: {
        dashboard: 'READ',
        plant_operations: {},
        inspection: 'NONE',
        project_management: 'NONE',
      },
      Outsourcing: {
        dashboard: 'READ',
        plant_operations: {},
        inspection: 'READ',
        project_management: 'NONE',
      },
      Guest: {
        dashboard: 'NONE',
        plant_operations: {},
        inspection: 'NONE',
        project_management: 'NONE',
      },
    };

    console.log('Creating/updating default permission records...');

    for (const role of roles) {
      const existingRecord = existingRecords.find((record) => record.role === role);

      if (existingRecord) {
        // Update existing record
        await pb.collection('default_permissions').update(existingRecord.id, {
          role,
          permissions_data: JSON.stringify(defaultPermissions[role]),
        });
        console.log(`✅ Updated default permissions for ${role}`);
      } else {
        // Create new record
        await pb.collection('default_permissions').create({
          role,
          permissions_data: JSON.stringify(defaultPermissions[role]),
        });
        console.log(`✅ Created default permissions for ${role}`);
      }
    }

    console.log('🎉 Setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the setup
createDefaultPermissionsCollection();
