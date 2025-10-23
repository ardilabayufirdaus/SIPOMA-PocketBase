/**
 * Utility untuk mendeteksi dan memperbaiki error di aplikasi SIPOMA
 *
 * Script ini digunakan untuk mendiagnosis dan memperbaiki masalah umum
 * yang dapat terjadi dalam aplikasi
 */

import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Dapatkan __dirname (untuk ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Konfigurasi
const config = {
  pocketbaseUrl: process.env.VITE_POCKETBASE_URL || 'http://141.11.25.69:8090',
  guestUsername: process.env.VITE_GUEST_USERNAME || 'guest',
  guestPassword: process.env.VITE_GUEST_PASSWORD || 'guest123',
};

// Inisialisasi PocketBase
const pb = new PB(config.pocketbaseUrl);

// Logging utility
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warning: (message) => console.warn(`[WARNING] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
};

// Fungsi untuk cek kesehatan koneksi PocketBase
async function checkPocketBaseConnection() {
  logger.info('Memeriksa koneksi ke PocketBase...');

  try {
    // Coba login sebagai guest user
    await pb.collection('users').authWithPassword(config.guestUsername, config.guestPassword);

    logger.success('Koneksi ke PocketBase berhasil!');
    return true;
  } catch (error) {
    logger.error(`Koneksi ke PocketBase gagal: ${error.message}`);
    return false;
  }
}

// Fungsi untuk menganalisis lazy loading errors
async function analyzeLazyLoadingErrors() {
  logger.info('Menganalisis potensi error di lazy loading component...');

  // Path ke direktori App.tsx dan file lazy loading terkait
  const appFilePath = path.join(__dirname, 'App.tsx');

  try {
    const appContent = fs.readFileSync(appFilePath, 'utf-8');

    // Cek pola yang dapat menyebabkan error
    const lazyImportRegex = /const\s+(\w+)\s+=\s+lazy\(\(\)\s+=>\s+import\(['"](.+)['"]\)/g;
    const matches = [...appContent.matchAll(lazyImportRegex)];

    if (matches.length === 0) {
      logger.warning('Tidak ditemukan lazy loaded component di App.tsx');
      return;
    }

    logger.info(`Ditemukan ${matches.length} lazy loaded component`);

    // Analisis setiap lazy component
    for (const match of matches) {
      const [, componentName, importPath] = match;

      // Periksa apakah file yang di-import ada
      const resolvedPath = path.join(__dirname, importPath.replace(/^\.\//, ''));

      if (
        !fs.existsSync(resolvedPath) &&
        !fs.existsSync(`${resolvedPath}.tsx`) &&
        !fs.existsSync(`${resolvedPath}.ts`)
      ) {
        logger.error(`Component ${componentName} mengimport file yang tidak ada: ${importPath}`);
      } else {
        logger.success(`Component ${componentName} mengimport file yang valid: ${importPath}`);
      }
    }
  } catch (error) {
    logger.error(`Error saat menganalisis lazy loading: ${error.message}`);
  }
}

// Fungsi untuk memeriksa penggunaan PermissionGuard dengan Lazy component
async function checkPermissionGuardWithLazyComponent() {
  logger.info('Memeriksa penggunaan PermissionGuard dengan lazy component...');

  try {
    // Cari semua file .tsx di direktori utama dan subdirektori
    const checkFile = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Cek pola penggunaan PermissionGuard dengan children non-valid
      const permissionGuardRegex = /<PermissionGuard[^>]*>\s*(?:{([^}]+)}|<([^>]+)>)/g;
      const matches = [...content.matchAll(permissionGuardRegex)];

      if (matches.length > 0) {
        logger.info(`Ditemukan ${matches.length} penggunaan PermissionGuard di ${filePath}`);

        for (const match of matches) {
          const [fullMatch, objectContent, validContent] = match;

          // Cek jika menggunakan object sebagai children (potensial error)
          if (
            objectContent &&
            objectContent.includes(':') &&
            !objectContent.includes('React.') &&
            !objectContent.includes('<')
          ) {
            logger.error(
              `Potensi error di ${filePath}: PermissionGuard dengan children berupa object: ${objectContent}`
            );
          }
        }
      }
    };

    // Fungsi rekursif untuk scan direktori
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          checkFile(filePath);
        }
      }
    };

    scanDir(__dirname);
  } catch (error) {
    logger.error(`Error saat memeriksa penggunaan PermissionGuard: ${error.message}`);
  }
}

// Fungsi utama
async function main() {
  logger.info('Memulai diagnosa sistem SIPOMA...');

  // Cek koneksi ke PocketBase
  const connectionOk = await checkPocketBaseConnection();

  if (!connectionOk) {
    logger.warning(
      'Mendeteksi masalah koneksi PocketBase. Mohon periksa konfigurasi dan koneksi internet.'
    );
  }

  // Analisis lazy loading errors
  await analyzeLazyLoadingErrors();

  // Cek penggunaan PermissionGuard
  await checkPermissionGuardWithLazyComponent();

  logger.info('Diagnosa selesai. Periksa output di atas untuk detail hasil.');
}

// Jalankan fungsi utama
main().catch((error) => {
  logger.error(`Error tidak terduga: ${error.message}`);
  process.exit(1);
});

