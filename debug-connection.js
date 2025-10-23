/**
 * Debug utility for connection issues with PocketBase
 *
 * Untuk mendiagnosis masalah koneksi dan timeout dengan PocketBase:
 *
 * 1. Periksa apakah server PocketBase tersedia:
 *    - Pastikan URL PocketBase benar (http://141.11.25.69:8090)
 *    - Coba akses URL tersebut di browser
 *    - Periksa koneksi jaringan Anda
 *
 * 2. Jika masih menerima error "autocancellation":
 *    - Error ini muncul ketika request dibatalkan, biasanya karena timeout
 *    - Telah diimplementasikan retry logic untuk mengatasi ini
 *    - Perhatikan log untuk melihat request yang gagal
 *
 * 3. Untuk meningkatkan stabilitas koneksi:
 *    - Aplikasi telah dikonfigurasi ulang dengan timeout lebih panjang
 *    - Implementasi retry logic untuk mengatasi kegagalan sementara
 *    - Throttling request untuk mencegah overloading server
 *
 * 4. Periksa browser console untuk melihat log detail
 *    - Logger telah ditingkatkan untuk menampilkan informasi lebih jelas
 *    - Pesan error dengan "[ERROR]" menandakan masalah serius
 *    - Pesan dengan "[INFO]" hanya informasional
 *
 * 5. Jika masalah berlanjut:
 *    - Restart aplikasi dengan "npm run dev"
 *    - Hapus cache browser dan cookie
 *    - Pastikan server PocketBase berjalan dan dapat diakses
 */

// Cara mengaktifkan debug mode:
// 1. Buka browser console (F12)
// 2. Jalankan: localStorage.setItem('SIPOMA_DEBUG', 'true')
// 3. Refresh halaman

// Cara memeriksa status koneksi PocketBase:
// 1. Buka browser console (F12)
// 2. Jalankan:
/*
fetch('http://141.11.25.69:8090/api/health')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error)
*/

// Cara memeriksa status koneksi dengan retry:
/*
async function checkConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('http://141.11.25.69:8090/api/health', {
        signal: AbortSignal.timeout(5000) // 5 detik timeout
      });
      const data = await res.json();
      console.log(`Connection successful on attempt ${i+1}:`, data);
      return true;
    } catch (err) {
      console.warn(`Connection attempt ${i+1} failed:`, err);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000)); // Tunggu 1 detik sebelum retry
      }
    }
  }
  console.error(`Failed after ${retries} attempts`);
  return false;
}

// Jalankan dengan: checkConnection()
*/

