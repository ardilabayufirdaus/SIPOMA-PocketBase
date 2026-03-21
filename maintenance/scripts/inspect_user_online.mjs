import PocketBase from 'pocketbase';

const PB_URL = 'https://db.sipoma.online';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';

const pb = new PocketBase(PB_URL);

async function inspect() {
  await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
  try {
    const col = await pb.collections.getOne('user_online');
    console.log('Collection: user_online');
    console.log('Schema:', JSON.stringify(col.schema, null, 2));
    console.log('Indexes:', JSON.stringify(col.indexes, null, 2));
  } catch(e) {
    console.error('Error fetching user_online schema:', e.message);
  }
}

inspect();
