const PocketBase = require('pocketbase/cjs');

// Test script untuk verifikasi delete functionality
async function testDeleteFunctionality() {
  const pb = new PocketBase('http://127.0.0.1:8090');

  try {
    // Login sebagai admin
    await pb.admins.authWithPassword('admin@example.com', 'password123');

    console.log('Connected to PocketBase');

    // Test 1: Buat data test
    const testDate = '2024-01-15';
    const testSiloId = 'silo-001';

    console.log('Creating test data...');
    const testRecord = await pb.collection('ccr_silo_data').create({
      date: testDate,
      silo_id: testSiloId,
      shift1: {
        emptySpace: 10.5,
        content: 89.5,
      },
    });

    console.log('Test record created:', testRecord.id);

    // Test 2: Verifikasi data ada
    const records = await pb.collection('ccr_silo_data').getFullList({
      filter: `date="${testDate}" && silo_id="${testSiloId}"`,
    });

    console.log('Records found after creation:', records.length);
    if (records.length > 0) {
      console.log('Shift1 data:', records[0].shift1);
    }

    // Test 3: Simulasi delete emptySpace field
    console.log('Simulating delete of emptySpace field...');
    const updatedRecord = await pb.collection('ccr_silo_data').update(testRecord.id, {
      shift1: {
        content: 89.5,
        // emptySpace dihapus
      },
    });

    console.log('After deleting emptySpace:', updatedRecord.shift1);

    // Test 4: Simulasi delete semua fields dalam shift
    console.log('Simulating delete of all fields in shift1...');
    const finalRecord = await pb.collection('ccr_silo_data').update(testRecord.id, {
      shift1: {},
    });

    console.log('After clearing shift1:', finalRecord.shift1);

    // Test 5: Cleanup - hapus test record
    await pb.collection('ccr_silo_data').delete(testRecord.id);
    console.log('Test record cleaned up');

    console.log('✅ Delete functionality test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeleteFunctionality();
