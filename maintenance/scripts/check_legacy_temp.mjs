
import PocketBase from 'pocketbase';

const PB_URL = 'https://db.sipoma.online';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';

const pb = new PocketBase(PB_URL);

async function checkLegacyData() {
  await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
  const result = await pb.collection('ccr_parameter_data').getList(1, 10);
  
  result.items.forEach(r => {
    console.log(`ID: ${r.id}, Date: ${r.date}, Has hourly_values: ${!!r.hourly_values}`);
  });
}

checkLegacyData();
