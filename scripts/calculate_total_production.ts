import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const parameterIds = [
  'a3f7b380-1cad-41f3-b459-802d4c33da54',
  'fb58e1a8-d808-46fc-8123-c3a33899dfcc',
  '8d1d2e1e-b003-44f1-a946-50aed6b44fe8',
  '14bf978b-5f5f-4279-b0c1-b91eb8a28e3a',
  '0917556b-e2b7-466b-bc55-fc3a79bb9a25',
  'fe1548c9-2ee5-44a8-9105-3fa2922438f4',
];

async function calculateTotalProduction() {
  try {
    const { data, error } = await supabase
      .from('ccr_footer_data')
      .select('total')
      .in('parameter_id', parameterIds);

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    const totalSum = data.reduce((sum, row) => sum + (row.total || 0), 0);
  } catch (err) {
    console.error('Error:', err);
  }
}

calculateTotalProduction();
