const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = 'http://141.11.25.69:8090';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin (you need to set these env vars or replace with actual values)
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function authPocketBase() {
  try {
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authenticated with PocketBase');
  } catch (error) {
    console.error('❌ PocketBase auth failed:', error.message);
    console.log(
      '⚠️  Pastikan POCKETBASE_EMAIL dan POCKETBASE_PASSWORD sudah di-set di environment variables'
    );
    process.exit(1);
  }
}

// Collection schemas based on TypeScript types and hook usage
const collections = [
  {
    name: 'cop_parameters',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'parameter_ids', type: 'json', required: true },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
  {
    name: 'parameter_settings',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'parameter', type: 'text', required: true },
      {
        name: 'data_type',
        type: 'select',
        required: true,
        options: { values: ['Number', 'Text'] },
      },
      { name: 'unit', type: 'text', required: true },
      { name: 'category', type: 'text', required: true },
      { name: 'min_value', type: 'number' },
      { name: 'max_value', type: 'number' },
      { name: 'opc_min_value', type: 'number' },
      { name: 'opc_max_value', type: 'number' },
      { name: 'pcc_min_value', type: 'number' },
      { name: 'pcc_max_value', type: 'number' },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
  {
    name: 'silo_capacities',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'plant_category', type: 'text', required: true },
      { name: 'unit', type: 'text', required: true },
      { name: 'silo_name', type: 'text', required: true },
      { name: 'capacity', type: 'number', required: true },
      { name: 'dead_stock', type: 'number', required: true },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
  {
    name: 'report_settings',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'parameter_id', type: 'text', required: true },
      { name: 'category', type: 'text', required: true },
      { name: 'order', type: 'number', required: true },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
  {
    name: 'pic_settings',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'pic', type: 'text', required: true },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
];

async function createCollection(collection) {
  try {
    console.log(`📦 Membuat collection: ${collection.name}`);
    await pb.collections.create(collection);
    console.log(`✅ Collection ${collection.name} berhasil dibuat`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Collection ${collection.name} sudah ada, dilewati`);
    } else {
      console.error(`❌ Error membuat collection ${collection.name}:`, error.message);
    }
  }
}

async function createDefaultRecords() {
  console.log('📝 Membuat record default untuk cop_parameters...');

  try {
    // Check if default record exists
    const existing = await pb
      .collection('cop_parameters')
      .getFirstListItem('id="default"', { requestKey: null });
    console.log('⚠️  Record default cop_parameters sudah ada');
  } catch (error) {
    if (error.status === 404) {
      // Create default record
      await pb.collection('cop_parameters').create({
        id: 'default',
        parameter_ids: [],
      });
      console.log('✅ Record default cop_parameters berhasil dibuat');
    } else {
      console.error('❌ Error checking default record:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Memulai inisialisasi PocketBase collections...\n');

  await authPocketBase();

  for (const collection of collections) {
    await createCollection(collection);
  }

  await createDefaultRecords();

  console.log('\n🎉 Inisialisasi selesai! Collections siap digunakan.');
}

main().catch(console.error);
