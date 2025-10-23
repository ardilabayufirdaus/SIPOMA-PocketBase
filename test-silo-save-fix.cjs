const PocketBase = require('pocketbase/cjs');

// Konfigurasi untuk koneksi
const SERVER_URL = 'http://141.11.25.69:8090';
const EMAIL = 'ardila.firdaus@sig.id';
const PASSWORD = 'makassar@270989';

// Test script to verify silo data saving functionality
async function testSiloDataSaving() {
  console.log('Testing silo data saving functionality...');

  const pb = new PocketBase(SERVER_URL);

  try {
    // Authenticate first
    console.log('Authenticating...');
    await pb.admins.authWithPassword(EMAIL, PASSWORD);
    console.log('Authentication successful');

    // Get a real silo first
    console.log('Getting real silo data...');
    const silos = await pb.collection('silo_capacities').getList(1, 1);
    if (silos.items.length === 0) {
      throw new Error('No silos found');
    }
    const silo = silos.items[0];
    console.log('Using silo:', silo.id, silo.silo_name, silo.unit);

    // Test data
    const testDate = new Date().toISOString().split('T')[0]; // Today's date
    const testSiloId = silo.id;
    const testUnitId = silo.unit || 'Cement Mill 419';

    console.log('Test parameters:', { testDate, testSiloId, testUnitId });

    // First, check if there's existing data
    console.log('Checking existing records...');
    const existingRecords = await pb.collection('ccr_silo_data').getList(1, 50, {
      filter: `date="${testDate}" && silo_id="${testSiloId}"`,
      sort: '-created',
    });

    console.log(`Found ${existingRecords.items.length} existing records`);

    if (existingRecords.items.length > 0) {
      // Update existing record
      const record = existingRecords.items[0];
      console.log('Updating existing record:', record.id);

      const updatedRecord = await pb.collection('ccr_silo_data').update(record.id, {
        shift1_empty_space: 100,
        shift1_content: 200,
        updated: new Date().toISOString(),
      });

      console.log('Update successful:', updatedRecord.id);
    } else {
      // Create new record
      console.log('Creating new record...');
      const newRecord = await pb.collection('ccr_silo_data').create({
        date: testDate,
        silo_id: testSiloId,
        unit_id: testUnitId,
        shift1_empty_space: 100,
        shift1_content: 200,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      });

      console.log('Create successful:', newRecord.id);
    }

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSiloDataSaving();
