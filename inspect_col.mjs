import PocketBase from 'pocketbase';

const PB_URL = 'https://db.sipoma.online';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';

const pb = new PocketBase(PB_URL);

async function inspect() {
  await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
  const col = await pb.collections.getOne('ccr_parameter_data');
  console.log(JSON.stringify(col.schema, null, 2));
}

inspect();
