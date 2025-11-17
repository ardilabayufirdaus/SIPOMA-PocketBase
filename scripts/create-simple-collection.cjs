const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function createSimpleCollection() {
  try {
    console.log('Authenticating...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful!');

    console.log('Creating cop_footer_parameters collection...');

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
          type: 'text',
          required: true,
        },
      ],
    });

    console.log('Collection created successfully!');
    console.log('Collection ID:', collection.id);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

createSimpleCollection();
