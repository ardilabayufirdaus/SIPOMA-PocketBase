/**
 * Helper untuk menghitung durasi downtime
 *
 * Script ini digunakan untuk menghitung dan mengisi field 'duration_minutes'
 * di koleksi ccr_downtime_data berdasarkan start_time dan end_time
 */

import PocketBase from 'pocketbase';
import { logger } from './utils/logger';

async function calculateDowntimeDurations() {
  logger.info('Starting CCR Downtime Duration Calculator...');
  const pb = new PocketBase('http://141.11.25.69:8090');

  try {
    // Ambil semua data downtime yang belum memiliki duration_minutes
    logger.info('Fetching downtime records without calculated duration...');
    const records = await pb.collection('ccr_downtime_data').getFullList({
      filter: 'duration_minutes = null || duration_minutes = 0',
      sort: '-created',
    });

    logger.info(`Found ${records.length} records to process`);

    // Fungsi untuk mengkonversi waktu HH:MM ke menit
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;

      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Update setiap record untuk menambahkan duration_minutes
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        const startTime = record.start_time;
        const endTime = record.end_time;

        // Skip jika tidak ada start_time atau end_time
        if (!startTime || !endTime) {
          logger.info(`Skipping record ${record.id} - missing time values`);
          skipped++;
          continue;
        }

        // Hitung durasi dalam menit
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        // Handle kasus dimana endTime mungkin di hari berikutnya
        let durationMinutes = endMinutes - startMinutes;
        if (durationMinutes < 0) {
          // Jika negatif, berarti melewati tengah malam
          durationMinutes = endMinutes + (24 * 60 - startMinutes);
        }

        // Update record dengan durasi yang dihitung
        await pb.collection('ccr_downtime_data').update(record.id, {
          duration_minutes: durationMinutes,
        });

        logger.info(`Updated record ${record.id} with duration: ${durationMinutes} minutes`);
        updated++;
      } catch (err) {
        logger.error(`Error processing record ${record.id}:`, err);
        errors++;
      }
    }

    logger.info(`
Process completed:
- ${updated} records updated with duration
- ${skipped} records skipped (missing data)
- ${errors} errors encountered
`);
  } catch (error) {
    logger.error('Error:', error);
  }
}

calculateDowntimeDurations().catch((error) => logger.error('Unhandled error:', error));
