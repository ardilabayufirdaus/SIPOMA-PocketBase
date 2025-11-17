const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function addIndexesToCopFooter() {
  try {
    console.log('Authenticating with PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful!');

    console.log('Adding indexes to cop_footer_parameters collection...');

    const indexes = [
      {
        name: 'idx_cop_footer_unique_category_unit',
        type: 'unique',
        fields: ['plant_category', 'plant_unit'],
      },
      {
        name: 'idx_cop_footer_category',
        type: 'index',
        fields: ['plant_category'],
      },
      {
        name: 'idx_cop_footer_unit',
        type: 'index',
        fields: ['plant_unit'],
      },
    ];

    for (const index of indexes) {
      try {
        console.log(`Creating index: ${index.name} on fields: ${index.fields.join(', ')}`);

        // Use direct API call with correct endpoint
        const response = await pb.send(`/api/collections/cop_footer_parameters/indexes`, {
          method: 'POST',
          body: {
            name: index.name,
            type: index.type,
            fields: index.fields,
            unique: index.type === 'unique',
          },
        });

        console.log(`✅ Index ${index.name} created successfully!`);
        console.log('Response:', response);
      } catch (error) {
        if (error.response?.message?.includes('already exists') || error.status === 400) {
          console.log(`⚠️  Index ${index.name} already exists or failed, skipping...`);
        } else {
          console.error(`❌ Failed to create index ${index.name}:`, error.message);
          if (error.response) {
            console.error('Response details:', error.response);
          }
        }
      }
    }

    console.log('✅ All indexes creation completed!');

    // Verify indexes were created
    console.log('Verifying indexes...');
    const collection = await pb.collections.getOne('cop_footer_parameters');
    console.log('Current indexes:', collection.indexes);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

addIndexesToCopFooter();
