const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('http://141.11.25.69:8090');

async function createCopParametersForPlantUnits() {
  console.log('🚀 Membuat COP parameters untuk setiap plant unit...');

  try {
    // Get all plant units
    const plantUnits = await pb.collection('plant_units').getFullList({
      sort: 'category,unit',
    });

    console.log(`📋 Ditemukan ${plantUnits.length} plant units`);

    // Group by category
    const groupedByCategory = plantUnits.reduce((acc, unit) => {
      if (!acc[unit.category]) {
        acc[unit.category] = [];
      }
      acc[unit.category].push(unit);
      return acc;
    }, {});

    console.log('📊 Plant units grouped by category:');
    Object.entries(groupedByCategory).forEach(([category, units]) => {
      console.log(`  ${category}: ${units.length} units`);
    });

    // Create COP parameters for each plant unit
    for (const unit of plantUnits) {
      try {
        // Check if COP parameters already exist for this unit
        const existing = await pb
          .collection('cop_parameters')
          .getFirstListItem(`plant_category="${unit.category}" && plant_unit="${unit.unit}"`)
          .catch(() => null);

        if (existing) {
          console.log(`⚠️  COP parameters sudah ada untuk ${unit.category} - ${unit.unit}`);
          continue;
        }

        // Create new COP parameters record
        const newRecord = await pb.collection('cop_parameters').create({
          plant_category: unit.category,
          plant_unit: unit.unit,
          parameter_ids: [], // Start with empty array
        });

        console.log(
          `✅ Dibuat COP parameters untuk ${unit.category} - ${unit.unit} (ID: ${newRecord.id})`
        );
      } catch (error) {
        console.error(
          `❌ Error creating COP parameters for ${unit.category} - ${unit.unit}:`,
          error.message
        );
      }
    }

    // Show final result
    const allCopParams = await pb.collection('cop_parameters').getFullList({
      sort: 'plant_category,plant_unit',
    });

    console.log('\n📋 Final COP Parameters:');
    allCopParams.forEach((record) => {
      console.log(
        `  ${record.plant_category} - ${record.plant_unit}: ${record.parameter_ids.length} parameters`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCopParametersForPlantUnits().catch(console.error);
