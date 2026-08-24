import PocketBase from 'pocketbase';

const PB_URL = 'http://172.18.6.98:8090';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const collectionsToCreate = [
  {
    name: 'derivative_plant_units',
    type: 'base',
    schema: [
      { name: 'unit', type: 'text', required: true },
      { name: 'category', type: 'text', required: true },
      { name: 'description', type: 'text' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_parameter_settings',
    type: 'base',
    schema: [
      { name: 'parameter', type: 'text', required: true },
      { name: 'data_type', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'min_value', type: 'number' },
      { name: 'max_value', type: 'number' },
      { name: 'opc_min_value', type: 'number' },
      { name: 'opc_max_value', type: 'number' },
      { name: 'pcc_min_value', type: 'number' },
      { name: 'pcc_max_value', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_silo_capacities',
    type: 'base',
    schema: [
      { name: 'plant_category', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'silo_name', type: 'text' },
      { name: 'capacity', type: 'number' },
      { name: 'dead_stock', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_pic_settings',
    type: 'base',
    schema: [{ name: 'pic', type: 'text', required: true }],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_cop_parameters',
    type: 'base',
    schema: [
      { name: 'parameter_ids', type: 'json', options: { maxSize: 2000000 } },
      { name: 'plant_category', type: 'text' },
      { name: 'plant_unit', type: 'text' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_cop_footer_parameters',
    type: 'base',
    schema: [
      { name: 'parameter_ids', type: 'json', options: { maxSize: 2000000 } },
      { name: 'plant_category', type: 'text' },
      { name: 'plant_unit', type: 'text' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_report_settings',
    type: 'base',
    schema: [
      { name: 'parameter_id', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'order', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_simple_report_settings',
    type: 'base',
    schema: [
      { name: 'parameter_id', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'order', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_parameter_order_profiles',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'user_id', type: 'text', required: true },
      { name: 'module', type: 'text', required: true },
      { name: 'parameter_type', type: 'text', required: true },
      { name: 'category', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'parameter_order', type: 'json', required: true, options: { maxSize: 2000000 } },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_user_parameter_orders',
    type: 'base',
    schema: [
      { name: 'user_id', type: 'text' },
      { name: 'module', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'parameter_type', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'parameter_order', type: 'json', options: { maxSize: 2000000 } },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_ccr_parameter_data',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'parameter_id', type: 'text' },
      { name: 'unit_id', type: 'text' },
      { name: 'plant_unit', type: 'text' },
      { name: 'hourly_values', type: 'json', options: { maxSize: 2000000 } },
      { name: 'name', type: 'text' },
      ...Array.from({ length: 24 }, (_, i) => ({ name: `hour${i + 1}`, type: 'text' })),
      ...Array.from({ length: 24 }, (_, i) => ({ name: `hour${i + 1}_user`, type: 'text' })),
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_ccr_downtime_data',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'start_time', type: 'text' },
      { name: 'end_time', type: 'text' },
      { name: 'pic', type: 'text' },
      { name: 'problem', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'action', type: 'text' },
      { name: 'corrective_action', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'duration_minutes', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_ccr_silo_data',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'silo_id', type: 'text' },
      { name: 'shift1_empty_space', type: 'number' },
      { name: 'shift1_content', type: 'number' },
      { name: 'shift2_empty_space', type: 'number' },
      { name: 'shift2_content', type: 'number' },
      { name: 'shift3_empty_space', type: 'number' },
      { name: 'shift3_content', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_ccr_footer_data',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'parameter_id', type: 'text' },
      { name: 'unit_id', type: 'text' },
      { name: 'plant_unit', type: 'text' },
      { name: 'total', type: 'number' },
      { name: 'average', type: 'number' },
      { name: 'minimum', type: 'number' },
      { name: 'maximum', type: 'number' },
      { name: 'shift1_total', type: 'number' },
      { name: 'shift2_total', type: 'number' },
      { name: 'shift3_total', type: 'number' },
      { name: 'shift3_cont_total', type: 'number' },
      { name: 'shift1_average', type: 'number' },
      { name: 'shift2_average', type: 'number' },
      { name: 'shift3_average', type: 'number' },
      { name: 'shift3_cont_average', type: 'number' },
      { name: 'shift1_counter', type: 'number' },
      { name: 'shift2_counter', type: 'number' },
      { name: 'shift3_counter', type: 'number' },
      { name: 'shift3_cont_counter', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_ccr_information',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'plant_unit', type: 'text' },
      { name: 'information', type: 'text' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_autonomous_risk_data',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'potential_disruption', type: 'text' },
      { name: 'preventive_action', type: 'text' },
      { name: 'mitigation_plan', type: 'text' },
      { name: 'status', type: 'text' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_ccr_material_usage',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'plant_category', type: 'text' },
      { name: 'plant_unit', type: 'text' },
      {
        name: 'shift',
        type: 'select',
        options: { maxSelect: 1, values: ['shift3_cont', 'shift1', 'shift2', 'shift3'] },
      },
      { name: 'clinker', type: 'number' },
      { name: 'gypsum', type: 'number' },
      { name: 'limestone', type: 'number' },
      { name: 'trass', type: 'number' },
      { name: 'fly_ash', type: 'number' },
      { name: 'fine_trass', type: 'number' },
      { name: 'ckd', type: 'number' },
      { name: 'total_production', type: 'number' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_moisture_monitoring',
    type: 'base',
    schema: [
      { name: 'date', type: 'date' },
      { name: 'unit', type: 'text' },
      { name: 'hourly_data', type: 'json', options: { maxSize: 2000000 } },
      { name: 'stats', type: 'json', options: { maxSize: 2000000 } },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
  {
    name: 'derivative_cop_aggregates',
    type: 'base',
    schema: [
      { name: 'date', type: 'text' },
      { name: 'plant_unit', type: 'text' },
      { name: 'aggregate_data', type: 'json', options: { maxSize: 2000000 } },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  },
];

async function main() {
  try {
    console.log('Authenticating as admin to PocketBase server...');
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
    console.log('Authentication successful!\n');

    const existingCollections = await pb.collections.getFullList();
    const existingMap = new Map(existingCollections.map((c) => [c.name, c]));

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const colDef of collectionsToCreate) {
      if (existingMap.has(colDef.name)) {
        console.log(`[SKIP] Collection "${colDef.name}" already exists.`);
        skippedCount++;
      } else {
        console.log(`[CREATE] Creating collection "${colDef.name}"...`);
        try {
          await pb.collections.create(colDef);
          console.log(`  -> Successfully created "${colDef.name}".`);
          createdCount++;
        } catch (err) {
          console.error(`  -> Failed to create "${colDef.name}":`, err.message);
          if (err.data) console.error('     Error details:', JSON.stringify(err.data));
        }
      }
    }

    console.log('\n--- MIGRATION SUMMARY ---');
    console.log(`Total Collections Processed: ${collectionsToCreate.length}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Updated/Skipped: ${skippedCount}`);
    console.log('-------------------------\n');
  } catch (err) {
    console.error('Fatal error running migration:', err);
  }
}

main();
