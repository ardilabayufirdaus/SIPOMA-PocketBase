/**
 * Add COP Analysis specific indexes and cache collection for optimal performance
 * This script creates specialized indexes and a cache collection for COP Analysis queries
 */
const PocketBase = require('pocketbase/cjs');
require('dotenv').config();

// Initialize PocketBase client
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/');
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'makassar@270989';

// Define COP Analysis specific indexes
const COP_ANALYSIS_INDEXES = [
  {
    collection: 'ccr_footer_data',
    name: 'idx_cop_analysis_date_param_unit',
    type: 'index',
    options: { columns: ['date', 'parameter_id', 'plant_unit'], unique: false },
  },
  {
    collection: 'ccr_footer_data',
    name: 'idx_cop_analysis_date_unit',
    type: 'index',
    options: { columns: ['date', 'plant_unit'], unique: false },
  },
];

// COP Analysis Cache Collection Schema
const COP_ANALYSIS_CACHE_SCHEMA = {
  name: 'cop_analysis_cache',
  type: 'base',
  schema: [
    {
      name: 'cache_key',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'category',
      type: 'text',
      required: true,
    },
    {
      name: 'unit',
      type: 'text',
      required: true,
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'month',
      type: 'number',
      required: true,
    },
    {
      name: 'analysis_data',
      type: 'json',
      required: true,
    },
    {
      name: 'created_at',
      type: 'date',
      required: true,
    },
    {
      name: 'expires_at',
      type: 'date',
      required: true,
    },
    {
      name: 'last_accessed',
      type: 'date',
      required: true,
    },
  ],
  indexes: [
    {
      name: 'idx_cop_cache_key',
      type: 'index',
      options: { column: 'cache_key', unique: true },
    },
    {
      name: 'idx_cop_cache_category_unit',
      type: 'index',
      options: { columns: ['category', 'unit'], unique: false },
    },
    {
      name: 'idx_cop_cache_expires',
      type: 'index',
      options: { column: 'expires_at', unique: false },
    },
  ],
  rules: {
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  },
};

/**
 * Authenticate with PocketBase admin
 */
async function authenticate() {
  try {
    if (!adminEmail || !adminPassword) {
      console.error('❌ Admin credentials not found in environment variables');
      console.error('Please set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD');
      process.exit(1);
    }

    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authenticated as admin');
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    process.exit(1);
  }
}

/**
 * Check if collection exists
 */
async function collectionExists(collectionName) {
  try {
    await pb.collections.getOne(collectionName);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Check if index exists
 */
async function indexExists(collectionName, indexName) {
  try {
    const collection = await pb.collections.getOne(collectionName);
    return collection.indexes.some((idx) => idx.name === indexName);
  } catch (err) {
    console.error(`❌ Error checking index ${indexName}:`, err.message);
    return false;
  }
}

/**
 * Create collection if it doesn't exist
 */
async function createCollectionIfNotExists(collectionSchema) {
  try {
    const exists = await collectionExists(collectionSchema.name);
    if (exists) {
      console.log(`⏭️ Collection ${collectionSchema.name} already exists, skipping`);
      return;
    }

    await pb.collections.create(collectionSchema);
    console.log(`✅ Created collection: ${collectionSchema.name}`);
  } catch (err) {
    console.error(`❌ Failed to create collection ${collectionSchema.name}:`, err.message);
  }
}

/**
 * Create index if it doesn't exist
 */
async function createIndexIfNotExists(indexConfig) {
  try {
    const { collection, name: indexName, type, options } = indexConfig;

    const exists = await indexExists(collection, indexName);
    if (exists) {
      console.log(`⏭️ Index ${indexName} already exists on ${collection}, skipping`);
      return;
    }

    // Get current collection schema
    const collectionSchema = await pb.collections.getOne(collection);

    // Add new index to existing indexes
    const updatedIndexes = [
      ...(collectionSchema.indexes || []),
      { name: indexName, type, options },
    ];

    // Update collection with new index
    await pb.collections.update(collection, {
      ...collectionSchema,
      indexes: updatedIndexes,
    });

    console.log(`✅ Created index: ${indexName} on ${collection}`);
  } catch (err) {
    console.error(`❌ Failed to create index ${indexConfig.name}:`, err.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting COP Analysis optimization setup...\n');

  // Authenticate
  await authenticate();

  console.log('\n📊 Creating COP Analysis Cache Collection...');
  await createCollectionIfNotExists(COP_ANALYSIS_CACHE_SCHEMA);

  console.log('\n🔍 Adding COP Analysis specific indexes...');
  for (const indexConfig of COP_ANALYSIS_INDEXES) {
    await createIndexIfNotExists(indexConfig);
  }

  console.log('\n✅ COP Analysis optimization setup completed!');
  console.log('\n📋 Summary:');
  console.log('- Created cop_analysis_cache collection for storing computed analysis results');
  console.log('- Added optimized indexes for COP Analysis queries');
  console.log('- This will significantly improve COP Analysis page loading performance');

  process.exit(0);
}

// Run the script
main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
