import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFilteredParams() {
  try {
    const selectedCategory = 'Tonasa 4';
    const selectedUnit = 'Cement Mill 419';

    console.log('Checking for category:', selectedCategory, 'unit:', selectedUnit);

    const { data: params, error } = await supabase
      .from('parameter_settings')
      .select('id, parameter, category, unit')
      .eq('category', selectedCategory)
      .eq('unit', selectedUnit);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Filtered parameters:', params?.length || 0);
      params?.forEach((p) => console.log(`- ${p.parameter} (${p.category}, ${p.unit})`));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkFilteredParams();
