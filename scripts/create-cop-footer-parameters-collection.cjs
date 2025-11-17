const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function authPocketBase() {
  try {
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authenticated with PocketBase');
  } catch (error) {
    console.error('❌ PocketBase auth failed:', error.message);
    process.exit(1);
  }
}

async function createIndexesIfNotExist() {
  console.log('🔍 Creating indexes for cop_footer_parameters...');

  try {
    // Unique index for plant_category and plant_unit combination
    await pb.collections.createIndex('cop_footer_parameters', {
      name: 'idx_cop_footer_unique_category_unit',
      type: 'INDEX',
      fields: ['plant_category', 'plant_unit'],
      unique: true,
    });
    console.log('✅ Index idx_cop_footer_unique_category_unit created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Index idx_cop_footer_unique_category_unit already exists');
    } else {
      console.error('❌ Error creating index idx_cop_footer_unique_category_unit:', error.message);
    }
  }

  try {
    // Index for plant_category only
    await pb.collections.createIndex('cop_footer_parameters', {
      name: 'idx_cop_footer_category',
      type: 'INDEX',
      fields: ['plant_category'],
      unique: false,
    });
    console.log('✅ Index idx_cop_footer_category created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Index idx_cop_footer_category already exists');
    } else {
      console.error('❌ Error creating index idx_cop_footer_category:', error.message);
    }
  }

  try {
    // Index for plant_unit only
    await pb.collections.createIndex('cop_footer_parameters', {
      name: 'idx_cop_footer_unit',
      type: 'INDEX',
      fields: ['plant_unit'],
      unique: false,
    });
    console.log('✅ Index idx_cop_footer_unit created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Index idx_cop_footer_unit already exists');
    } else {
      console.error('❌ Error creating index idx_cop_footer_unit:', error.message);
    }
  }

  console.log('✅ Indexes creation completed');
}

async function createCopFooterParametersCollection() {
  try {
    console.log('📦 Checking/creating cop_footer_parameters collection...');

    // Check if collection already exists
    const existingCollections = await pb.collections.getFullList();
    const collectionExists = existingCollections.some(
      (col) => col.name === 'cop_footer_parameters'
    );

    if (collectionExists) {
      console.log('⚠️  Collection cop_footer_parameters already exists');
      console.log('🔍 Checking indexes...');

      // Check and create indexes even if collection exists
      await createIndexesIfNotExist();
      return;
    }

    // Create the collection
    await pb.collections.create({
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

    console.log('✅ Collection cop_footer_parameters created successfully');

    // Create indexes
    await createIndexesIfNotExist();

    // Create default record
    console.log('📝 Creating default record...');
    await pb.collection('cop_footer_parameters').create({
      id: 'default',
      plant_category: 'default',
      plant_unit: 'default',
      parameter_ids: [],
    });
    console.log('✅ Default record created');
  } catch (error) {
    console.error('❌ Error creating collection:', error.message);
  }
}

async function main() {
  console.log('🚀 Creating COP Footer Parameters collection...\n');

  await authPocketBase();
  await createCopFooterParametersCollection();

  console.log('\n🎉 Setup complete!');
}

main().catch(console.error);
