const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function checkCollectionAndCreateIndexes() {
  try {
    console.log('Authenticating with PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful!');

    // First, check if collection exists
    console.log('Checking if cop_footer_parameters collection exists...');
    let collection;
    try {
      collection = await pb.collections.getOne('cop_footer_parameters');
      console.log('✅ Collection found:', collection.name);
      console.log('Current indexes:', collection.indexes);
    } catch (error) {
      console.error('❌ Collection not found:', error.message);
      return;
    }

    // Try to create indexes using different approach
    console.log('Creating indexes...');

    // First, let's try to update the collection with indexes
    const updatedCollection = {
      ...collection,
      indexes: [
        {
          name: 'idx_cop_footer_unique_category_unit',
          type: 'unique',
          fields: ['plant_category', 'plant_unit'],
          unique: true,
        },
        {
          name: 'idx_cop_footer_category',
          type: 'index',
          fields: ['plant_category'],
          unique: false,
        },
        {
          name: 'idx_cop_footer_unit',
          type: 'index',
          fields: ['plant_unit'],
          unique: false,
        },
      ],
    };

    console.log('Updating collection with indexes...');
    const result = await pb.collections.update(collection.id, updatedCollection);
    console.log('✅ Collection updated with indexes!');
    console.log('Updated indexes:', result.indexes);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

checkCollectionAndCreateIndexes();
