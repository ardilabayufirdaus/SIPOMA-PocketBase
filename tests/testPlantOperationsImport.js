/**
 * Test modul import untuk PlantOperationsPage
 *
 * File ini digunakan untuk menguji apakah PlantOperationsPage
 * dapat dimuat dengan benar oleh sistem lazy-loading
 */

// Gunakan dynamic import untuk mensimulasikan lazy loading
async function testImport() {
  console.log('Memulai tes impor PlantOperationsPage...');

  try {
    // Coba impor modul
    const moduleImport = await import('../pages/PlantOperationsPage');

    // Periksa struktur modul
    console.log('Modul berhasil diimpor');
    console.log('Struktur modul:', {
      hasDefaultExport: !!moduleImport.default,
      moduleType: typeof moduleImport,
      moduleKeys: Object.keys(moduleImport),
      defaultExportType: typeof moduleImport.default,
    });

    // Periksa apakah default export adalah fungsi React component
    if (typeof moduleImport.default !== 'function') {
      console.error('Error: Default export bukan fungsi React component');
      return false;
    }

    // Periksa properti displayName jika ada
    if (moduleImport.default.displayName) {
      console.log('Component displayName:', moduleImport.default.displayName);
    }

    console.log('Tes berhasil: PlantOperationsPage dapat diimpor dengan benar');
    return true;
  } catch (error) {
    console.error('Error saat mengimpor PlantOperationsPage:', error);
    return false;
  }
}

// Jalankan tes
testImport()
  .then((success) => {
    if (success) {
      console.log('✓ Tes impor berhasil');
    } else {
      console.error('✗ Tes impor gagal');
    }
  })
  .catch((err) => {
    console.error('Terjadi kesalahan selama pengujian:', err);
  });

export default testImport;

