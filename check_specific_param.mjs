import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificParam() {
  try {
    const targetId = 'f77aedf8-91ff-4c00-9778-9aa48a863cad';

    const { data: param, error } = await supabase
      .from('parameter_settings')
      .select('*')
      .eq('id', targetId);

    if (error) {
      console.error('Error:', error);
    } else {
      if (param && param.length > 0) {
        console.log('Parameter found:', param[0]);
      } else {
        console.log('Parameter not found with id:', targetId);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSpecificParam();
