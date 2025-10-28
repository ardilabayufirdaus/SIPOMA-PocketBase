const PocketBase = require('pocketbase/cjs');

// PocketBase connection
const pb = new PocketBase('https://api.sipoma.site/');

async function addSimpleReportSettingsIndexes() {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('Preparing SQL commands for simple_report_settings indexes...');

    // SQL Index commands in PocketBase format
    const indexCommands = [
      'CREATE INDEX `idx_simple_report_settings_category` ON `simple_report_settings` (`category`)',
      'CREATE INDEX `idx_simple_report_settings_parameter_id` ON `simple_report_settings` (`parameter_id`)',
      'CREATE INDEX `idx_simple_report_settings_order` ON `simple_report_settings` (`order`)',
      'CREATE INDEX `idx_simple_report_settings_category_parameter` ON `simple_report_settings` (`category`, `parameter_id`)',
    ];

    console.log('\n=== INDEX CREATION SQL COMMANDS ===');
    console.log('Copy and paste these commands into PocketBase Admin SQL Editor:');
    console.log('');

    indexCommands.forEach((sql, index) => {
      console.log(`${index + 1}. ${sql}`);
    });

    console.log('');
    console.log('=== OR run this combined script in SQL Editor: ===');
    console.log(indexCommands.join(';\n') + ';');

    console.log('');
    console.log('Note: These indexes will optimize:');
    console.log('- Filtering by category');
    console.log('- Parameter lookups');
    console.log('- Sorting by order');
    console.log('- Combined category + parameter queries');
  } catch (error) {
    console.error('Error preparing Simple Report Settings indexes:', error);
  }
}

addSimpleReportSettingsIndexes();
