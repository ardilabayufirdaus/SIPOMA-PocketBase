// Test script untuk format waktu
import { pb } from './utils/pocketbase';
import { logger } from './utils/logger';

async function testTimeFormat() {
  try {
    // Pastikan PocketBase terhubung
    console.log('Connecting to PocketBase...');

    // Lihat skema koleksi
    const collections = await pb.collections.getFullList();
    const ccr_downtime_data = collections.find((c) => c.name === 'ccr_downtime_data');

    if (!ccr_downtime_data) {
      console.error('Collection ccr_downtime_data not found');
      return;
    }

    console.log('Collection schema:', JSON.stringify(ccr_downtime_data.schema, null, 2));

    // Coba tambahkan record dengan format waktu berbeda untuk pengujian
    const testRecords = [
      {
        date: '2025-10-18',
        start_time: '09:30',
        end_time: '10:45',
        pic: 'Test User',
        problem: 'Test Problem',
        unit: 'Test Unit',
      },
      {
        date: '2025-10-18',
        start_time: '09:30:00', // dengan detik
        end_time: '10:45:00',
        pic: 'Test User 2',
        problem: 'Test Problem 2',
        unit: 'Test Unit',
      },
      {
        date: '2025-10-18',
        start_time: '9:30', // tanpa leading zero
        end_time: '10:45',
        pic: 'Test User 3',
        problem: 'Test Problem 3',
        unit: 'Test Unit',
      },
    ];

    console.log('Testing record creation with different time formats...');

    for (const record of testRecords) {
      try {
        console.log(
          `Trying to create record with start_time=${record.start_time}, end_time=${record.end_time}`
        );
        const response = await pb.collection('ccr_downtime_data').create(record);
        console.log('Success! Created record:', response);
      } catch (error) {
        console.error('Failed to create record:', error);
      }
    }

    // Retrieve the records to see what was actually saved
    const savedRecords = await pb.collection('ccr_downtime_data').getList(1, 10, {
      filter: `date = "2025-10-18"`,
      sort: '-created',
    });

    console.log('Retrieved records:', savedRecords.items);

    // Print specific time formats
    console.log('Saved time formats:');
    for (const record of savedRecords.items) {
      console.log(`Record ID ${record.id}:`);
      console.log(`- start_time: ${record.start_time} (type: ${typeof record.start_time})`);
      console.log(`- end_time: ${record.end_time} (type: ${typeof record.end_time})`);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testTimeFormat();
