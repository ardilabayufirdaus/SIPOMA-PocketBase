const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('https://api.sipoma.site');

async function createDefaultRecord() {
  console.log('🚀 Mencoba membuat record default di cop_parameters...');

  try {
    // Coba buat record default
    const record = await pb.collection('cop_parameters').create({
      id: 'default',
      parameter_ids: [],
    });

    console.log('✅ Record default berhasil dibuat:', record);
  } catch (error) {
    if (error.status === 400 && error.message?.includes('already exists')) {
      console.log('⚠️  Record default sudah ada');
    } else {
      console.error('❌ Gagal membuat record default:', error.message);
      console.log('💡 Kemungkinan perlu buat manual di PocketBase Admin Panel');
      console.log('   1. Buka https://api.sipoma.site/_/');
      console.log('   2. Collections → cop_parameters → New Record');
      console.log('   3. ID: default, parameter_ids: []');
    }
  }
}

createDefaultRecord().catch(console.error);
