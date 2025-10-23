import PocketBase from 'pocketbase';

// Inisialisasi koneksi PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// Fungsi untuk membuat indeks setelah data duplikat dihapus
async function createParameterIndices() {
  try {
    console.log('Memulai pembuatan indeks untuk koleksi ccr_parameter_data...');

    // Login sebagai admin
    await pb.admins.authWithPassword(
      'your-admin-email@example.com', // Ganti dengan email admin Anda
      'your-admin-password' // Ganti dengan password admin Anda
    );

    // Buat indeks reguler dulu
    console.log('1. Membuat indeks untuk date...');
    try {
      await pb.collection('ccr_parameter_data').createIndex({
        name: 'idx_ccr_parameter_data_date',
        type: 'index',
        options: { fields: ['date'] },
      });
      console.log('✓ Indeks date berhasil dibuat');
    } catch (error) {
      console.error('✗ Gagal membuat indeks date:', error.message);
    }

    console.log('2. Membuat indeks untuk parameter_id...');
    try {
      await pb.collection('ccr_parameter_data').createIndex({
        name: 'idx_ccr_parameter_data_parameter_id',
        type: 'index',
        options: { fields: ['parameter_id'] },
      });
      console.log('✓ Indeks parameter_id berhasil dibuat');
    } catch (error) {
      console.error('✗ Gagal membuat indeks parameter_id:', error.message);
    }

    console.log('3. Membuat indeks untuk plant_unit...');
    try {
      await pb.collection('ccr_parameter_data').createIndex({
        name: 'idx_ccr_parameter_data_plant_unit',
        type: 'index',
        options: { fields: ['plant_unit'] },
      });
      console.log('✓ Indeks plant_unit berhasil dibuat');
    } catch (error) {
      console.error('✗ Gagal membuat indeks plant_unit:', error.message);
    }

    console.log('4. Membuat indeks gabungan untuk date dan plant_unit...');
    try {
      await pb.collection('ccr_parameter_data').createIndex({
        name: 'idx_ccr_parameter_data_date_unit',
        type: 'index',
        options: { fields: ['date', 'plant_unit'] },
      });
      console.log('✓ Indeks gabungan date dan plant_unit berhasil dibuat');
    } catch (error) {
      console.error('✗ Gagal membuat indeks gabungan date dan plant_unit:', error.message);
    }

    // Terakhir, buat indeks unik untuk kombinasi date dan parameter_id
    // Ini harus dilakukan terakhir setelah data duplikat dihapus
    console.log('5. Membuat indeks unik untuk date dan parameter_id...');
    try {
      await pb.collection('ccr_parameter_data').createIndex({
        name: 'idx_ccr_parameter_data_date_param_unique',
        type: 'unique', // Tipe unik untuk memastikan tidak ada duplikat
        options: { fields: ['date', 'parameter_id'] },
      });
      console.log('✓ Indeks unik date dan parameter_id berhasil dibuat');
    } catch (error) {
      console.error('✗ Gagal membuat indeks unik date dan parameter_id:');
      console.error('  Detail error:', error.message);
      console.error('  Ini berarti masih ada data duplikat dalam database.');
      console.error('  Jalankan script fix-ccr-parameter-duplicates-enhanced.mjs terlebih dahulu.');
    }

    console.log('Pembuatan indeks selesai!');
  } catch (error) {
    console.error('Error umum:', error);
  }
}

// Jalankan fungsi utama
createParameterIndices();
