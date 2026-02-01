import { pb } from './utils/pocketbase-simple.js';

async function checkParameters() {
  try {
    const records = await pb.collection('parameter_settings').getFullList();
    console.log('Found ' + records.length + ' parameter settings.');

    // Filter parameters that might have large values (like feeders or counters)
    const largeValueParams = records.filter(
      (p) =>
        p.parameter.toLowerCase().includes('feeder') ||
        p.parameter.toLowerCase().includes('counter') ||
        p.unit.toLowerCase().includes('ton') ||
        p.unit.toLowerCase().includes('kg')
    );

    console.log('\nParameters with potential large values:');
    largeValueParams.forEach((p) => {
      console.log(`- ID: ${p.id}, Name: ${p.parameter}, Unit: ${p.unit}, Type: ${p.data_type}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkParameters();
