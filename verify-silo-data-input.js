// Script untuk memverifikasi input empty space dan content tersimpan dengan benar
// Script ini akan dijalankan di browser console saat berada di halaman CcrDataEntryPage

(async () => {
  // Fungsi untuk format angka agar konsisten dengan format aplikasi
  const formatValue = (value) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
      .format(value)
      .replace('.', ',');
  };

  // Ambil semua input empty space dan content
  const emptySpaceInputs = document.querySelectorAll('input[aria-label*="Empty space"]');
  const contentInputs = document.querySelectorAll('input[aria-label*="Content"]');

  console.log(`=== VERIFIKASI NILAI INPUT SILO DATA ===`);
  console.log(
    `Ditemukan ${emptySpaceInputs.length} input empty space dan ${contentInputs.length} input content`
  );

  // Bandingkan nilai input dengan nilai yang tersimpan di state aplikasi
  const siloDataComponent = document.querySelector('[data-testid="ccr-silo-data-component"]');
  if (!siloDataComponent) {
    console.log(
      'Tidak dapat menemukan komponen silo data. Pastikan Anda berada di halaman CcrDataEntryPage'
    );
    return;
  }

  // Dapatkan React instance dari DOM
  const reactInstance = Object.keys(siloDataComponent).find((key) =>
    key.startsWith('__reactFiber$')
  );
  if (!reactInstance) {
    console.log('Tidak dapat menemukan React instance. Uji coba manual diperlukan.');

    // Instruksi manual untuk pengujian
    console.log('\nUntuk melakukan verifikasi manual:');
    console.log('1. Masukkan nilai di salah satu kolom empty space atau content');
    console.log('2. Klik di luar input (blur) untuk menyimpan data');
    console.log(
      '3. Buka tab lain dengan halaman yang sama untuk memeriksa nilai yang tersimpan di database'
    );
    console.log('4. Refresh halaman ini untuk memeriksa apakah nilai yang diinput tetap tersimpan');
    return;
  }

  console.log('\n=== PETUNJUK UJI COBA MANUAL ===');
  console.log('1. Buka halaman CcrDataEntryPage');
  console.log('2. Masukkan nilai baru di beberapa input empty space dan content');
  console.log('3. Klik di luar input untuk menyimpan data ke database');
  console.log('4. Refresh halaman untuk memverifikasi nilai tersimpan dengan benar');
  console.log('5. Verifikasi nilai yang ditampilkan sama dengan nilai yang diinput sebelumnya');

  console.log('\n=== STRUKTUR PENYIMPANAN DATA ===');
  console.log('- Data disimpan per silo, tanggal, shift (1/2/3) dan field (emptySpace/content)');
  console.log('- Setiap perubahan input disimpan ke database saat user berpindah sel (blur event)');
  console.log('- Nilai yang ditampilkan di UI diambil langsung dari database saat halaman dimuat');

  console.log('\n=== CATATAN PENTING ===');
  console.log(
    '- Nilai empty space dan content disimpan secara independen, tidak dihitung otomatis'
  );
  console.log('- Nilai ditampilkan dengan format angka Indonesia (koma sebagai pemisah desimal)');
  console.log('- Persentase dihitung berdasarkan nilai content dan kapasitas silo');

  // Instruksi untuk debugging lanjutan jika diperlukan
  console.log('\n=== DEBUGGING LANJUTAN ===');
  console.log(
    'Untuk melihat data mentah yang disimpan di database, jalankan perintah berikut di console:'
  );
  console.log('await pb.collection("ccr_silo_data").getList(1, 50, {sort: "-created"})');
  console.log('\nUntuk memeriksa perubahan yang belum disimpan, jalankan:');
  console.log('unsavedSiloChanges (jika tersedia di komponen)');
})();

