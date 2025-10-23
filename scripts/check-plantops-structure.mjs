/**
 * Test untuk memvalidasi struktur PlantOperationsPage
 */

import fs from 'fs';
import path from 'path';

// Cek apakah file ada
const plantOpsPath = path.resolve('./pages/PlantOperationsPage.tsx');
console.log(`Checking if file exists at: ${plantOpsPath}`);
const fileExists = fs.existsSync(plantOpsPath);
console.log(`File exists: ${fileExists}`);

// Baca isi file untuk validasi struktur
if (fileExists) {
  const content = fs.readFileSync(plantOpsPath, 'utf-8');

  // Cek apakah ada export default
  const hasDefaultExport = content.includes('export default PlantOperationsPage');
  console.log(`Has default export: ${hasDefaultExport}`);

  // Cek apakah ada deklarasi komponen
  const hasComponentDeclaration = content.includes('const PlantOperationsPage');
  console.log(`Has component declaration: ${hasComponentDeclaration}`);

  // Validasi format
  if (hasDefaultExport && hasComponentDeclaration) {
    console.log('✅ PlantOperationsPage terlihat valid dari struktur kode');
  } else {
    console.error('❌ PlantOperationsPage mungkin memiliki masalah struktur');
    if (!hasDefaultExport) console.error('   - Missing default export');
    if (!hasComponentDeclaration) console.error('   - Missing component declaration');
  }
} else {
  console.error('❌ File PlantOperationsPage.tsx tidak ditemukan!');
}
