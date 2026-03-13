import PocketBase from 'pocketbase';
import 'dotenv/config';

const PB_URL = process.env.VITE_POCKETBASE_URL || 'https://db.sipoma.online';
const PB_EMAIL = process.env.PB_EMAIL || 'ardila.firdaus@sig.id';
// Try both passwords if one fails
const PASSWORDS = [process.env.PB_PASSWORD, 'makassar@270989', '270989'].filter(Boolean);

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function migrate() {
  console.log('Starting migration to:', PB_URL);
  
  let authenticated = false;
  for (const password of PASSWORDS) {
    try {
      console.log(`Attempting authentication for ${PB_EMAIL}...`);
      await pb.admins.authWithPassword(PB_EMAIL, password);
      console.log('Authentication successful!');
      authenticated = true;
      break;
    } catch (e) {
      console.error(`Authentication failed with password attempt.`);
    }
  }

  if (!authenticated) {
    console.error('All authentication attempts failed. Migration aborted.');
    return;
  }

  try {
    console.log('Fetching parameter_settings collection...');
    const collection = await pb.collections.getOne('parameter_settings');

    let updated = false;
    // Add is_oee_feeder field
    if (!collection.schema.find((f) => f.name === 'is_oee_feeder')) {
      console.log('Adding "is_oee_feeder" field...');
      collection.schema.push({
        name: 'is_oee_feeder',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {},
      });
      updated = true;
    }

    // Add is_oee_quality field
    if (!collection.schema.find((f) => f.name === 'is_oee_quality')) {
      console.log('Adding "is_oee_quality" field...');
      collection.schema.push({
        name: 'is_oee_quality',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {},
      });
      updated = true;
    }

    if (updated) {
      await pb.collections.update(collection.id, collection);
      console.log('parameter_settings schema updated successfully.');
    } else {
      console.log('parameter_settings schema is already up to date.');
    }

    // --- Create oee_daily_summary collection if not exists ---
    try {
      await pb.collections.getOne('oee_daily_summary');
      console.log('Collection "oee_daily_summary" already exists.');
    } catch (e) {
      console.log('Creating "oee_daily_summary" collection...');
      await pb.collections.create({
        name: 'oee_daily_summary',
        type: 'base',
        schema: [
          { name: 'date', type: 'date', required: true },
          { name: 'unit', type: 'text', required: true },
          { name: 'availability', type: 'number', options: { min: 0, max: 100 } },
          { name: 'performance', type: 'number', options: { min: 0, max: 200 } },
          { name: 'quality', type: 'number', options: { min: 0, max: 100 } },
          { name: 'oee', type: 'number', options: { min: 0, max: 100 } },
          { name: 'total_production', type: 'number' },
          { name: 'design_capacity', type: 'number' },
          { name: 'operating_time', type: 'number' },
          { name: 'planned_time', type: 'number' },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_date_unit ON oee_daily_summary (date, unit)'],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.role = "Admin" || @request.auth.role = "Super Admin"',
        updateRule: '@request.auth.role = "Admin" || @request.auth.role = "Super Admin"',
        deleteRule: '@request.auth.role = "Admin" || @request.auth.role = "Super Admin"',
      });
      console.log('Collection "oee_daily_summary" created successfully.');
    }

  } catch (e) {
    console.error('Migration failed during schema update:', e);
  }
}

migrate();
