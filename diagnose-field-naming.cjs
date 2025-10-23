/**
 * This is a diagnostic script to check field naming conventions between UI and database
 * in the CCR Silo Data module.
 */
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
  console.log('Checking field naming conventions in ccr_silo_data collection...');

  try {
    // Authenticate
    await pb.admins.authWithPassword(
      process.env.PB_ADMIN_EMAIL || 'admin@example.com',
      process.env.PB_ADMIN_PASSWORD || 'password'
    );

    // Get schema of ccr_silo_data collection
    const collections = await pb.collections.getFullList();
    const ccrSiloDataCollection = collections.find((c) => c.name === 'ccr_silo_data');

    if (!ccrSiloDataCollection) {
      console.log('ERROR: ccr_silo_data collection not found');
      return;
    }

    console.log('Collection schema:');
    console.log(JSON.stringify(ccrSiloDataCollection.schema, null, 2));

    // Get some recent records
    const records = await pb.collection('ccr_silo_data').getList(1, 5, {
      sort: '-created',
    });

    if (records.items.length === 0) {
      console.log('No records found in ccr_silo_data');
      return;
    }

    // Check field names in the records
    console.log('\nAnalyzing field names in records:');
    records.items.forEach((record, index) => {
      console.log(`\nRecord ${index + 1} (ID: ${record.id}):`);

      // Check for flat field format
      const flatFields = Object.keys(record).filter(
        (key) =>
          key.startsWith('shift') && (key.includes('_empty_space') || key.includes('_content'))
      );

      console.log('Flat fields found:', flatFields);

      // Check for nested format fields (shouldn't exist in DB)
      const nestedFields = Object.keys(record).filter(
        (key) => key === 'shift1' || key === 'shift2' || key === 'shift3'
      );

      if (nestedFields.length > 0) {
        console.log('WARNING: Nested format fields found in DB:', nestedFields);
      } else {
        console.log('No nested fields found (good)');
      }

      // Output specific field values
      flatFields.forEach((field) => {
        console.log(`  ${field} = ${record[field]} (${typeof record[field]})`);
      });
    });

    console.log('\nDiagnostics complete');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
