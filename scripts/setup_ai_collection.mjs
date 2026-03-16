import PocketBase from 'pocketbase';

const PB_URL = 'https://db.sipoma.online';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function setup() {
  try {
    console.log('Authenticating as admin...');
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

    console.log('Checking for operational_ai_reviews collection...');
    try {
      await pb.collections.getOne('operational_ai_reviews');
      console.log('Collection "operational_ai_reviews" already exists.');
    } catch (e) {
      console.log('Creating "operational_ai_reviews" collection...');
      await pb.collections.create({
        name: 'operational_ai_reviews',
        type: 'base',
        schema: [
          { name: 'date', type: 'date', required: true },
          { name: 'plant_unit', type: 'text', required: true },
          { name: 'review_content', type: 'text' },
          { name: 'recommendations', type: 'text' },
          { name: 'metrics_summary', type: 'json', options: { maxSize: 2000000 } }
        ],
        listRule: '', // allow public list for dashboard
        viewRule: '', // allow public view
        createRule: null, // admin only
        updateRule: null, // admin only
        deleteRule: null, // admin only
        indexes: [
          'CREATE INDEX idx_review_date_unit ON operational_ai_reviews (date, plant_unit)'
        ]
      });
      console.log('Collection created successfully.');
    }
  } catch (e) {
    console.error('Setup failed:', e);
    if (e.data) console.error('Error data:', JSON.stringify(e.data));
  }
}

setup();
