import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParameterMatch() {
  try {
    // Get parameter settings
    const { data: params, error: paramsError } = await supabase
      .from('parameter_settings')
      .select('id, parameter, category, unit')
      .limit(10);

    if (paramsError) {
      console.error('Error fetching parameters:', paramsError);
      return;
    }

    console.log('Parameter settings sample:');
    params?.forEach((p) => console.log(`- ${p.id}: ${p.parameter} (${p.category}, ${p.unit})`));

    // Get CCR data
    const today = '2025-10-06';
    const { data: ccrData, error: ccrError } = await supabase
      .from('ccr_parameter_data')
      .select('parameter_id, date')
      .eq('date', today)
      .limit(10);

    if (ccrError) {
      console.error('Error fetching CCR data:', ccrError);
      return;
    }

    console.log('\nCCR data parameter_ids:');
    ccrData?.forEach((d) => console.log(`- ${d.parameter_id}`));

    // Check matches
    const paramIds = new Set(params?.map((p) => p.id) || []);
    const ccrParamIds = new Set(ccrData?.map((d) => d.parameter_id) || []);

    console.log('\nMatches:');
    for (const id of ccrParamIds) {
      if (paramIds.has(id)) {
        console.log(`✓ ${id} matches`);
      } else {
        console.log(`✗ ${id} does not match any parameter setting`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkParameterMatch();
