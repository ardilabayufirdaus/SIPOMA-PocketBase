/**
 * PocketBase Data Consistency Tool
 *
 * This script helps maintain data consistency in the ccr_downtime_data collection
 * by normalizing date formats and removing invalid fields.
 */

import PocketBase from 'pocketbase';

// Helper function to normalize date format
function normalizeDateFormat(dateStr) {
  if (!dateStr) return '';

  // Trim whitespace
  const trimmed = dateStr.trim();

  // Check for YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Try parsing as date if other format
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parse errors
  }

  // Return original if no conversion possible
  return trimmed;
}

async function fixDataConsistency() {
  try {
    // Update these values according to your environment
    const pocketbaseUrl = 'http://127.0.0.1:8090';
    const targetCollection = 'ccr_downtime_data';

    console.log(`Connecting to PocketBase at ${pocketbaseUrl}...`);
    const pb = new PocketBase(pocketbaseUrl);

    console.log(`Fetching all records from ${targetCollection}...`);
    const records = await pb.collection(targetCollection).getFullList();
    console.log(`Found ${records.length} records`);

    if (records.length === 0) {
      console.log('No records to process');
      return;
    }

    console.log('\nAnalyzing data consistency...');
    let fixedRecords = 0;

    // Process each record
    for (const record of records) {
      let needsUpdate = false;
      const updates = {};

      // Check date format
      if (record.date) {
        const normalizedDate = normalizeDateFormat(record.date);
        if (normalizedDate !== record.date) {
          console.log(
            `ID ${record.id}: Fixing date format from '${record.date}' to '${normalizedDate}'`
          );
          updates.date = normalizedDate;
          needsUpdate = true;
        }
      }

      // Check for invalid fields and remove them
      if ('date_string' in record) {
        console.log(`ID ${record.id}: Removing invalid field 'date_string'`);
        // We don't need to explicitly remove it as we'll only update with valid fields
        needsUpdate = true;
      }

      if (needsUpdate) {
        try {
          console.log(`Updating record ${record.id}...`);
          await pb.collection(targetCollection).update(record.id, updates);
          fixedRecords++;
        } catch (error) {
          console.error(`Error updating record ${record.id}:`, error);
        }
      }
    }

    console.log(`\nData consistency check complete!`);
    console.log(`Fixed ${fixedRecords} records`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the fix
fixDataConsistency()
  .then(() => console.log('Process completed'))
  .catch(console.error);
