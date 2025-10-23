/**
 * This script checks for any data inconsistencies between UI displayed data
 * and the database contents for ccr_silo_data collection
 */
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
  console.log('Checking for data inconsistencies in CCR Silo Data module...');

  try {
    // Authenticate
    await pb.admins.authWithPassword(
      process.env.PB_ADMIN_EMAIL || 'admin@example.com',
      process.env.PB_ADMIN_PASSWORD || 'password'
    );

    // 1. Get the latest 5 ccr_silo_data records
    console.log('\nFetching latest ccr_silo_data records...');
    const records = await pb.collection('ccr_silo_data').getList(1, 5, {
      sort: '-created',
    });

    if (records.items.length === 0) {
      console.log('No records found in ccr_silo_data');
      return;
    }

    // 2. Analyze flat field structure
    console.log('\nAnalyzing flat field structure:');
    for (const record of records.items) {
      console.log(`\nRecord ID: ${record.id}`);
      console.log(`Date: ${record.date}, Silo ID: ${record.silo_id}`);

      // Find all shift flat fields
      const shiftFields = Object.keys(record).filter(
        (key) =>
          key.startsWith('shift') && (key.includes('_empty_space') || key.includes('_content'))
      );

      console.log('Shift fields:');
      shiftFields.forEach((field) => {
        console.log(`  ${field} = ${record[field]} (${typeof record[field]})`);
      });

      // Check if unit_id and plant_unit are both set properly
      console.log('Unit fields:');
      console.log(`  unit_id = ${record.unit_id}`);
      console.log(`  plant_unit = ${record.plant_unit}`);

      // Any potential issues
      if (!record.unit_id) {
        console.log('  WARNING: Missing unit_id field');
      }

      if (record.unit_id !== record.plant_unit && record.plant_unit) {
        console.log("  WARNING: unit_id and plant_unit don't match");
      }

      // Check shift fields format
      const shifts = [1, 2, 3];
      const fieldTypes = ['empty_space', 'content'];

      // Check for missing expected fields
      shifts.forEach((shift) => {
        fieldTypes.forEach((type) => {
          const fieldName = `shift${shift}_${type}`;
          if (!shiftFields.includes(fieldName)) {
            console.log(`  WARNING: Missing expected field ${fieldName}`);
          }
        });
      });

      // Check for any nested structure fields (shouldn't be in DB)
      const nestedFields = Object.keys(record).filter((key) =>
        ['shift1', 'shift2', 'shift3'].includes(key)
      );

      if (nestedFields.length > 0) {
        console.log('  WARNING: Found nested fields in database:', nestedFields);
      }
    }

    console.log('\nDiagnosis complete');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
