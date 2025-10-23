const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://141.11.25.69:8090');

async function modifyFetchProfilesCode() {
  try {
    // Log into PocketBase as admin to get a reference to the CcrDataEntryPage.tsx file
    await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

    // First check if the file exists and we can modify it
    const pages = await pb.collection('pages').getList(1, 1, {
      filter: 'name="CcrDataEntryPage"',
    });

    if (pages.items.length > 0) {
      console.log('Found CcrDataEntryPage in the database');
      // Perform modification here...
    } else {
      console.log('CcrDataEntryPage not found in database');
    }

    // Now check the issue by getting the field structure of parameter_order_profiles
    const collections = await pb.collections.getFullList();
    const pop = collections.find((c) => c.name === 'parameter_order_profiles');

    if (pop) {
      console.log('\nField structure of parameter_order_profiles:');
      pop.schema.forEach((field) => {
        console.log(`  ${field.name} (${field.type})`, field.required ? 'REQUIRED' : 'optional');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

modifyFetchProfilesCode();
