/**
 * Script to add indexes to PocketBase collections to optimize plant operations queries
 *
 * Run this script with: node add-plant-ops-indexes.cjs
 */

const PocketBase = require('pocketbase/cjs');
const readline = require('readline');

// Configuration
const baseUrl = process.env.PB_URL || 'http://141.11.25.69:8090';
const adminEmail = process.env.PB_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.PB_ADMIN_PASSWORD || 'makassar@270989';

// Create PocketBase client
const pb = new PocketBase(baseUrl);

// Query optimization objects for each collection
const indexesToAdd = {
  ccr_parameter_data: [
    {
      name: 'idx_parameter_data_date',
      type: 'index',
      options: { column: 'date', unique: false },
    },
    {
      name: 'idx_parameter_data_date_parameter_id',
      type: 'index',
      options: { columns: ['date', 'parameter_id'], unique: false },
    },
    {
      name: 'idx_parameter_data_date_plant_unit',
      type: 'index',
      options: { columns: ['date', 'plant_unit'], unique: false },
    },
  ],
  ccr_silo_data: [
    {
      name: 'idx_silo_data_date',
      type: 'index',
      options: { column: 'date', unique: false },
    },
    {
      name: 'idx_silo_data_date_silo_id',
      type: 'index',
      options: { columns: ['date', 'silo_id'], unique: false },
    },
    {
      name: 'idx_silo_data_date_unit_id',
      type: 'index',
      options: { columns: ['date', 'unit_id'], unique: false },
    },
  ],
  ccr_footer_data: [
    {
      name: 'idx_footer_data_date',
      type: 'index',
      options: { column: 'date', unique: false },
    },
    {
      name: 'idx_footer_data_date_parameter_id',
      type: 'index',
      options: { columns: ['date', 'parameter_id'], unique: false },
    },
    {
      name: 'idx_footer_data_date_plant_unit',
      type: 'index',
      options: { columns: ['date', 'plant_unit'], unique: false },
    },
  ],
  ccr_downtime_data: [
    {
      name: 'idx_downtime_data_date',
      type: 'index',
      options: { column: 'date', unique: false },
    },
    {
      name: 'idx_downtime_data_date_unit',
      type: 'index',
      options: { columns: ['date', 'unit'], unique: false },
    },
    {
      name: 'idx_downtime_data_status',
      type: 'index',
      options: { column: 'status', unique: false },
    },
  ],
  ccr_information: [
    {
      name: 'idx_information_date',
      type: 'index',
      options: { column: 'date', unique: false },
    },
    {
      name: 'idx_information_date_plant_unit',
      type: 'index',
      options: { columns: ['date', 'plant_unit'], unique: false },
    },
  ],
  parameter_settings: [
    {
      name: 'idx_parameter_settings_unit',
      type: 'index',
      options: { column: 'unit', unique: false },
    },
  ],
  plant_units: [
    {
      name: 'idx_plant_units_category',
      type: 'index',
      options: { column: 'category', unique: false },
    },
  ],
};

// Function to create indexes for a collection
async function createIndexesForCollection(collection, indexes) {
  console.log(`Creating indexes for collection: ${collection}`);
  try {
    // Get the current schema
    const schema = await pb.collections.getOne(collection);

    // Current indexes in the schema
    const currentIndexes = schema.indexes || [];
    const currentIndexNames = currentIndexes.map((idx) => idx.name);

    // Process each index
    for (const index of indexes) {
      if (currentIndexNames.includes(index.name)) {
        console.log(`  - Index ${index.name} already exists, skipping`);
        continue;
      }

      // Add the index to the schema
      try {
        console.log(`  - Adding index: ${index.name}`);
        await pb.collections.createIndex(collection, index.name, index.type, index.options);
        console.log(`  - Index ${index.name} created successfully`);
      } catch (indexError) {
        console.error(`  - Error creating index ${index.name}:`, indexError);
      }
    }

    console.log(`Indexes for collection ${collection} processed successfully`);
  } catch (error) {
    console.error(`Error processing collection ${collection}:`, error);
  }
}

// Function to create the query optimizers for all collections
async function createAllIndexes() {
  try {
    console.log('Authenticating as admin...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful');

    // Process each collection
    for (const [collection, indexes] of Object.entries(indexesToAdd)) {
      await createIndexesForCollection(collection, indexes);
    }

    console.log('\nAll indexes created successfully');
    console.log('\nOptimization Complete!');
    console.log('====================');
    console.log('The following collections now have optimized queries:');
    Object.keys(indexesToAdd).forEach((collection) => console.log(` - ${collection}`));
    console.log('\nThis will improve performance for plant operations data loading.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Prompt for confirmation before proceeding
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  'This script will add indexes to optimize plant operations queries. Continue? (y/n) ',
  (answer) => {
    if (answer.toLowerCase() === 'y') {
      createAllIndexes().finally(() => rl.close());
    } else {
      console.log('Operation cancelled');
      rl.close();
    }
  }
);
