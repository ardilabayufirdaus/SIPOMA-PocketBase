const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function recreateCollection() {
  try {
    console.log('Authenticating...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful!');

    // Delete existing collection if it exists
    try {
      console.log('Checking for existing collection...');
      const existing = await pb.collections.getOne('cop_footer_parameters');
      console.log('Deleting existing collection...');
      await pb.collections.delete(existing.id);
      console.log('Existing collection deleted');
    } catch (error) {
      if (error.status === 404) {
        console.log('Collection does not exist, proceeding with creation...');
      } else {
        throw error;
      }
    }

    // Create new collection with proper schema
    console.log('Creating new collection with proper schema...');
    const collection = await pb.collections.create({
      name: 'cop_footer_parameters',
      type: 'base',
      schema: [
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
      ],
    });

    console.log('Collection created successfully!');
    console.log('Collection ID:', collection.id);

    // Create indexes
    console.log('Creating indexes...');

    // Unique index for plant_category + plant_unit
    try {
      await pb.collections.createIndex('cop_footer_parameters', {
        name: 'idx_cop_footer_unique_category_unit',
        type: 'UNIQUE',
        fields: ['plant_category', 'plant_unit'],
        unique: true,
      });
      console.log('✅ Unique composite index created');
    } catch (error) {
      console.log('⚠️  Unique index creation failed:', error.message);
    }

    // Index for plant_category
    try {
      await pb.collections.createIndex('cop_footer_parameters', {
        name: 'idx_cop_footer_category',
        type: 'INDEX',
        fields: ['plant_category'],
        unique: false,
      });
      console.log('✅ Category index created');
    } catch (error) {
      console.log('⚠️  Category index creation failed:', error.message);
    }

    // Index for plant_unit
    try {
      await pb.collections.createIndex('cop_footer_parameters', {
        name: 'idx_cop_footer_unit',
        type: 'INDEX',
        fields: ['plant_unit'],
        unique: false,
      });
      console.log('✅ Unit index created');
    } catch (error) {
      console.log('⚠️  Unit index creation failed:', error.message);
    }

    console.log('✅ COP Footer Parameters collection and indexes created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

recreateCollection();
