
// AUTO-GENERATED FILE - Created by initialize-db-indices.mjs
// This module initializes critical database indices for optimal performance

/**
 * Initializes important database indices for the ccr_parameter_data collection
 * to ensure optimal query performance, especially for the flat schema structure.
 * 
 * @param {PocketBase} pb - PocketBase instance 
 */
export async function initializeCcrParameterIndices(pb) {
  try {
    // Only proceed if we have admin access
    if (!pb.authStore.isAdmin) {
      console.log('Skipping index initialization: Requires admin privileges');
      return;
    }

    // Collection ID for ccr_parameter_data
    const COLLECTION_ID = 'eg9zhgtfakymrje';
    
    // Get the current collection schema
    console.log('Checking ccr_parameter_data indices...');
    const collection = await pb.collections.getOne(COLLECTION_ID);
    
    // Current indices
    const currentIndices = collection.indexes || [];
    
    // Primary indices we want to ensure exist
    const primaryIndices = [
    {
        "name": "idx_ccr_parameter_data_date",
        "field": "date"
    },
    {
        "name": "idx_ccr_parameter_data_date_param",
        "fields": [
            "date",
            "parameter_id"
        ]
    },
    {
        "name": "idx_ccr_parameter_data_param_id",
        "field": "parameter_id"
    },
    {
        "name": "idx_ccr_parameter_data_plant_unit",
        "field": "plant_unit"
    }
];
    
    // Check if our primary indices already exist
    const missingIndices = [];
    
    for (const indexDef of primaryIndices) {
      const exists = currentIndices.some(idx => idx.name === indexDef.name);
      if (!exists) {
        missingIndices.push({
          name: indexDef.name,
          type: "index",
          options: indexDef.fields 
            ? { fields: indexDef.fields } 
            : { field: indexDef.field }
        });
      }
    }
    
    // Add missing indices if any
    if (missingIndices.length > 0) {
      console.log(`Adding ${missingIndices.length} missing indices to ccr_parameter_data...`);
      
      // Merge existing and new indices
      const updatedIndices = [...currentIndices, ...missingIndices];
      
      // Update the collection
      await pb.collections.update(COLLECTION_ID, {
        indexes: updatedIndices
      });
      
      console.log('Indices added successfully!');
    } else {
      console.log('All required ccr_parameter_data indices are already in place.');
    }
  } catch (error) {
    console.error('Error initializing ccr_parameter_data indices:', error);
    // Don't crash the application if index creation fails
  }
}
