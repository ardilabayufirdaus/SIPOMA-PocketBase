// Quick test for formatDateWithDay
import { formatDateWithDay } from './utils/formatters';

console.log('Testing formatDateWithDay:');
console.log(formatDateWithDay('2024-10-06')); // Should show "Minggu, 06/10/2024" or similar
console.log(formatDateWithDay(new Date('2024-10-07'))); // Should show "Senin, 07/10/2024"
