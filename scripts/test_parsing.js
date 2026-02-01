const parseInputValue = (formattedValue) => {
  if (!formattedValue || formattedValue.trim() === '') return null;

  let normalized = formattedValue.trim();

  // 1. Jika ada koma, maka dipastikan format Indonesia: titik=ribuan, koma=desimal
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, ''); // Hapus semua titik ribuan
    normalized = normalized.replace(',', '.'); // Ganti koma dengan titik desimal
  } else {
    // 2. Jika tidak ada koma, namun ada titik:
    // Kita harus hati-hati apakah titik ini ribuan (1.000) atau desimal (255.2)
    const dotCount = (normalized.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Lebih dari satu titik pasti ribuan (misal 1.000.000)
      normalized = normalized.replace(/\./g, '');
    } else if (dotCount === 1) {
      const parts = normalized.split('.');
      // Jika bagian setelah titik tepat 3 digit dan bagian sebelum titik bukan '0',
      // kemungkinan besar itu adalah titik ribuan (misal 1.000)
      if (parts[1].length === 3 && parts[0] !== '0' && parts[0] !== '') {
        normalized = normalized.replace(/\./g, '');
      } else {
        // Biarkan titiknya sebagai desimal (format JS/International atau 0.xxx)
      }
    }
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

const formatNumberWithPrecision = (num, precision = 1) => {
  if (num === null || num === undefined) {
    return precision > 0 ? '0,' + '0'.repeat(precision) : '0';
  }
  const formatted = num.toFixed(precision);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return precision > 0 ? parts.join(',') : parts[0];
};

const testCases = [
  { input: '72000', expected: 72000 },
  { input: '72.000', expected: 72000 },
  { input: '7.200', expected: 7200 },
  { input: '7,2', expected: 7.2 },
  { input: '0.123', expected: 0.123 },
  { input: '0,123', expected: 0.123 },
  { input: '1.000.000', expected: 1000000 },
  { input: '7.2000', expected: 7.2 }, // Note: this is US format since dot + 4 digits.
];

console.log('Testing Updated parseInputValue Logic:');
console.log('--------------------------------------');
testCases.forEach(({ input, expected }) => {
  const actual = parseInputValue(input);
  const status = actual === expected ? 'PASS' : 'FAIL';
  console.log(`Input: [${input}] -> Actual: [${actual}] -> Expected: [${expected}] [${status}]`);
});

// Scenario: Continuous typing 72000
console.log("\nSimulated Typing Sequence '72000':");
const typingSequence = ['7', '72', '720', '7.200', '7.2.000', '72.000'];
typingSequence.forEach((val) => {
  const parsed = parseInputValue(val);
  console.log(`Typed: [${val}] -> Parsed: [${parsed}]`);
});
