const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function testFilterSyntax() {
  console.log('Testing different filter syntax variations...');

  const filterVariations = [
    // Test various filter syntaxes
    { name: 'No filter', filter: '' },
    {
      name: 'Double quotes with =',
      filter: 'module = "plant_operations" && parameter_type = "ccr_parameters"',
    },
    {
      name: 'Double quotes with ==',
      filter: 'module == "plant_operations" && parameter_type == "ccr_parameters"',
    },
    {
      name: 'Double quotes no spaces',
      filter: 'module="plant_operations" && parameter_type="ccr_parameters"',
    },
    {
      name: 'Single quotes with =',
      filter: "module = 'plant_operations' && parameter_type = 'ccr_parameters'",
    },
    {
      name: 'Single quotes no spaces',
      filter: "module='plant_operations' && parameter_type='ccr_parameters'",
    },
    {
      name: 'No operator (legacy)',
      filter: 'module "plant_operations" && parameter_type "ccr_parameters"',
    },
    { name: 'Just module', filter: 'module = "plant_operations"' },
    { name: 'Just parameter_type', filter: 'parameter_type = "ccr_parameters"' },
  ];

  try {
    for (const variation of filterVariations) {
      console.log(`\nTest: ${variation.name}`);
      console.log(`Filter: "${variation.filter}"`);

      try {
        const options = variation.filter ? { filter: variation.filter } : {};
        const records = await pb.collection('parameter_order_profiles').getFullList(options);
        console.log(`✅ Success! Retrieved ${records.length} records`);
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.response && error.response.data) {
          console.error('Response data:', JSON.stringify(error.response.data));
        }
      }
    }
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testFilterSyntax();
