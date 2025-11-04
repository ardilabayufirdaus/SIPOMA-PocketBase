const PocketBase = require('pocketbase/cjs');

async function checkAvailableDates() {
  try {
    const pb = new PocketBase('https://api.sipoma.site/');
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING AVAILABLE DATES IN CCR_PARAMETER_DATA ===\n');

    // Get all dates (this might be slow, but let's try with limit first)
    const records = await pb.collection('ccr_parameter_data').getList(1, 100, {
      sort: '-date',
    });

    console.log(`Found ${records.totalItems} total records`);

    // Extract unique dates
    const dates = new Set();
    records.items.forEach((record) => {
      if (record.date) dates.add(record.date);
    });

    console.log('\nAvailable dates (sample):');
    Array.from(dates)
      .slice(0, 10)
      .forEach((date) => {
        console.log(`- ${date}`);
      });

    // Check specifically for recent dates
    const recentDates = ['2025-10-27', '2025-10-28', '2025-10-29', '2025-10-30', '2025-10-31'];
    console.log('\nChecking recent dates:');

    for (const date of recentDates) {
      const count = await pb.collection('ccr_parameter_data').getList(1, 1, {
        filter: `date="${date}"`,
      });
      console.log(`${date}: ${count.totalItems} records`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAvailableDates();
