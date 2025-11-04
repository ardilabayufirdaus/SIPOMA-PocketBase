/**
 * Update COP Analysis Cache Collection permissions to allow authenticated users
 */
const PocketBase = require('pocketbase/cjs');

// Configuration
const baseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'makassar@270989';

// Create PocketBase client
const pb = new PocketBase(baseUrl);

/**
 * Authenticate with PocketBase admin
 */
async function authenticate() {
  try {
    console.log('🔐 Authenticating with PocketBase...');

    if (!adminEmail || !adminPassword) {
      console.error('❌ Admin credentials not found');
      process.exit(1);
    }

    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Successfully authenticated as admin');
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    process.exit(1);
  }
}

/**
 * Update collection permissions
 */
async function updatePermissions() {
  try {
    console.log('📝 Updating cop_analysis_cache collection permissions...');

    const collection = await pb.collections.getOne('cop_analysis_cache');

    // Update permissions to allow authenticated users
    await pb.collections.update('cop_analysis_cache', {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    });

    console.log('✅ Successfully updated collection permissions');
    console.log('📋 New permissions:');
    console.log('- listRule: @request.auth.id != ""');
    console.log('- viewRule: @request.auth.id != ""');
    console.log('- createRule: @request.auth.id != ""');
    console.log('- updateRule: @request.auth.id != ""');
    console.log('- deleteRule: @request.auth.id != ""');
  } catch (err) {
    console.error('❌ Failed to update permissions:', err.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting COP Analysis Cache permissions update...');

  await authenticate();
  await updatePermissions();

  console.log('✅ COP Analysis Cache permissions update completed successfully!');
  console.log('💡 Authenticated users can now access the cache collection');
}

main().catch(console.error);
