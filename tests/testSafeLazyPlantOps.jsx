/**
 * Test untuk SafeLazy dan PlantOperationsPage
 * File ini menguji integrasi antara SafeLazy dan import PlantOperationsPage
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createSafeLazy } from './components/SafeLazy';

// Fungsi untuk melakukan tes
function testSafeLazyImport() {
  console.log('Memulai tes SafeLazy dengan PlantOperationsPage...');

  try {
    // Buat elemen root untuk mounting
    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);

    // Setup log handler untuk menangkap error
    const errors = [];
    const originalConsoleError = console.error;
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalConsoleError.apply(console, args);
    };

    // Buat komponen dengan SafeLazy
    const PlantOpsTest = createSafeLazy(
      () => import('./pages/PlantOperationsPage'),
      'PlantOperationsPageTest',
      <div>Loading...</div>,
      <div>Error loading component</div>
    );

    // Render komponen ke DOM
    const root = createRoot(rootElement);
    root.render(<PlantOpsTest activePage="op_dashboard" t={{}} />);

    // Restore console error
    console.error = originalConsoleError;

    // Report hasil
    console.log(`Tes selesai dengan ${errors.length} error`);
    if (errors.length > 0) {
      console.error('Errors captured:', errors);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Uncaught error:', error);
    return false;
  }
}

// Export fungsi tes untuk digunakan dari command line atau modul lain
export { testSafeLazyImport };
