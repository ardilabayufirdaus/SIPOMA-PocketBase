import PocketBase from 'pocketbase';

// Inisialisasi koneksi PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// Fungsi untuk menemukan dan menghapus data duplikat dengan penanganan yang lebih baik
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
      sort: 'created,-updated', // Diurutkan berdasarkan created dan updated (terbaru lebih dulu)
      fields: 'id,date,parameter_id,created,updated',
    });

    console.log(`Total records: ${records.length}`);

    // Buat map untuk mengelompokkan data berdasarkan kombinasi date+parameter_id
    const recordMap = new Map();
    const duplicates = [];
    const keepRecords = [];

    // Menemukan duplikat
    records.forEach((record) => {
      // Bersihkan format tanggal (hanya ambil YYYY-MM-DD)
      const cleanDate = record.date.split('T')[0];
      const key = `${cleanDate}_${record.parameter_id}`;

      // Jika belum ada record dengan key ini, simpan di map
      if (!recordMap.has(key)) {
        recordMap.set(key, record);
        keepRecords.push(record);
      } else {
        // Ini adalah duplikat
        duplicates.push(record);
      }
    });

    console.log(`Menemukan ${duplicates.length} data duplikat dari total ${records.length} data.`);

    // Hapus data duplikat
    if (duplicates.length > 0) {
      console.log('Menghapus data duplikat...');

      let deleted = 0;
      for (const duplicate of duplicates) {
        try {
          console.log(
            `Menghapus: ID=${duplicate.id}, Date=${duplicate.date}, Parameter=${duplicate.parameter_id}`
          );
          await pb.collection('ccr_parameter_data').delete(duplicate.id);
          deleted++;
        } catch (err) {
          console.error(`Gagal menghapus ${duplicate.id}:`, err);
        }
      }

      console.log(`Berhasil menghapus ${deleted} dari ${duplicates.length} data duplikat.`);

      // Verifikasi bahwa tidak ada lagi duplikat
      try {
        const verifyRecords = await pb.collection('ccr_parameter_data').getFullList({
          fields: 'id,date,parameter_id',
        });

        const verifyMap = new Map();
        let remainingDuplicates = 0;

        verifyRecords.forEach((record) => {
          const cleanDate = record.date.split('T')[0];
          const key = `${cleanDate}_${record.parameter_id}`;

          if (!verifyMap.has(key)) {
            verifyMap.set(key, true);
          } else {
            remainingDuplicates++;
          }
        });

        if (remainingDuplicates > 0) {
          console.log(`PERINGATAN: Masih terdapat ${remainingDuplicates} duplikat!`);
          console.log('Jalankan script ini sekali lagi untuk menghapus semua duplikat.');
        } else {
          console.log('Verifikasi berhasil! Tidak ada lagi duplikat.');
          console.log('Anda sekarang dapat membuat indeks unik di database.');
        }
      } catch (verifyErr) {
        console.error('Gagal melakukan verifikasi:', verifyErr);
      }
    } else {
      console.log('Tidak ada data duplikat. Anda dapat membuat indeks unik sekarang.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Jalankan fungsi utama
findAndRemoveDuplicates();
