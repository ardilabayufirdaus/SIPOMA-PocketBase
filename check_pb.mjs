import PocketBase from 'pocketbase';

async function checkCollections() {
  const pb = new PocketBase('https://db.sipoma.online');
  try {
    const list = await pb.collections.getFullList();
    console.log('Collections:', list.map(c => c.name));
  } catch (e) {
    console.error('Failed to list collections (likely no admin auth):', e.message);
  }
}

checkCollections();
