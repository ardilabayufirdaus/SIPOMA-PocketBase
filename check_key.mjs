import PocketBase from 'pocketbase';

const PB_URL = 'https://db.sipoma.online';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';

const pb = new PocketBase(PB_URL);

async function checkApiKey() {
  await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
  try {
    const record = await pb.collection('api_key').getFirstListItem('provider="xai"');
    console.log('X.AI Key found (first 5 chars):', record.key.substring(0, 5) + '...');
  } catch (e) {
    console.error('X.AI Key not found in api_key collection.');
  }
}

checkApiKey();
