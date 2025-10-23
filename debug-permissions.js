// Add this debug function at the top of the CcrDataEntryPage.tsx component
const debugPermissions = () => {
  console.log('loggedInUser:', loggedInUser);
  if (loggedInUser) {
    console.log('permissions:', loggedInUser.permissions);
    if (loggedInUser.permissions && loggedInUser.permissions.plant_operations) {
      console.log('plant_operations permissions:', loggedInUser.permissions.plant_operations);
    }
  }

  console.log('plantUnits:', plantUnits);
  console.log('plantCategories after permission filtering:', plantCategories);
  console.log('unitsForCategory after permission filtering:', unitsForCategory);

  // Test a specific permission check for troubleshooting
  if (plantUnits.length > 0) {
    const testUnit = plantUnits[0];
    console.log('Testing permission for:', testUnit.category, testUnit.unit);
    console.log(
      'Permission check result:',
      permissionChecker.hasPlantOperationPermission(testUnit.category, testUnit.unit, 'READ')
    );
  }
};
