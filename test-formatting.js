// Simple test to verify CCR numerical formatting
import { formatNumber, formatPercentage } from "../utils/formatters";

// Test cases for numerical formatting
console.log("=== CCR Numerical Formatting Tests ===");

// Test formatNumber function
console.log("\n--- formatNumber Tests ---");
console.log("formatNumber(1234.567):", formatNumber(1234.567)); // Expected: 1.234,6
console.log("formatNumber(0):", formatNumber(0)); // Expected: 0,0
console.log("formatNumber(999.5):", formatNumber(999.5)); // Expected: 999,5
console.log("formatNumber(1234567.89):", formatNumber(1234567.89)); // Expected: 1.234.567,9

// Test formatPercentage function
console.log("\n--- formatPercentage Tests ---");
console.log("formatPercentage(89.567):", formatPercentage(89.567)); // Expected: 89,6
console.log("formatPercentage(100.0):", formatPercentage(100.0)); // Expected: 100,0
console.log("formatPercentage(0.5):", formatPercentage(0.5)); // Expected: 0,5

// Test parseInputValue function (from CCR page)
const parseInputValue = (formattedValue) => {
  if (!formattedValue || formattedValue.trim() === "") return null;
  const normalized = formattedValue.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

console.log("\n--- parseInputValue Tests ---");
console.log('parseInputValue("1.234,5"):', parseInputValue("1.234,5")); // Expected: 1234.5
console.log('parseInputValue("999,5"):', parseInputValue("999,5")); // Expected: 999.5
console.log('parseInputValue("0,0"):', parseInputValue("0,0")); // Expected: 0

console.log("\n=== Tests Complete ===");
