/**
 * Script to clean up footer data for dates where parameter data has been cleared
 * This ensures WhatsApp Group Reports show correct (empty) data
 */

// Simple script to delete footer data for a specific date
const https = require('https');
const readline = require('readline');

// PocketBase URL
const PB_URL = 'https://api.sipoma.site/';

// Create interface for command-line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper untuk fetch
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({
              ok: true,
              status: res.statusCode,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data),
            });
          } catch (e) {
            reject(new Error(`Invalid JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function cleanupFooterDataForDate(targetDate) {
  try {
    console.log(`🔍 Checking footer data for date: ${targetDate}...`);

    // Get all footer data for the target date
    const response = await fetch(
      `${PB_URL}api/collections/ccr_footer_data/records?filter=date%3D%22${targetDate}%22`
    );
    const data = await response.json();

    console.log(`📊 Found ${data.items.length} footer records for ${targetDate}`);

    let deletedCount = 0;

    for (const record of data.items) {
      try {
        // Check if there's corresponding parameter data
        const paramResponse = await fetch(
          `${PB_URL}api/collections/ccr_parameter_data/records?filter=date%3D%22${targetDate}%22%20%26%26%20parameter_id%3D%22${record.parameter_id}%22%20%26%26%20plant_unit%3D%22${record.plant_unit}%22`
        );
        const paramData = await paramResponse.json();

        // If no parameter data exists, delete the footer data
        if (paramData.items.length === 0) {
          console.log(`🗑️ Deleting footer data for ${record.parameter_id} (${record.plant_unit})`);

          const deleteResponse = await fetch(
            `${PB_URL}api/collections/ccr_footer_data/records/${record.id}`,
            {
              method: 'DELETE',
            }
          );

          if (deleteResponse.ok) {
            deletedCount++;
          } else {
            console.error(`❌ Failed to delete footer record ${record.id}`);
          }
        }
      } catch (error) {
        console.error(
          `❌ Error checking parameter data for ${record.parameter_id}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Cleanup complete! Deleted ${deletedCount} orphaned footer records for ${targetDate}`
    );
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

function askForDate() {
  rl.question('Enter date to cleanup (YYYY-MM-DD) or "all" for all dates: ', (answer) => {
    if (answer.toLowerCase() === 'all') {
      console.log('⚠️ Cleaning up all dates is not implemented yet. Please specify a date.');
      rl.close();
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(answer)) {
      console.log('❌ Invalid date format. Please use YYYY-MM-DD format.');
      rl.close();
      return;
    }

    cleanupFooterDataForDate(answer)
      .then(() => {
        console.log('🏁 Cleanup script finished');
        rl.close();
      })
      .catch((error) => {
        console.error('💥 Cleanup script failed:', error);
        rl.close();
      });
  });
}

console.log('🧹 Footer Data Cleanup Script');
console.log("This will remove footer data that doesn't have corresponding parameter data");
askForDate();
