import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTipeProduk() {
  try {
    console.log('=== Checking Tipe Produk Parameter ===');
    const { data: params, error: paramsError } = await supabase
      .from('parameter_settings')
      .select('*')
      .ilike('parameter', '%tipe produk%');

    if (paramsError) {
      console.error('Error fetching parameters:', paramsError);
    } else {
      console.log('Tipe Produk parameters found:', params);
    }

    console.log('\n=== Checking CCR Data for Tipe Produk ===');
    if (params && params.length > 0) {
      const paramIds = params.map((p) => p.id);
      const { data: ccrData, error: ccrError } = await supabase
        .from('ccr_parameter_data')
        .select('*')
        .in('parameter_id', paramIds)
        .limit(10);

      if (ccrError) {
        console.error('Error fetching CCR data:', ccrError);
      } else {
        console.log('CCR data found:', ccrData);
        if (ccrData && ccrData.length > 0) {
          console.log('Sample hourly_values:', ccrData[0].hourly_values);
        }
      }
    }

    console.log('\n=== Checking All Text Type Parameters ===');
    const { data: textParams, error: textError } = await supabase
      .from('parameter_settings')
      .select('*')
      .eq('data_type', 'Text')
      .limit(20);

    if (textError) {
      console.error('Error fetching text parameters:', textError);
    } else {
      console.log(
        'Text parameters found:',
        textParams.map((p) => ({ parameter: p.parameter, unit: p.unit, category: p.category }))
      );
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTipeProduk();
