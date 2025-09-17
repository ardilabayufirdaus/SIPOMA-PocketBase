import { exportToExcelStyled } from './excelUtils';

// Test data untuk export Excel
const testData = [
  {
    Activity: 'Planning Phase',
    'Planned Start': '2025-01-01',
    'Planned End': '2025-01-15',
    'Actual Start': '2025-01-02',
    'Actual End': '2025-01-16',
    'Percent Complete': '100%',
  },
  {
    Activity: 'Development Phase',
    'Planned Start': '2025-01-16',
    'Planned End': '2025-02-15',
    'Actual Start': '2025-01-17',
    'Actual End': '',
    'Percent Complete': '75%',
  },
  {
    Activity: 'Testing Phase',
    'Planned Start': '2025-02-16',
    'Planned End': '2025-02-28',
    'Actual Start': '',
    'Actual End': '',
    'Percent Complete': '0%',
  },
];

const headers = [
  'Activity',
  'Planned Start',
  'Planned End',
  'Actual Start',
  'Actual End',
  'Percent Complete',
];

// Fungsi test export
export const testExportExcel = async () => {
  try {
    console.log('Testing Excel export...');
    await exportToExcelStyled(testData, 'test_project_tasks', 'Project Tasks', headers);
    console.log('✅ Excel export successful!');
    return true;
  } catch (error) {
    console.error('❌ Excel export failed:', error);
    return false;
  }
};

// Jalankan test jika di browser
if (typeof window !== 'undefined') {
  // Uncomment untuk test manual
  // testExportExcel();
}
