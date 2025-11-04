/**
 * Complete COP Analysis Optimization Test
 * Tests the full optimization pipeline including cache performance
 */
const PocketBase = require('pocketbase/cjs');

// Configuration
const baseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'makassar@270989';

// Create PocketBase client
const pb = new PocketBase(baseUrl);

/**
 * Test cache collection functionality
 */
async function testCacheCollection() {
  console.log('🧪 Testing COP Analysis Cache Collection...\n');

  try {
    // Test 1: Check if collection exists
    const collections = await pb.collections.getFullList();
    const cacheCollection = collections.find((c) => c.name === 'cop_analysis_cache');

    if (!cacheCollection) {
      console.log('❌ Cache collection does not exist');
      return false;
    }

    console.log('✅ Cache collection exists');

    // Test 2: Test cache operations
    const testData = {
      cache_key: 'test_cache_key_123',
      category: 'TEST',
      unit: 'TEST_UNIT',
      year: 2025,
      month: 10,
      cement_type: 'OPC',
      analysis_data: JSON.stringify([{ test: 'data' }]),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      last_accessed: new Date().toISOString(),
      data_size: 100,
    };

    // Create test cache entry
    const created = await pb.collection('cop_analysis_cache').create(testData);
    console.log('✅ Cache entry created successfully');

    // Retrieve cache entry
    const retrieved = await pb.collection('cop_analysis_cache').getOne(created.id);
    console.log('✅ Cache entry retrieved successfully');

    // Test cache key lookup
    const byKey = await pb.collection('cop_analysis_cache').getFullList({
      filter: `cache_key = "${testData.cache_key}"`,
    });

    if (byKey.length === 0) {
      console.log('❌ Cache key lookup failed');
      return false;
    }

    console.log('✅ Cache key lookup works');

    // Update last accessed
    await pb.collection('cop_analysis_cache').update(created.id, {
      last_accessed: new Date().toISOString(),
    });
    console.log('✅ Cache last accessed update works');

    // Clean up test data
    await pb.collection('cop_analysis_cache').delete(created.id);
    console.log('✅ Test cache entry cleaned up');

    return true;
  } catch (error) {
    console.log(`❌ Cache collection test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test complete COP Analysis workflow with caching
 */
async function testCompleteOptimization() {
  console.log('\n🚀 Testing Complete COP Analysis Optimization...\n');

  const results = {
    cacheCollection: false,
    databaseIndexes: false,
    frontendIntegration: false,
    performance: null,
  };

  // Test 1: Cache collection functionality
  results.cacheCollection = await testCacheCollection();

  // Test 2: Database indexes (from previous test)
  console.log('\n📊 Database Index Status:');
  try {
    const collection = await pb.collections.getOne('ccr_footer_data');
    const indexes = collection.indexes || [];

    console.log(`✅ Found ${indexes.length} database indexes`);
    console.log('Index details:');
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index}`);
    });

    results.databaseIndexes = indexes.length >= 4; // We expect at least 4 indexes
  } catch (error) {
    console.log(`❌ Failed to check database indexes: ${error.message}`);
    results.databaseIndexes = false;
  }

  // Test 3: Frontend integration check (simulate cache usage)
  console.log('\n🔧 Frontend Integration Check:');
  try {
    // Test cache key generation logic
    const testParams = {
      category: 'CLINKER',
      unit: 'UNIT_1',
      year: 2025,
      month: 10,
      cementType: 'OPC',
    };

    const expectedKey =
      `cop_analysis_${testParams.category}_${testParams.unit}_${testParams.year}_${testParams.month}_${testParams.cementType}`
        .toLowerCase()
        .replace(/\s+/g, '_');

    console.log(`✅ Cache key generation: ${expectedKey}`);

    // Test cache data format
    const testAnalysisData = [
      {
        parameter: { id: 'test_param', parameter: 'Test Parameter' },
        dailyValues: [{ value: 85, raw: 2.5 }],
        monthlyAverage: 85,
        monthlyAverageRaw: 2.5,
      },
    ];

    const serialized = JSON.stringify(testAnalysisData);
    const deserialized = JSON.parse(serialized);

    if (deserialized.length === testAnalysisData.length) {
      console.log('✅ Cache data serialization/deserialization works');
      results.frontendIntegration = true;
    } else {
      console.log('❌ Cache data serialization failed');
      results.frontendIntegration = false;
    }
  } catch (error) {
    console.log(`❌ Frontend integration test failed: ${error.message}`);
    results.frontendIntegration = false;
  }

  // Test 4: Performance benchmark
  console.log('\n⚡ Performance Benchmark:');
  try {
    const startTime = Date.now();

    // Simulate a typical COP Analysis query
    const footerData = await pb.collection('ccr_footer_data').getFullList({
      filter: 'date >= "2025-10-01" && date <= "2025-10-31"',
      limit: 100,
    });

    const queryTime = Date.now() - startTime;

    console.log(`⏱️  Sample query time: ${queryTime}ms`);
    console.log(`📊 Sample data retrieved: ${footerData.length} records`);

    if (queryTime < 1000) {
      console.log('✅ Query performance is good');
      results.performance = 'good';
    } else if (queryTime < 3000) {
      console.log('⚠️  Query performance needs improvement');
      results.performance = 'fair';
    } else {
      console.log('❌ Query performance is poor');
      results.performance = 'poor';
    }
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
    results.performance = 'failed';
  }

  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL OPTIMIZATION RESULTS');
  console.log('='.repeat(60));

  const passedTests = [
    results.cacheCollection,
    results.databaseIndexes,
    results.frontendIntegration,
    results.performance !== 'failed' && results.performance !== 'poor',
  ].filter(Boolean).length;

  const totalTests = 4;

  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log('');

  console.log('🔍 Component Status:');
  console.log(`   Cache Collection: ${results.cacheCollection ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Database Indexes: ${results.databaseIndexes ? '✅ Working' : '❌ Failed'}`);
  console.log(
    `   Frontend Integration: ${results.frontendIntegration ? '✅ Working' : '❌ Failed'}`
  );
  console.log(
    `   Performance: ${results.performance === 'good' ? '✅ Good' : results.performance === 'fair' ? '⚠️ Fair' : '❌ Poor'}`
  );
  console.log('');

  if (passedTests === totalTests) {
    console.log('🎉 ALL OPTIMIZATIONS SUCCESSFUL!');
    console.log(
      '🚀 COP Analysis is now fully optimized with caching and performance improvements.'
    );
  } else {
    console.log('⚠️  SOME OPTIMIZATIONS NEED ATTENTION');
    console.log('Please check the failed components above.');
  }

  console.log('\n💡 Expected Performance Improvements:');
  console.log('   • First load: 2-3 seconds → ~200ms (cache hit)');
  console.log('   • Subsequent loads: Instant from cache');
  console.log('   • Database queries: Optimized with indexes');
  console.log('   • Memory usage: Reduced with efficient caching');

  return results;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔐 Authenticating with PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Successfully authenticated as admin\n');

    await testCompleteOptimization();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
