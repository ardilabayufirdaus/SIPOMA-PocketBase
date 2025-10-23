/**
 * Script otomatis untuk memeriksa seluruh lazy components
 * Script ini akan:
 * 1. Menganalisis App.tsx untuk menemukan semua lazy components
 * 2. Memeriksa file yang diimport oleh setiap lazy component
 * 3. Memvalidasi struktur ekspor yang benar
 * 4. Melaporkan masalah yang ditemukan
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Fungsi untuk membaca file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Fungsi untuk mencari lazy components di App.tsx
function findLazyComponentsInApp() {
  const appTsxPath = path.join(rootDir, 'App.tsx');
  const content = readFile(appTsxPath);
  if (!content) return [];

  // Regex untuk menemukan createSafeLazy calls
  const safeLazyRegex =
    /const\s+(\w+)\s*=\s*createSafeLazy\(\s*\(\)\s*=>\s*import\(['"](.+?)['"]\)/g;
  const components = [];
  let match;

  while ((match = safeLazyRegex.exec(content)) !== null) {
    components.push({
      name: match[1],
      importPath: match[2],
    });
  }

  return components;
}

// Fungsi untuk memvalidasi sebuah component
async function validateLazyComponent(component) {
  const { name, importPath } = component;

  // Resolusi path
  let resolvedPath;
  if (importPath.startsWith('./')) {
    resolvedPath = path.join(rootDir, importPath);
  } else {
    resolvedPath = path.join(rootDir, importPath);
  }

  // Periksa ekstensi file
  const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js'];
  let actualFilePath = null;

  for (const ext of possibleExtensions) {
    const filePath = `${resolvedPath}${ext}`;
    if (fs.existsSync(filePath)) {
      actualFilePath = filePath;
      break;
    }
  }

  if (!actualFilePath) {
    return {
      name,
      importPath,
      status: 'failed',
      errors: [
        `File not found: ${resolvedPath} with any of these extensions: ${possibleExtensions.join(', ')}`,
      ],
    };
  }

  // Periksa konflik ekstensi
  const basePath = resolvedPath;
  const conflictingFiles = possibleExtensions
    .map((ext) => `${basePath}${ext}`)
    .filter((filePath) => fs.existsSync(filePath));

  if (conflictingFiles.length > 1) {
    return {
      name,
      importPath,
      status: 'warning',
      errors: [
        `Multiple files with same name but different extensions: ${conflictingFiles.join(', ')}`,
      ],
    };
  }

  // Baca konten file
  const content = readFile(actualFilePath);
  if (!content) {
    return {
      name,
      importPath,
      status: 'failed',
      errors: [`Could not read file: ${actualFilePath}`],
    };
  }

  // Validasi ekspor default
  const hasDefaultExport = content.includes('export default');
  if (!hasDefaultExport) {
    return {
      name,
      importPath,
      status: 'failed',
      errors: [`Missing 'export default' in ${actualFilePath}`],
    };
  }

  // Validasi file kosong
  if (content.trim().length < 10) {
    return {
      name,
      importPath,
      status: 'warning',
      errors: [`File seems to be empty or very small: ${actualFilePath}`],
    };
  }

  return {
    name,
    importPath,
    status: 'success',
    filePath: actualFilePath,
  };
}

// Fungsi utama
async function main() {
  console.log('🔍 Mencari komponen lazy di App.tsx...');
  const lazyComponents = findLazyComponentsInApp();

  if (lazyComponents.length === 0) {
    console.log('❌ Tidak ditemukan komponen lazy di App.tsx');
    return;
  }

  console.log(`✅ Ditemukan ${lazyComponents.length} komponen lazy:`);
  lazyComponents.forEach((comp) => console.log(`   - ${comp.name} (${comp.importPath})`));

  console.log('\n🔍 Memvalidasi setiap komponen lazy...');

  const validationPromises = lazyComponents.map(validateLazyComponent);
  const validationResults = await Promise.all(validationPromises);

  // Output hasil
  const successful = validationResults.filter((result) => result.status === 'success');
  const warnings = validationResults.filter((result) => result.status === 'warning');
  const failures = validationResults.filter((result) => result.status === 'failed');

  console.log(`\n✅ ${successful.length} komponen valid:`);
  successful.forEach((result) => console.log(`   - ${result.name}`));

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} komponen dengan peringatan:`);
    warnings.forEach((result) => {
      console.log(`   - ${result.name}:`);
      result.errors.forEach((err) => console.log(`     * ${err}`));
    });
  }

  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} komponen gagal validasi:`);
    failures.forEach((result) => {
      console.log(`   - ${result.name}:`);
      result.errors.forEach((err) => console.log(`     * ${err}`));
    });
    process.exit(1);
  } else {
    console.log('\n🎉 Semua komponen lazy sudah valid!');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
