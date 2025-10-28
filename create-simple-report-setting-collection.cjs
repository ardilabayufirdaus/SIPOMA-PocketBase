const PocketBase = require('pocketbase/cjs');

// PocketBase connection
const pb = new PocketBase('https://api.sipoma.site/');

async function createSimpleReportSettingCollection() {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    // Check if collection already exists
    const collections = await pb.collections.getFullList();
    const existingCollection = collections.find((c) => c.name === 'simple_report_settings');

    if (existingCollection) {
      console.log('Simple Report Settings collection already exists');
      return;
    }

    // Create the collection
    const collection = await pb.collections.create({
      name: 'simple_report_settings',
      type: 'base',
      schema: [
        {
          name: 'parameter_id',
          type: 'text',
          required: true,
          unique: false,
        },
        {
          name: 'category',
          type: 'text',
          required: true,
          unique: false,
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          unique: false,
        },
        {
          name: 'is_active',
          type: 'bool',
          required: false,
          unique: false,
        },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    });

    console.log('Simple Report Settings collection created successfully:', collection.id);

    // Create indexes for better performance
    // Index on category for filtering
    // Index on parameter_id for lookups
    // Index on order for sorting

    console.log('Simple Report Settings collection setup complete');
  } catch (error) {
    console.error('Error creating Simple Report Settings collection:', error);
  }
}

createSimpleReportSettingCollection();
