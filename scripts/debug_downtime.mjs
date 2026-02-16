import PocketBase from 'pocketbase';

const PB_URL = 'https://db.sipoma.online';
const pb = new PocketBase(PB_URL);

async function checkDowntime() {
  console.log(`Checking downtime data from ${PB_URL} for FEBRUARY 2026...`);

  try {
    const collections = ['ccr_downtime_data', 'rkc_ccr_downtime_data'];

    for (const col of collections) {
      console.log(`\nScanning collection: ${col}`);
      const records = await pb.collection(col).getFullList({
        sort: '-date',
      });

      // Filter strictly for strings containing "2026-02"
      const febRecords = records.filter((r) => r.date && r.date.includes('2026-02'));

      console.log(`Found ${febRecords.length} records with date containing "2026-02".`);

      febRecords.forEach((r) => {
        console.log(`  - [${r.date}] Status: '${r.status}' | Unit: ${r.unit} | ID: ${r.id}`);

        // Test the logic used in useDashboardData.ts
        const d = new Date(r.date);
        const month = d.getMonth(); // 0-indexed (0=Jan, 1=Feb)
        const year = d.getFullYear();
        console.log(`    -> Parsed: Month=${month} (Expected 1), Year=${year}`);
        const matchStatus = r.status === 'Open';
        console.log(`    -> Status Match 'Open': ${matchStatus}`);
      });

      if (febRecords.length === 0) {
        // Check if there are ANY records to ensure we are actually fetching
        console.log(`    (Total records in collection: ${records.length})`);
        if (records.length > 0) {
          console.log(`    Sample First Record Date: ${records[0].date}`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDowntime();
