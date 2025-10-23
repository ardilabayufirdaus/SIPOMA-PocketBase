/**
 * Add database indexes to PocketBase collections for optimized plant operations queries
 * This script creates new indexes that help speed up common queries across plant operations modules
 */
const PocketBase = require('pocketbase/cjs');
require('dotenv').config();

// Initialize PocketBase client
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'http://141.11.25.69:8090');
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'makassar@270989';

// Define all indexes to create
const INDEXES_TO_CREATE = [
  // Parameter Data indexes
  {
    collection: 'ccr_parameter_data',
    name: 'idx_parameter_date',
    type: 'index',
    options: { column: 'date', unique: false },
  },
  {
    collection: 'ccr_parameter_data',
    name: 'idx_parameter_date_unit',
    type: 'index',
    options: { columns: ['date', 'plant_unit'], unique: false },
  },
  {
    collection: 'ccr_parameter_data',
    name: 'idx_parameter_id',
    type: 'index',
    options: { column: 'parameter_id', unique: false },
  },

  // Silo Data indexes
  {
    collection: 'ccr_silo_data',
    name: 'idx_silo_date',
    type: 'index',
    options: { column: 'date', unique: false },
  },
  {
    collection: 'ccr_silo_data',
    name: 'idx_silo_date_unit',
    type: 'index',
    options: { columns: ['date', 'unit_id'], unique: false },
  },
  {
    collection: 'ccr_silo_data',
    name: 'idx_silo_id',
    type: 'index',
    options: { column: 'silo_id', unique: false },
  },

  // Downtime Data indexes
  {
    collection: 'ccr_downtime_data',
    name: 'idx_downtime_date',
    type: 'index',
    options: { column: 'date', unique: false },
  },
  {
    collection: 'ccr_downtime_data',
    name: 'idx_downtime_date_unit',
    type: 'index',
    options: { columns: ['date', 'unit'], unique: false },
  },

  // Footer Data indexes
  {
    collection: 'ccr_footer_data',
    name: 'idx_footer_date',
    type: 'index',
    options: { column: 'date', unique: false },
  },
  {
    collection: 'ccr_footer_data',
    name: 'idx_footer_date_unit',
    type: 'index',
    options: { columns: ['date', 'plant_unit'], unique: false },
  },
  {
    collection: 'ccr_footer_data',
    name: 'idx_footer_parameter_id',
    type: 'index',
    options: { column: 'parameter_id', unique: false },
  },

  // Information Data indexes
  {
    collection: 'ccr_information',
    name: 'idx_info_date',
    type: 'index',
    options: { column: 'date', unique: false },
  },
  {
    collection: 'ccr_information',
    name: 'idx_info_date_unit',
    type: 'index',
    options: { columns: ['date', 'plant_unit'], unique: false },
  },
];

/**
 * Authenticate with PocketBase admin
 */
async function authenticate() {
  try {
    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not found in environment variables');
      process.exit(1);
    }

    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authenticated as admin');
  } catch (err) {
    console.error('❌ Authentication failed:', err);
    process.exit(1);
  }
}

/**
 * Check if an index already exists
 */
async function indexExists(collection, indexName) {
  try {
    const schema = await pb.collections.getOne(collection);
    return schema.indexes.some((idx) => idx.name === indexName);
  } catch (err) {
    console.error(`Error checking index ${indexName}:`, err);
    return false;
  }
}

/**
 * Create an index if it doesn't already exist
 */
async function createIndexIfNotExists(indexConfig) {
  try {
    const { collection, name: indexName, type, options } = indexConfig;

    // Check if index already exists by trying to get the collection and checking indexes
    try {
      const schema = await pb.collections.getOne(collection);
      const currentIndexes = schema.indexes || [];
      const currentIndexNames = currentIndexes.map((idx) => idx.name);

      if (currentIndexNames.includes(indexName)) {
        console.log(`⏭️ Index ${indexName} already exists on ${collection}, skipping`);
        return;
      }
    } catch (checkError) {
      console.error(`Error checking index ${indexName}:`, checkError);
      return;
    }

    // Create the index using the correct method
    try {
      console.log(`Creating index ${indexName} on ${collection}...`);
      await pb.collections.createIndex(collection, indexName, type, options);
      console.log(`✅ Created index ${indexName} on ${collection}`);
    } catch (createError) {
      console.error(`❌ Failed to create index ${indexConfig.name}:`, createError);
    }
  } catch (err) {
    console.error(`❌ Failed to create index ${indexConfig.name}:`, err);
  }
}

/**
 * Main function to create all indexes
 */
async function addOptimizationIndexes() {
  try {
    console.log('🔧 Starting to add database indexes for query optimization...');

    // Authenticate first
    await authenticate();

    // Create each index
    console.log(`Creating ${INDEXES_TO_CREATE.length} indexes...`);
    for (const indexConfig of INDEXES_TO_CREATE) {
      await createIndexIfNotExists(indexConfig);
    }

    console.log('✅ All indexes created successfully');
  } catch (err) {
    console.error('❌ Error creating indexes:', err);
    process.exit(1);
  }
}

// Run the main function
addOptimizationIndexes();
