// Test script untuk CCR Silo Data - otomatis versi pertama pembaruan
const PocketBase = require('pocketbase/cjs');

// Konfigurasi untuk koneksi
const SERVER_URL = process.env.VITE_POCKETBASE_URL || 'http://141.11.25.69:8090';
const EMAIL = process.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const PASSWORD = process.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';

// Struktur test untuk CCR Silo data
async function testCcrSiloData() {
  console.log(`Connecting to PocketBase at ${SERVER_URL}`);
  console.log(`Using credentials: ${EMAIL}`);

  const pb = new PocketBase(SERVER_URL);

  try {
    // Test 1: Autentikasi Admin
    console.log('\nTest 1: Melakukan autentikasi admin');
    try {
      const authData = await pb.admins.authWithPassword(EMAIL, PASSWORD);
      console.log('✓ Autentikasi berhasil');
      console.log('  Token:', pb.authStore.token.substring(0, 50) + '...');
      console.log('  Admin ID:', pb.authStore.model.id);
    } catch (err) {
      console.error('✗ Autentikasi gagal:', err.message);
      console.error('  Detail:', err.data);
      process.exit(1);
    }

    // Test 2: Ambil Daftar Collection
    console.log('\nTest 2: Mengambil daftar collection');
    try {
      const collections = await pb.collections.getFullList();
      console.log(`✓ Berhasil mendapatkan ${collections.length} collections`);

      // Cari collection ccr_silo_data
      const ccrSiloCollection = collections.find((c) => c.name === 'ccr_silo_data');
      if (ccrSiloCollection) {
        console.log('  Collection ccr_silo_data ditemukan dengan ID:', ccrSiloCollection.id);
      } else {
        console.error('✗ Collection ccr_silo_data tidak ditemukan!');
        process.exit(1);
      }
    } catch (err) {
      console.error('✗ Gagal mengambil daftar collection:', err.message);
      process.exit(1);
    }

    // Test 3: Ambil Data Silo
    console.log('\nTest 3: Mengambil data silo dari database');
    try {
      const siloCapacities = await pb.collection('silo_capacities').getFullList();
      console.log(`✓ Berhasil mendapatkan ${siloCapacities.length} data kapasitas silo`);

      if (siloCapacities.length === 0) {
        console.error('  Warning: Tidak ada data silo_capacities di database');
      } else {
        // Tampilkan contoh data silo
        console.log('  Contoh data silo:', JSON.stringify(siloCapacities[0], null, 2));
      }
    } catch (err) {
      console.error('✗ Gagal mengambil data silo:', err.message);
    }

    // Test 4: Ambil Data CCR Silo
    console.log('\nTest 4: Mengambil data CCR Silo');
    const today = new Date().toISOString().split('T')[0];
    try {
      const filter = `date="${today}"`;
      const ccrSiloData = await pb.collection('ccr_silo_data').getList(1, 50, {
        filter,
        sort: '-created',
        expand: 'silo_id',
      });

      console.log(
        `✓ Berhasil mendapatkan ${ccrSiloData.totalItems} data CCR Silo untuk tanggal ${today}`
      );

      if (ccrSiloData.totalItems === 0) {
        console.log('  Tidak ada data untuk hari ini, membuat contoh data...');

        // Ambil satu silo untuk contoh
        const silos = await pb.collection('silo_capacities').getList(1, 1);
        if (silos.totalItems > 0) {
          const silo = silos.items[0];

          // Buat data contoh
          const newData = {
            date: today,
            silo_id: silo.id,
            unit_id: silo.unit_id || '',
            shift1: {
              emptySpace: 10,
              content: 90,
            },
            shift2: {
              emptySpace: 15,
              content: 85,
            },
            shift3: {
              emptySpace: 20,
              content: 80,
            },
          };

          // Simpan data contoh
          try {
            const createdData = await pb.collection('ccr_silo_data').create(newData);
            console.log('  ✓ Berhasil membuat data contoh:', createdData.id);
          } catch (createErr) {
            console.error('  ✗ Gagal membuat data contoh:', createErr.message);
          }
        } else {
          console.error('  ✗ Tidak ada silo untuk membuat data contoh');
        }
      } else {
        // Tampilkan contoh data
        console.log('  Contoh data CCR Silo:', JSON.stringify(ccrSiloData.items[0], null, 2));

        // Cek struktur data shift
        const item = ccrSiloData.items[0];
        console.log('\n  Struktur data shift:');
        console.log(`  shift1: ${JSON.stringify(item.shift1)}`);
        console.log(`  shift2: ${JSON.stringify(item.shift2)}`);
        console.log(`  shift3: ${JSON.stringify(item.shift3)}`);

        if (!item.shift1 || typeof item.shift1 !== 'object') {
          console.error('  ✗ Format shift1 tidak valid, seharusnya berupa object');
        }
      }
    } catch (err) {
      console.error('✗ Gagal mengambil data CCR Silo:', err.message);
    }

    // Test 5: Verifikasi izin akses
    console.log('\nTest 5: Memeriksa izin akses ke collection');
    try {
      const authData = await pb.collection('users').authWithPassword(EMAIL, PASSWORD);
      console.log('✓ Berhasil login sebagai user');

      try {
        const ccrSiloData = await pb.collection('ccr_silo_data').getList(1, 1);
        console.log(`✓ User memiliki akses ke collection ccr_silo_data`);
      } catch (err) {
        console.error('✗ User tidak memiliki akses ke collection ccr_silo_data:', err.message);
      }
    } catch (err) {
      console.log('  Info: Tidak dapat login sebagai user, hanya sebagai admin');
    }

    console.log('\nTesting selesai!');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  }
}

// Jalankan test
testCcrSiloData().catch(console.error);
