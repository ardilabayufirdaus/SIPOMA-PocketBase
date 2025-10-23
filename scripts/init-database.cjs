const PocketBase = require('pocketbase/cjs');

// Inisialisasi PocketBase client
const pb = new PocketBase('http://141.11.25.69:8090');

// Schema untuk collections yang diperlukan
const collectionSchemas = {
  cop_parameters: {
    name: 'cop_parameters',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'parameter_ids', type: 'json', required: true },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
  parameter_settings: {
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
  silo_capacities: {
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
  report_settings: {
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
  pic_settings: {
    name: 'pic_settings',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'pic', type: 'text', required: true },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
  work_instructions: {
    name: 'work_instructions',
    type: 'base',
    schema: [
      { name: 'id', type: 'text', required: true },
      { name: 'activity', type: 'text', required: true },
      { name: 'doc_code', type: 'text', required: true },
      { name: 'doc_title', type: 'text', required: true },
      { name: 'description', type: 'text', required: true },
      { name: 'link', type: 'text', required: true },
      { name: 'plant_category', type: 'text', required: true },
      { name: 'plant_unit', type: 'text', required: true },
      { name: 'created', type: 'date' },
      { name: 'updated', type: 'date' },
    ],
  },
};

// Fungsi untuk mengecek apakah collection ada (tidak perlu admin auth)
async function checkCollectionExists(collectionName) {
  try {
    // Coba get list dari collection (tidak perlu admin auth untuk read)
    await pb.collection(collectionName).getList(1, 1);
    console.log(`✅ Collection ${collectionName} sudah ada`);
    return true;
  } catch (error) {
    if (error.status === 404) {
      console.log(`❌ Collection ${collectionName} tidak ada`);
      return false; // Collection tidak ada
    }
    // Error lain (misal auth), anggap collection ada untuk safety
    console.log(`⚠️  Tidak dapat memverifikasi collection ${collectionName}, mengasumsikan ada`);
    return true;
  }
}

// Fungsi untuk mengecek record default di cop_parameters
async function checkDefaultRecord() {
  try {
    console.log('🔍 Mengecek record qisg1822jn43kcy di cop_parameters...');
    const record = await pb.collection('cop_parameters').getOne('qisg1822jn43kcy');
    console.log('✅ Record qisg1822jn43kcy ditemukan:', record);
    return true;
  } catch (error) {
    if (error.status === 404) {
      console.log('❌ Record qisg1822jn43kcy tidak ditemukan di cop_parameters');
      return false;
    }
    console.error('❌ Error mengecek record qisg1822jn43kcy:', error.message);
    return false;
  }
}

// Fungsi untuk membuat collection
async function createCollectionIfNotExists(schema) {
  try {
    console.log(`🔍 Mengecek collection: ${schema.name}`);

    // Cek apakah collection sudah ada dengan cara yang tidak perlu admin auth
    const exists = await checkCollectionExists(schema.name);

    if (exists) {
      console.log(`✅ Collection ${schema.name} sudah ada`);
      return;
    }

    // Collection tidak ada, coba buat (perlu admin auth)
    console.log(`📦 Membuat collection: ${schema.name}`);

    try {
      await pb.collections.create(schema);
      console.log(`✅ Collection ${schema.name} berhasil dibuat`);

      // Buat record default untuk cop_parameters
      if (schema.name === 'cop_parameters') {
        try {
          await pb.collection('cop_parameters').create({
            id: 'qisg1822jn43kcy',
            parameter_ids: [],
          });
          console.log('✅ Record qisg1822jn43kcy cop_parameters berhasil dibuat');
        } catch (recordError) {
          console.log('⚠️  Record qisg1822jn43kcy mungkin sudah ada:', recordError.message);
        }
      }
    } catch (createError) {
      console.error(`❌ Gagal membuat collection ${schema.name}:`, createError.message);
      console.log('💡 Pastikan Anda login sebagai admin di PocketBase');
    }
  } catch (error) {
    console.error(`❌ Error mengecek collection ${schema.name}:`, error.message);
  }
}

// Fungsi utama
async function initializeDatabase() {
  console.log('🚀 Memulai inisialisasi database PocketBase...\n');

  // Coba auth sebagai admin jika credentials tersedia
  const adminEmail = process.env.POCKETBASE_EMAIL;
  const adminPassword = process.env.POCKETBASE_PASSWORD;

  if (adminEmail && adminPassword) {
    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('✅ Berhasil login sebagai admin');
    } catch (authError) {
      console.log('⚠️  Gagal login sebagai admin, melanjutkan tanpa auth');
    }
  } else {
    console.log('⚠️  Tidak ada credentials admin, mencoba operasi tanpa auth');
  }

  // Buat collections satu per satu
  for (const schema of Object.values(collectionSchemas)) {
    await createCollectionIfNotExists(schema);
  }

  // Cek record default di cop_parameters
  await checkDefaultRecord();

  console.log('\n🎉 Inisialisasi database selesai!');
  console.log('💡 Jika ada collection yang gagal dibuat, buat manual di PocketBase Admin Panel');
}

// Export untuk digunakan sebagai module
// export { initializeDatabase }; // Commented out for CommonJS

// Jalankan jika file ini dieksekusi langsung
if (require.main === module) {
  initializeDatabase().catch(console.error);
}
