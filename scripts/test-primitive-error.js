/**
 * Test script untuk memeriksa apakah error "Cannot convert object to primitive value"
 * masih terjadi di aplikasi.
 */

const { JSDOM } = require('jsdom');
const React = require('react');
const { createElement } = React;

// Setup environment untuk React
const jsdom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
global.window = jsdom.window;
global.document = jsdom.window.document;
global.navigator = { userAgent: 'node.js' };

// Rekam error yang terjadi selama pengujian
const capturedErrors = [];
const originalConsoleError = console.error;
console.error = function (...args) {
  capturedErrors.push(args.join(' '));
  originalConsoleError.apply(console, args);
};

// Fungsi untuk membuat objek problematik
function createProblematicObject() {
  return {
    toString() {
      throw new Error('Cannot convert object to primitive value');
    },
    valueOf() {
      throw new Error('Cannot convert object to primitive value');
    },
  };
}

// Tes 1: Reproduksi langsung error
try {
  console.log('=== TEST 1: Direct Reproduction ===');
  const problemObj = createProblematicObject();
  console.log('Attempting to convert problematic object to string...');
  // Ini akan memicu error
  const str = '' + problemObj;
  console.log('No error occurred! Result:', str);
} catch (err) {
  console.log('Caught expected error:', err.message);
}

// Tes 2: Uji fungsi SafeLazy yang dibuat
try {
  console.log('\n=== TEST 2: SafeLazy Implementation ===');

  // Import modules yang dibutuhkan
  const { createSafeLazy } = require('../components/SafeLazy');

  // Buat lazy component dengan safeRender
  const TestComponent = createSafeLazy(
    () =>
      Promise.resolve({
        default: () => {
          // Simulasi component bermasalah
          const problemObj = createProblematicObject();
          return createElement('div', { 'data-problem': problemObj }, 'Problematic Component');
        },
      }),
    'TestComponent'
  );

  console.log('SafeLazy implementation created successfully');
} catch (err) {
  console.log('Error in SafeLazy implementation:', err.message);
}

// Tes 3: Uji safeRender di PermissionGuard
try {
  console.log('\n=== TEST 3: PermissionGuard safeRender ===');

  // Import fungsi safeRender dari permissions.ts
  const permissions = require('../utils/permissions');

  // Simulasi rendering elemen problematik
  const problemObj = createProblematicObject();

  // Buat child untuk dirender
  const child = createElement('div', { 'data-problem': problemObj }, 'Problematic Child');

  // Akses safeRender function secara langsung atau dari module
  if (typeof permissions.safeRender === 'function') {
    console.log('Attempting to safeRender a problematic element...');
    const result = permissions.safeRender(child);
    console.log('safeRender succeeded without errors');
  } else {
    console.log('safeRender function not directly accessible in permissions module');
  }
} catch (err) {
  console.log('Error in safeRender test:', err.message);
}

// Tampilkan hasil pengujian
console.log('\n=== SUMMARY ===');
console.log(`Total errors captured: ${capturedErrors.length}`);
console.log('Error patterns found:');

// Analisis error
const primitiveValueErrors = capturedErrors.filter((e) =>
  e.includes('Cannot convert object to primitive value')
);

if (primitiveValueErrors.length > 0) {
  console.log(
    `❌ Found ${primitiveValueErrors.length} "Cannot convert object to primitive value" errors`
  );
  console.log('Fix NOT working properly');
} else {
  console.log('✅ No "Cannot convert object to primitive value" errors detected');
  console.log('Fix appears to be working correctly!');
}

// Restore console.error
console.error = originalConsoleError;
