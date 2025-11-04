const PocketBase = require('pocketbase/cjs');

async function checkMaterialUsageDataSource() {
  const pb = new PocketBase('https://api.sipoma.site/');

  try {
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    console.log('=== CHECKING MATERIAL USAGE DATA SOURCE ===\n');

    // Check recent dates
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Checking data for dates: ${yesterday} and ${today}\n`);

    // Check footer data
    console.log('1. CCR FOOTER DATA:');
    const footerDataToday = await pb.collection('ccr_footer_data').getFullList({
      filter: `date="${today}"`,
      limit: 10,
    });
    const footerDataYesterday = await pb.collection('ccr_footer_data').getFullList({
      filter: `date="${yesterday}"`,
      limit: 10,
    });

    console.log(`Footer data for ${today}: ${footerDataToday.length} records`);
    console.log(`Footer data for ${yesterday}: ${footerDataYesterday.length} records`);

    if (footerDataToday.length > 0) {
      console.log('Sample footer data:');
      console.log(`  Date: ${footerDataToday[0].date}, Category: ${footerDataToday[0].category}`);
      console.log(`  shift1_counter: ${footerDataToday[0].shift1_counter}`);
      console.log(`  shift2_counter: ${footerDataToday[0].shift2_counter}`);
      console.log(`  shift3_counter: ${footerDataToday[0].shift3_counter}`);
      console.log(`  shift3_cont_counter: ${footerDataToday[0].shift3_cont_counter}`);
    }

    // Check material usage data
    console.log('\n2. CCR MATERIAL USAGE DATA:');
    const materialDataToday = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${today}"`,
      limit: 20,
    });
    const materialDataYesterday = await pb.collection('ccr_material_usage').getFullList({
      filter: `date="${yesterday}"`,
      limit: 20,
    });

    console.log(`Material usage data for ${today}: ${materialDataToday.length} records`);
    console.log(`Material usage data for ${yesterday}: ${materialDataYesterday.length} records`);

    if (materialDataToday.length > 0) {
      console.log('Sample material usage data:');
      materialDataToday.slice(0, 3).forEach((record, index) => {
        console.log(
          `  ${index + 1}. Date: ${record.date}, Category: ${record.plant_category}, Unit: ${record.plant_unit}, Shift: ${record.shift}`
        );
        console.log(
          `     Clinker: ${record.clinker}, Gypsum: ${record.gypsum}, Limestone: ${record.limestone}`
        );
        console.log(`     Created: ${record.created}`);
      });
    }

    // Check if material usage data exists without footer data
    console.log('\n3. ANALYSIS:');
    if (materialDataToday.length > 0 && footerDataToday.length === 0) {
      console.log('✅ FOUND THE ISSUE: Material usage data exists but footer data is empty!');
      console.log('This means the data was either:');
      console.log('  - Imported/manually created');
      console.log('  - Calculated from old footer data that was later deleted');
      console.log('  - Created by auto-save before footer data was cleared');
    } else if (materialDataToday.length > 0 && footerDataToday.length > 0) {
      console.log('✅ Normal case: Both footer and material usage data exist');
    } else {
      console.log('ℹ️  No data found for today');
    }

    // Check parameter settings
    console.log('\n4. PARAMETER SETTINGS:');
    const paramSettings = await pb.collection('ccr_parameter_settings').getFullList({
      limit: 10,
    });
    console.log(`Parameter settings: ${paramSettings.length} records`);

    if (paramSettings.length > 0) {
      console.log('Sample parameter settings:');
      paramSettings.slice(0, 3).forEach((param, index) => {
        console.log(`  ${index + 1}. ${param.parameter} (${param.category} - ${param.unit})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMaterialUsageDataSource();
