import PocketBase from 'pocketbase';

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://172.18.6.98:8090';
const PB_EMAIL = process.env.PB_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const PB_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'makassar@270989';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function setupProjectTasksPhotosField() {
  try {
    console.log(`Connecting to PocketBase at ${PB_URL}...`);
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
    console.log('Admin authentication successful!');

    const collectionName = 'project_tasks';
    const collection = await pb.collections.getOne(collectionName);
    console.log(`Found collection '${collectionName}'.`);

    // Check if 'photos' field exists
    const schema = collection.schema || [];
    const hasPhotosField = schema.some((f) => f.name === 'photos');

    if (!hasPhotosField) {
      console.log("Adding 'photos' file field to schema...");
      schema.push({
        name: 'photos',
        type: 'file',
        required: false,
        options: {
          maxSelect: 10,
          maxSize: 20971520, // 20MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
      });

      await pb.collections.update(collection.id, {
        schema: schema,
      });
      console.log("Successfully added 'photos' field to 'project_tasks' collection!");
    } else {
      console.log("'photos' field already exists in 'project_tasks' collection.");
    }
  } catch (err) {
    console.error('Error updating schema:', err.message || err);
  }
}

setupProjectTasksPhotosField();
