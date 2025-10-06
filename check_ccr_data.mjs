import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCcrParameterData() {
  try {
    // Check for today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking CCR parameter data for date:', today);

    const { data, error } = await supabase
      .from('ccr_parameter_data')
      .select('*')
      .eq('date', today)
      .limit(10);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('CCR parameter data found:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('No data found for today');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCcrParameterData();
