/**
 * Fix CCR Downtime Data
 *
 * Script untuk memastikan semua data CCR Downtime memiliki format tanggal yang konsisten
 * dan tambahan kolom date_string untuk memudahkan query
 */

const PocketBase = require('pocketbase');

async function fixCcrDowntimeData() {
  console.log('Starting CCR Downtime data fix...');
  const pb = new PocketBase('http://141.11.25.69:8090');

  try {
    // Ambil semua data downtime
    console.log('Fetching all downtime records...');
    const records = await pb.collection('ccr_downtime_data').getFullList({
      sort: '-created',
    });

    console.log(`Found ${records.length} records total`);

    // Check format tanggal yang digunakan
    const dateFormats = {};
    records.forEach((record) => {
      if (!dateFormats[record.date]) {
        dateFormats[record.date] = 0;
      }
      dateFormats[record.date]++;
    });

    console.log('Date formats found:');
    Object.keys(dateFormats).forEach((date) => {
      console.log(`  - ${date}: ${dateFormats[date]} records`);
    });

    // Memperbarui setiap record untuk memastikan format konsisten
    console.log('\nUpdating records to ensure consistent format...');
    let updated = 0;
    let skipped = 0;

    for (const record of records) {
      // Normalize date format
      const originalDate = record.date;

      // Skip if no date (shouldn't happen but just in case)
      if (!originalDate) {
        console.log(`Skipping record ${record.id} - no date field`);
        skipped++;
        continue;
      }

      // Function to normalize date format
      const normalizeDate = (dateStr) => {
        // Remove any whitespace
        const normalized = dateStr.trim();

        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
          return normalized;
        }

        // Otherwise, try to parse and format
        try {
          const date = new Date(normalized);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          // If parsing fails, return original
          console.log(`Failed to parse date: ${dateStr}`);
        }

        return normalized;
      };

      const normalizedDate = normalizeDate(originalDate);

      // Skip if date hasn't changed and we already have our extra fields
      if (
        normalizedDate === originalDate &&
        record.date_string &&
        record.date_year &&
        record.date_month &&
        record.date_day
      ) {
        skipped++;
        continue;
      }

      // Create date components
      const dateObj = new Date(normalizedDate);
      const dateComponents = {
        date: normalizedDate,
        date_string: normalizedDate,
        date_year: dateObj.getFullYear(),
        date_month: dateObj.getMonth() + 1,
        date_day: dateObj.getDate(),
      };

      // Update record
      try {
        await pb.collection('ccr_downtime_data').update(record.id, dateComponents);
        updated++;

        // Log progress every 10 records
        if (updated % 10 === 0) {
          console.log(`Progress: ${updated} records updated`);
        }
      } catch (error) {
        console.log(`Failed to update record ${record.id}:`, error.message);
      }
    }

    console.log('\nUpdate complete!');
    console.log(`- ${updated} records updated`);
    console.log(`- ${skipped} records skipped (already in correct format)`);
  } catch (error) {
    console.error('Error fixing CCR downtime data:', error);
  }
}

// Run the fix script
fixCcrDowntimeData()
  .then(() => console.log('Script completed'))
  .catch(console.error);

