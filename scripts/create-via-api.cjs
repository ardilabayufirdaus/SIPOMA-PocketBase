const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function createViaAPI() {
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

    // Create collection using direct API call
    console.log('Creating collection via direct API call...');

    const collectionData = {
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
    };

    const collection = await pb.send('/api/collections', {
      method: 'POST',
      body: collectionData,
    });

    console.log('Collection created successfully via API!');
    console.log('Collection ID:', collection.id);

    // Create indexes using direct API
    console.log('Creating indexes via API...');

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
        console.log(`Creating index: ${index.name}`);
        await pb.send(`/api/collections/cop_footer_parameters/indexes`, {
          method: 'POST',
          body: index,
        });
        console.log(`✅ Index ${index.name} created successfully!`);
      } catch (error) {
        console.log(`⚠️  Failed to create index ${index.name}:`, error.message);
      }
    }

    console.log('✅ COP Footer Parameters collection and indexes created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

createViaAPI();
