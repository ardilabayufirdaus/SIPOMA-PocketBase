/**
 * Test script to verify flat field schema handling for CCR Silo Data
 */
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

// Test functions
async function testFlatFieldSchema() {
  console.log('Starting CCR silo data flat field schema test...');

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(
      process.env.PB_ADMIN_EMAIL || 'admin@example.com',
      process.env.PB_ADMIN_PASSWORD || 'password'
    );
    console.log('Authenticated as admin');

    // Generate test data
    const testDate = new Date().toISOString().split('T')[0];
    const testSiloId = await getOrCreateTestSilo();
    const testPlantUnit = 'PT_SAMATOR';

    console.log(
      `Using test data: date=${testDate}, siloId=${testSiloId}, plantUnit=${testPlantUnit}`
    );

    // Create a record with flat fields
    const createData = {
      date: testDate,
      silo_id: testSiloId,
      unit_id: testPlantUnit,
      shift1_empty_space: 100,
      shift1_content: 200,
      shift2_empty_space: 150,
      shift2_content: 250,
      shift3_empty_space: 175,
      shift3_content: 275,
    };

    // Create the record
    console.log('Creating record with flat fields:', createData);
    const createdRecord = await pb.collection('ccr_silo_data').create(createData);
    console.log('Created record:', createdRecord.id);

    // Retrieve the record
    const retrievedRecord = await pb.collection('ccr_silo_data').getOne(createdRecord.id);
    console.log('Retrieved record:');
    console.log(JSON.stringify(retrievedRecord, null, 2));

    // Verify all flat fields are present
    console.log('\nVerifying flat fields:');
    Object.keys(createData).forEach((key) => {
      if (key.startsWith('shift')) {
        console.log(`${key}: Expected=${createData[key]}, Actual=${retrievedRecord[key]}`);
      }
    });

    // Update a specific flat field
    const updateData = {
      shift2_empty_space: 999,
    };

    console.log('\nUpdating field:', updateData);
    const updatedRecord = await pb.collection('ccr_silo_data').update(createdRecord.id, updateData);

    console.log('Updated field result:');
    console.log(`shift2_empty_space: Expected=999, Actual=${updatedRecord.shift2_empty_space}`);

    // Delete the test record
    await pb.collection('ccr_silo_data').delete(createdRecord.id);
    console.log('\nTest record deleted');

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Helper function to get or create a test silo
async function getOrCreateTestSilo() {
  // Try to get an existing silo
  const silos = await pb.collection('silos').getFullList({
    sort: 'created',
    filter: 'silo_name~"Test"',
  });

  if (silos.length > 0) {
    return silos[0].id;
  }

  // Create a test silo if none exists
  const unitRecord = await getOrCreateTestUnit();

  const newSilo = await pb.collection('silos').create({
    silo_name: 'Test Silo',
    capacity: 1000,
    unit: unitRecord.id,
    active: true,
  });

  return newSilo.id;
}

// Helper function to get or create a test unit
async function getOrCreateTestUnit() {
  // Try to get PT_SAMATOR unit
  const units = await pb.collection('units').getFullList({
    filter: 'unit_id="PT_SAMATOR"',
  });

  if (units.length > 0) {
    return units[0];
  }

  // Create the unit if it doesn't exist
  const newUnit = await pb.collection('units').create({
    unit_id: 'PT_SAMATOR',
    unit_name: 'PT SAMATOR',
    active: true,
  });

  return newUnit;
}

// Run the test
testFlatFieldSchema();
