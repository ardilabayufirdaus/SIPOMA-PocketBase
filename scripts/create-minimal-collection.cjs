const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function createMinimalCollection() {
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
        console.log('Collection does not exist');
      } else {
        throw error;
      }
    }

    // Create collection with minimal schema first
    console.log('Creating collection with minimal schema...');
    const collection = await pb.collections.create({
      name: 'cop_footer_parameters',
      type: 'base',
      schema: [
        {
          name: 'parameter_ids',
          type: 'json',
          required: false,
          options: { maxSize: 2000000 },
        },
        {
          name: 'plant_category',
          type: 'text',
          required: true,
          options: { min: null, max: null, pattern: '' },
        },
        {
          name: 'plant_unit',
          type: 'text',
          required: true,
          options: { min: null, max: null, pattern: '' },
        },
      ],
    });

    console.log('Minimal collection created successfully!');
    console.log('Collection ID:', collection.id);

    // Now add the json field
    console.log('Adding parameter_ids field...');
    const updatedSchema = [
      ...collection.schema,
      {
        name: 'parameter_ids',
        type: 'json',
        required: true,
      },
    ];

    const updatedCollection = await pb.collections.update(collection.id, {
      ...collection,
      schema: updatedSchema,
    });

    console.log('JSON field added successfully!');

    // Create indexes
    console.log('Creating indexes...');

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

    console.log('✅ COP Footer Parameters collection setup complete!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

createMinimalCollection();
