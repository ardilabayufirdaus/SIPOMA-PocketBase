const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function updateCollection() {
  try {
    console.log('Authenticating...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful!');

    console.log('Getting collection...');
    const collection = await pb.collections.getOne('cop_footer_parameters');
    console.log('Collection found:', collection.name);

    // Update schema to change parameter_ids to json
    collection.schema = [
      {
        name: 'plant_category',
        type: 'text',
        required: true,
      },
      {
        name: 'plant_unit',
        type: 'text',
        required: true,
      },
      {
        name: 'parameter_ids',
        type: 'json',
        required: true,
      },
    ];

    console.log('Updating collection schema...');
    const updatedCollection = await pb.collections.update(collection.id, collection);
    console.log('Collection updated successfully!');

    // Create indexes
    console.log('Creating indexes...');

    try {
      await pb.collections.createIndex('cop_footer_parameters', {
        name: 'idx_cop_footer_unique_category_unit',
        type: 'UNIQUE',
        fields: ['plant_category', 'plant_unit'],
        unique: true,
      });
      console.log('✅ Unique index created');
    } catch (error) {
      console.log('⚠️  Unique index might already exist:', error.message);
    }

    try {
      await pb.collections.createIndex('cop_footer_parameters', {
        name: 'idx_cop_footer_category',
        type: 'INDEX',
        fields: ['plant_category'],
        unique: false,
      });
      console.log('✅ Category index created');
    } catch (error) {
      console.log('⚠️  Category index might already exist:', error.message);
    }

    try {
      await pb.collections.createIndex('cop_footer_parameters', {
        name: 'idx_cop_footer_unit',
        type: 'INDEX',
        fields: ['plant_unit'],
        unique: false,
      });
      console.log('✅ Unit index created');
    } catch (error) {
      console.log('⚠️  Unit index might already exist:', error.message);
    }

    console.log('✅ COP Footer Parameters collection setup complete!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

updateCollection();
