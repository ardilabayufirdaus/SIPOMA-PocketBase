import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlantUnits() {
  try {
    const today = '2025-10-06';
    const { data, error } = await supabase
      .from('ccr_parameter_data')
      .select('plant_unit, parameter_id')
      .eq('date', today)
      .limit(20);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Plant units in CCR data:');
      const units = new Set();
      data?.forEach((d) => {
        units.add(d.plant_unit || 'null');
        console.log(`- parameter_id: ${d.parameter_id}, plant_unit: ${d.plant_unit || 'null'}`);
      });
      console.log('Unique plant_units:', Array.from(units));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkPlantUnits();
