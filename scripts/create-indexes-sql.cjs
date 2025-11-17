const PocketBase = require('pocketbase/cjs');

// PocketBase URL
const pocketbaseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const pb = new PocketBase(pocketbaseUrl);

// Authenticate as admin
const adminEmail = process.env.POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_PASSWORD || 'makassar@270989';

async function createIndexesWithSQL() {
  try {
    console.log('Authenticating with PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('Authentication successful!');

    console.log('Creating indexes using SQL statements...');

    // SQL statements for creating indexes
    const sqlStatements = [
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_cop_footer_unique_category_unit ON cop_footer_parameters (plant_category, plant_unit)`,
      `CREATE INDEX IF NOT EXISTS idx_cop_footer_category ON cop_footer_parameters (plant_category)`,
      `CREATE INDEX IF NOT EXISTS idx_cop_footer_unit ON cop_footer_parameters (plant_unit)`,
    ];

    for (const sql of sqlStatements) {
      try {
        console.log(`Executing: ${sql}`);

        // Try to execute SQL directly
        const result = await pb.send('/api/migrate', {
          method: 'POST',
          body: {
            sql: sql,
          },
        });

        console.log('✅ SQL executed successfully:', result);
      } catch (error) {
        console.error(`❌ Failed to execute SQL: ${sql}`);
        console.error('Error:', error.message);
        if (error.response) {
          console.error('Response:', error.response);
        }
      }
    }

    // Verify indexes
    console.log('Verifying collection indexes...');
    const collection = await pb.collections.getOne('cop_footer_parameters');
    console.log('Final indexes:', collection.indexes);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

createIndexesWithSQL();
