/**
 * Debug utility for checking CCR Downtime data
 * To use:
 * 1. Start PocketBase server
 * 2. Run this script with: node debug-downtime.js
 */

console.log('Loading...');
const fetch = require('node-fetch');

async function checkDowntimeData() {
  try {
    console.log('Connecting to PocketBase...');
  const baseUrl = 'https://api.sipoma.site/';
    
    // Check if server is available
    console.log('Checking PocketBase availability...');
    try {
      const healthCheck = await fetch(${baseUrl}/api/health);
      if (healthCheck.ok) {
        console.log(' PocketBase server is available');
      } else {
        console.log(' PocketBase server returned status:', healthCheck.status);
      }
    } catch (error) {
      console.log(' Could not connect to PocketBase:', error.message);
      return;
    }
    
    // Fetch all downtime records
    console.log('Fetching downtime records...');
    const response = await fetch(${baseUrl}/api/collections/ccr_downtime_data/records?perPage=100);
    if (!response.ok) {
      console.error('Failed to fetch records:', response.status);
      return;
    }
    
    const data = await response.json();
    const records = data.items || [];
    
    console.log(Found  total records);
    
    // Group by date to see formats
    const dateFormats = {};
    records.forEach(record => {
      const date = record.date;
      if (!dateFormats[date]) {
        dateFormats[date] = [];
      }
      dateFormats[date].push(record.id);
    });
    
    console.log('\nDate formats in use:');
    Object.keys(dateFormats).forEach(date => {
      console.log(- :  records);
    });
    
    // Check today's records
    const today = new Date().toISOString().split('T')[0];
    console.log(\nRecords for today ():);
    const todaysRecords = records.filter(r => r.date === today);
    console.log(Found  records);
    
    todaysRecords.forEach((record, i) => {
      console.log(\n[Record ]);
      console.log(- ID: );
      console.log(- Date: );
      console.log(- Created: );
      console.log(- Unit: );
      console.log(- Problem: );
      console.log(- Times:  to );
    });
    
  } catch (error) {
    console.error('Error checking downtime data:', error);
  }
}

checkDowntimeData().then(() => console.log('\nDone checking downtime data'));

