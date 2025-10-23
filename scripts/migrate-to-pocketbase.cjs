const { createClient } = require('@supabase/supabase-js');
const PocketBase = require('pocketbase/cjs');

// Load env vars (assume .env exists)
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const pocketbaseUrl = process.env.POCKETBASE_URL || 'http://141.11.25.69:8090';

const supabase = createClient(supabaseUrl, supabaseKey);
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
async function authPocketBase() {
  try {
    await pb.admins.authWithPassword(process.env.POCKETBASE_EMAIL, process.env.POCKETBASE_PASSWORD);
    console.log('Authenticated with PocketBase');
  } catch (error) {
    console.error('PocketBase auth failed:', error);
    process.exit(1);
  }
}

// Tables to migrate (based on migrations)
const tables = [
  'ccr_information',
  'notifications',
  'cop_parameters',
  // Add more as needed
];

async function migrateTable(tableName) {
  console.log(`Migrating ${tableName}...`);

  // Export from Supabase
  const { data: supabaseData, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return;
  }

  // Transform data (basic mapping)
  const transformedData = supabaseData.map((row) => {
    const newRow = { ...row };
    // Map UUID to string
    if (newRow.id && typeof newRow.id === 'string') newRow.id = row.id;
    // Map timestamps
    if (newRow.created_at) newRow.created_at = new Date(row.created_at).toISOString();
    if (newRow.updated_at) newRow.updated_at = new Date(row.updated_at).toISOString();
    // Handle JSONB
    if (newRow.metadata) newRow.metadata = JSON.stringify(row.metadata);
    return newRow;
  });

  // Create collection in PocketBase if not exists (assume collection name = table name)
  const schemas = {
    ccr_information: [
      { name: 'id', type: 'text', required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'plant_unit', type: 'text', required: true },
      { name: 'information', type: 'text' },
      { name: 'created_at', type: 'date' },
      { name: 'updated_at', type: 'date' },
    ],
    notifications: [
      { name: 'id', type: 'text', required: true },
      { name: 'title', type: 'text', required: true },
      { name: 'message', type: 'text', required: true },
      {
        name: 'severity',
        type: 'select',
        required: true,
        options: { values: ['Info', 'Warning', 'Critical'] },
      },
      {
        name: 'category',
        type: 'select',
        required: true,
        options: { values: ['system', 'maintenance', 'production', 'user', 'security', 'audit'] },
      },
      { name: 'action_url', type: 'url' },
      { name: 'action_label', type: 'text' },
      { name: 'metadata', type: 'json' },
      { name: 'user_id', type: 'text', required: true },
      { name: 'created_at', type: 'date' },
      { name: 'read_at', type: 'date' },
      { name: 'dismissed_at', type: 'date' },
      { name: 'snoozed_until', type: 'date' },
      { name: 'expires_at', type: 'date' },
    ],
    cop_parameters: [
      { name: 'id', type: 'text', required: true },
      { name: 'parameter_ids', type: 'json' },
    ],
  };

  try {
    await pb.collections.create({
      name: tableName,
      type: 'base',
      schema: schemas[tableName] || [],
    });
  } catch (e) {
    console.log(`Collection ${tableName} might already exist or schema error:`, e.message);
    // Proceed anyway
  }

  // Import to PocketBase
  for (const record of transformedData) {
    try {
      await pb.collection(tableName).create(record);
    } catch (e) {
      console.error(`Error importing record to ${tableName}:`, e);
    }
  }

  console.log(`Migrated ${transformedData.length} records to ${tableName}`);
}

async function main() {
  await authPocketBase();
  for (const table of tables) {
    await migrateTable(table);
  }
  console.log('Migration complete.');
}

main().catch(console.error);
