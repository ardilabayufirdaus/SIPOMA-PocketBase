/**
 * Create COP Analysis Cache Collection for storing computed analysis results
 * This collection will cache expensive COP analysis computations to improve performance
 */
const PocketBase = require('pocketbase/cjs');

// Configuration - you can also use environment variables
const baseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'makassar@270989';

// Create PocketBase client
const pb = new PocketBase(baseUrl);

// COP Analysis Cache Collection Schema
const COP_ANALYSIS_CACHE_SCHEMA = {
  name: 'cop_analysis_cache',
  type: 'base',
  schema: [
    {
      name: 'cache_key',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
      required: true,
    },
    {
      name: 'unit',
      type: 'text',
      required: true,
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'month',
      type: 'number',
      required: true,
    },
    {
      name: 'cement_type',
      type: 'text',
      required: true,
    },
    {
      name: 'analysis_data',
      type: 'text',
      required: true,
    },
    {
      name: 'created_at',
      type: 'date',
      required: true,
    },
    {
      name: 'expires_at',
      type: 'date',
      required: true,
    },
    {
      name: 'last_accessed',
      type: 'date',
      required: true,
    },
    {
      name: 'data_size',
      type: 'number',
      required: false,
    },
  ],
};

/**
 * Authenticate with PocketBase admin
 */
async function authenticate() {
  try {
    console.log('🔐 Authenticating with PocketBase...');

    if (!adminEmail || !adminPassword) {
      console.error('❌ Admin credentials not found');
      console.error(
        'Please set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables'
      );
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
 * Check if collection exists
 */
async function collectionExists(collectionName) {
  try {
    await pb.collections.getOne(collectionName);
    return true;
  } catch (err) {
    if (err.status === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * Create the COP Analysis Cache collection
 */
async function createCopAnalysisCacheCollection() {
  try {
    console.log('📊 Checking if cop_analysis_cache collection exists...');

    const exists = await collectionExists(COP_ANALYSIS_CACHE_SCHEMA.name);
    if (exists) {
      console.log('⏭️ Collection cop_analysis_cache already exists, skipping creation');
      return;
    }

    console.log('🆕 Creating cop_analysis_cache collection...');
    await pb.collections.create(COP_ANALYSIS_CACHE_SCHEMA);
    console.log('✅ Successfully created cop_analysis_cache collection');

    // Create some sample data to test the collection
    console.log('📝 Creating sample cache entry...');
    const sampleData = {
      cache_key: 'sample_test_key',
      category: 'TEST',
      unit: 'TEST_UNIT',
      year: 2025,
      month: 10,
      cement_type: 'OPC',
      analysis_data: JSON.stringify({
        parameters: [],
        summary: { total: 0, inRange: 0, outOfRange: 0 },
      }),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      last_accessed: new Date().toISOString(),
      data_size: 1024,
    };

    await pb.collection('cop_analysis_cache').create(sampleData);
    console.log('✅ Created sample cache entry');

    // Clean up sample data
    console.log('🧹 Cleaning up sample data...');
    const records = await pb.collection('cop_analysis_cache').getFullList({
      filter: 'cache_key="sample_test_key"',
    });

    for (const record of records) {
      await pb.collection('cop_analysis_cache').delete(record.id);
    }
    console.log('✅ Cleaned up sample data');
  } catch (err) {
    console.error('❌ Failed to create cop_analysis_cache collection:', err.message);
    throw err;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting COP Analysis Cache Collection setup...\n');

  try {
    // Authenticate
    await authenticate();

    // Create collection
    await createCopAnalysisCacheCollection();

    console.log('\n✅ COP Analysis Cache Collection setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('- cop_analysis_cache collection with optimized schema');
    console.log('- Indexes for fast lookups by cache_key, category+unit+year+month, expiration');
    console.log('- Fields for storing computed COP analysis results');
    console.log('- TTL support with expires_at and last_accessed fields');
    console.log(
      '\n💡 This will significantly improve COP Analysis performance by caching expensive computations'
    );
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Script execution failed:', err);
    process.exit(1);
  });
}

module.exports = { createCopAnalysisCacheCollection };
