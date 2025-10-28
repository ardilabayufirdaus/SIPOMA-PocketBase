const PocketBase = require('pocketbase/cjs');

/**
 * Create ccr_material_usage collection in PocketBase
 * Run this script once to set up the collection for storing CCR material usage data
 */
async function createCcrMaterialUsageCollection() {
  // Get credentials from environment variables
  const pbUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';
  const pbEmail = process.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
  const pbPassword = process.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';

  const pb = new PocketBase(pbUrl);

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(pbEmail, pbPassword);

    console.log('Checking if ccr_material_usage collection exists...');

    // Check if collection already exists
    let collection;
    try {
      collection = await pb.collections.getOne('ccr_material_usage');
      console.log('✅ Collection already exists:', collection.id);
      return;
    } catch (error) {
      if (error.status === 404) {
        console.log('Creating ccr_material_usage collection...');

        // Create the collection with proper schema
        collection = await pb.collections.create({
          name: 'ccr_material_usage',
          type: 'base',
          schema: [
            {
              name: 'date',
              type: 'text',
              required: true,
            },
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
              name: 'shift',
              type: 'text',
              required: true,
              options: {
                values: ['shift3_cont', 'shift1', 'shift2', 'shift3'],
              },
            },
            {
              name: 'clinker',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
            {
              name: 'gypsum',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
            {
              name: 'limestone',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
            {
              name: 'trass',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
            {
              name: 'fly_ash',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
            {
              name: 'fine_trass',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
            {
              name: 'ckd',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
            {
              name: 'total_production',
              type: 'number',
              required: false,
              options: {
                min: 0,
              },
            },
          ],
          // Set up proper permissions for plant operations users
          listRule:
            '@request.auth.id != "" && @request.auth.role = "super-admin" || @request.auth.role = "admin" || @request.auth.role = "operator"',
          viewRule:
            '@request.auth.id != "" && @request.auth.role = "super-admin" || @request.auth.role = "admin" || @request.auth.role = "operator"',
          createRule:
            '@request.auth.id != "" && @request.auth.role = "super-admin" || @request.auth.role = "admin" || @request.auth.role = "operator"',
          updateRule:
            '@request.auth.id != "" && @request.auth.role = "super-admin" || @request.auth.role = "admin" || @request.auth.role = "operator"',
          deleteRule:
            '@request.auth.id != "" && @request.auth.role = "super-admin" || @request.auth.role = "admin"',
        });

        console.log('✅ Collection created successfully:', collection.id);

        // Create indexes for better performance
        console.log('Creating indexes...');

        // Index for date filtering
        await pb.collections.createIndex(collection.id, 'idx_ccr_material_usage_date', 'date');

        // Index for plant_unit filtering
        await pb.collections.createIndex(
          collection.id,
          'idx_ccr_material_usage_plant_unit',
          'plant_unit'
        );

        // Index for shift filtering
        await pb.collections.createIndex(collection.id, 'idx_ccr_material_usage_shift', 'shift');

        // Composite index for common queries (date + plant_unit + shift)
        await pb.collections.createIndex(
          collection.id,
          'idx_ccr_material_usage_date_unit_shift',
          'date, plant_unit, shift'
        );

        console.log('✅ Indexes created successfully');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the function
createCcrMaterialUsageCollection()
  .then(() => {
    console.log('🎉 ccr_material_usage collection setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
