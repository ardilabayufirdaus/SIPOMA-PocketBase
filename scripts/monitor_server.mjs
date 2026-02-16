import PocketBase from 'pocketbase';
import 'dotenv/config';

const PB_URL = process.env.VITE_POCKETBASE_URL || 'https://db.sipoma.online';
const PB_EMAIL = process.env.PB_EMAIL || 'ardila.firdaus@sig.id';
const PB_PASSWORD = process.env.PB_PASSWORD || 'makassar@270989';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const STATUS_COLLECTION = 'system_status';
const RECORD_ID = 'monitor_srv_001';

async function checkDB() {
  try {
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
    const record = await pb.collection(STATUS_COLLECTION).getOne(RECORD_ID);
    console.log('--- UPTIME CHECK ---');
    console.log('Uptime (raw):', record.uptime, typeof record.uptime);
    console.log('Last Updated:', record.last_updated);
    console.log('--- END ---');
  } catch (e) {
    console.error(e);
  }
}

checkDB();
