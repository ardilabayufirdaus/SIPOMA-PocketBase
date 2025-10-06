import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlantUnits() {
  try {
    const { data, error } = await supabase.from('plant_units').select('*').limit(20);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Plant units:');
      data?.forEach((pu) => console.log(`- ${pu.category}: ${pu.unit}`));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkPlantUnits();
