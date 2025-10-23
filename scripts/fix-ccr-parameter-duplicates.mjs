import PocketBase from 'pocketbase';

// Inisialisasi koneksi PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// Fungsi untuk memeriksa dan menghapus data duplikat
async function findAndRemoveDuplicates() {
  try {
    console.log('Mencari data duplikat dalam ccr_parameter_data...');

    // Login sebagai admin
    await pb.admins.authWithPassword(
      'your-admin-email@example.com', // Ganti dengan email admin Anda
      'your-admin-password' // Ganti dengan password admin Anda
    );

    // Ambil semua data parameter
    const records = await pb.collection('ccr_parameter_data').getFullList({
      sort: 'date,parameter_id',
    });

    console.log(`Total records: ${records.length}`);

    // Map untuk mengelompokkan data berdasarkan kunci unik
    const uniqueRecords = new Map();
    const duplicates = [];

    // Temukan duplikat berdasarkan kombinasi unik date+parameter_id
    records.forEach((record) => {
      const key = `${record.date}-${record.parameter_id}`;

      if (!uniqueRecords.has(key)) {
        uniqueRecords.set(key, record);
      } else {
        // Ini adalah duplikat
        duplicates.push(record);
      }
    });

    console.log(`Menemukan ${duplicates.length} data duplikat.`);

    // Hapus data duplikat
    if (duplicates.length > 0) {
      console.log('Menghapus data duplikat...');

      for (const duplicate of duplicates) {
        console.log(
          `Menghapus duplikat: ID=${duplicate.id}, Date=${duplicate.date}, Parameter=${duplicate.parameter_id}`
        );
        await pb.collection('ccr_parameter_data').delete(duplicate.id);
      }

      console.log('Selesai menghapus data duplikat.');
    } else {
      console.log('Tidak ada data duplikat yang ditemukan.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Jalankan fungsi
findAndRemoveDuplicates();
