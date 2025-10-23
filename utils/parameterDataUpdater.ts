import { pb } from '../utils/pocketbase-simple';

// Helper function to ensure a parameter record includes the plant unit
// This is used to fix the 400 Bad Request error when creating parameter data
export async function updateParameterDataFixed(
  date: string,
  parameter_id: string,
  hour: number,
  value: string | number | null,
  userName: string
) {
  try {
    // Step 1: Normalize the date format
    const normalizedDate = date.split('T')[0];

    // Step 2: Check if the parameter record already exists
    try {
      // First try to find an existing record
      const existing = await pb
        .collection('ccr_parameter_data')
        .getFirstListItem(`date="${normalizedDate}" && parameter_id="${parameter_id}"`);

      // Record exists, update it
      if (existing) {
        const hourField = `hour${hour}`;
        const userField = `hour${hour}_user`;

        const updateData = {};
        updateData[hourField] = value === '' ? null : value;
        updateData[userField] = userName;

        await pb.collection('ccr_parameter_data').update(existing.id, updateData);
        return { success: true, message: 'Record updated' };
      }
    } catch (findError) {
      // Error 404 means record doesn't exist which is expected
      const err = findError as { status?: number };
      if (err.status !== 404) {
        console.error('Error checking existing record:', findError);
        throw findError;
      }
    }

    // Record doesn't exist, create a new one
    try {
      // Step 3: Get the plant unit for this parameter
      let plant_unit = null;
      try {
        const parameter = await pb.collection('parameter_settings').getOne(parameter_id);
        plant_unit = parameter.unit || null;
      } catch (paramError) {
        console.warn('Could not get plant unit for parameter:', paramError);
      }

      // Step 4: Create a new record with all required fields
      const hourField = `hour${hour}`;
      const userField = `hour${hour}_user`;

      const createData = {
        date: normalizedDate,
        parameter_id: parameter_id,
        plant_unit: plant_unit,
        name: userName, // For backward compatibility
      };

      createData[hourField] = value === '' ? null : value;
      createData[userField] = userName;

      const result = await pb.collection('ccr_parameter_data').create(createData);
      return { success: true, message: 'Record created', id: result.id };
    } catch (createError) {
      console.error('Error creating parameter record:', createError);
      throw createError;
    }
  } catch (error) {
    console.error('Parameter data update failed:', error);
    throw error;
  }
}
