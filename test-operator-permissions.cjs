const { getDefaultPermissionsForRole } = require('./utils/tonasaPermissions.ts');

async function testOperatorPermissions() {
  try {
    console.log('Testing Operator permissions...');

    const operatorPermissions = await getDefaultPermissionsForRole('Operator');
    console.log('Operator permissions:', JSON.stringify(operatorPermissions, null, 2));

    // Check if plant_operations has WRITE access for all units
    const plantOps = operatorPermissions.plant_operations;
    console.log('Plant operations keys:', Object.keys(plantOps));

    let allWrite = true;
    Object.entries(plantOps).forEach(([category, units]) => {
      console.log(`Category ${category}:`, units);
      Object.entries(units).forEach(([unit, level]) => {
        if (level !== 'WRITE') {
          console.log(`❌ Unit ${unit} in ${category} has ${level}, expected WRITE`);
          allWrite = false;
        }
      });
    });

    if (allWrite && Object.keys(plantOps).length > 0) {
      console.log('✅ All plant operations units have WRITE access for Operator');
    } else {
      console.log('❌ Some units do not have WRITE access or no units found');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOperatorPermissions();
