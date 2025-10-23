import PocketBase from 'pocketbase';

// Inisialisasi koneksi PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// Fungsi utama untuk membuat indeks
async function createCcrParameterIndices() {
  try {
    console.log('Memulai pembuatan indeks untuk koleksi ccr_parameter_data...');

    // Membuat indeks untuk date
    console.log('Membuat indeks untuk date...');
    await pb.send('/api/collections/ccr_parameter_data/indexes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'idx_ccr_parameter_data_date',
        type: 'index',
        options: {
          fields: ['date'],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Indeks untuk date berhasil dibuat.');

    // Membuat indeks untuk parameter_id
    console.log('Membuat indeks untuk parameter_id...');
    await pb.send('/api/collections/ccr_parameter_data/indexes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'idx_ccr_parameter_data_parameter_id',
        type: 'index',
        options: {
          fields: ['parameter_id'],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Indeks untuk parameter_id berhasil dibuat.');

    // Membuat indeks gabungan untuk date dan parameter_id
    console.log('Membuat indeks gabungan untuk date dan parameter_id...');
    await pb.send('/api/collections/ccr_parameter_data/indexes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'idx_ccr_parameter_data_date_parameter',
        type: 'index',
        options: {
          fields: ['date', 'parameter_id'],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Indeks gabungan untuk date dan parameter_id berhasil dibuat.');

    // Membuat indeks untuk plant_unit
    console.log('Membuat indeks untuk plant_unit...');
    await pb.send('/api/collections/ccr_parameter_data/indexes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'idx_ccr_parameter_data_plant_unit',
        type: 'index',
        options: {
          fields: ['plant_unit'],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Indeks untuk plant_unit berhasil dibuat.');

    // Membuat indeks gabungan untuk date dan plant_unit
    console.log('Membuat indeks gabungan untuk date dan plant_unit...');
    await pb.send('/api/collections/ccr_parameter_data/indexes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'idx_ccr_parameter_data_date_unit',
        type: 'index',
        options: {
          fields: ['date', 'plant_unit'],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Indeks gabungan untuk date dan plant_unit berhasil dibuat.');

    console.log('Semua indeks berhasil dibuat!');
  } catch (error) {
    console.error('Error saat membuat indeks:', error);
  }
}

// Autentikasi admin (ganti dengan kredensial admin yang sesuai)
try {
  await pb.admins.authWithPassword('admin@example.com', 'password');
  console.log('Berhasil login sebagai admin.');

  // Buat indeks setelah autentikasi
  await createCcrParameterIndices();
} catch (authError) {
  console.error('Gagal autentikasi admin:', authError);
}
