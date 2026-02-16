import PocketBase from 'pocketbase';
import 'dotenv/config';

const PB_URL = process.env.VITE_POCKETBASE_URL || 'https://db.sipoma.online';
const PB_EMAIL = process.env.PB_EMAIL || 'ardila.firdaus@sig.id';
const PB_PASSWORD = process.env.PB_PASSWORD || 'makassar@270989';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function migrate() {
  try {
    console.log('Authenticating...');
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

    console.log('Fetching system_status collection...');
    const collection = await pb.collections.getOne('system_status');

    // Check if uptime exists
    const exists = collection.schema.find((f) => f.name === 'uptime');
    if (exists) {
      console.log('Field "uptime" already exists.');
      return;
    }

    console.log('Adding "uptime" field...');
    collection.schema.push({
      name: 'uptime',
      type: 'number',
      required: false,
      presentable: false,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    });

    await pb.collections.update(collection.id, collection);
    console.log('Schema updated successfully.');
  } catch (e) {
    console.error('Migration failed:', e);
  }
}

migrate();
