const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testErrorHandling() {
  try {
    console.log('Testing 404 error handling...');
    const result = await pb
      .collection('ccr_parameter_data')
      .getFirstListItem('date="2025-10-17 00:00:00.000Z" && parameter_id="hs34fzd79wjkips"');
  } catch (error) {
    console.log('Error type:', typeof error);
    console.log('Error constructor:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error response:', error.response);
    console.log('Error status:', error.response?.status);
    console.log('Error is ClientResponseError:', error.constructor.name === 'ClientResponseError');
    if (error.response?.status === 404) {
      console.log('This is a 404 error');
    }
  }
}

testErrorHandling();
