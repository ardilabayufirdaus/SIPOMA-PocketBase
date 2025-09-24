import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParameters() {
  try {
    const { data, error } = await supabase
      .from('parameter_settings')
      .select('parameter, category, unit')
      .or('parameter.ilike.%counter%,parameter.ilike.%running%,parameter.ilike.%jam%,parameter.ilike.%operasi%');

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Parameters found:');
      data.forEach(p => console.log(`- ${p.parameter} (Category: ${p.category}, Unit: ${p.unit})`));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkParameters();