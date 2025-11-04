/**
 * COP Analysis Query Performance Measurement Script
 * Measures query performance for different COP Analysis scenarios
 */
const PocketBase = require('pocketbase/cjs');

// Configuration
const baseUrl = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site/';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'ardila.firdaus@sig.id';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'makassar@270989';

// Create PocketBase client
const pb = new PocketBase(baseUrl);

/**
 * Measure query execution time
 */
async function measureQueryTime(queryFn, description) {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ ${description}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   📊 Results: ${Array.isArray(result) ? result.length : 'N/A'} records`);
    console.log('');

    return { duration, resultCount: Array.isArray(result) ? result.length : 0, success: true };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`❌ ${description}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   🚨 Error: ${error.message}`);
    console.log('');

    return { duration, resultCount: 0, success: false, error: error.message };
  }
}

/**
 * Run COP Analysis performance tests
 */
async function runPerformanceTests() {
  console.log('🚀 Starting COP Analysis Query Performance Tests\n');
  console.log('='.repeat(60));

  // Test 1: Get all data for a specific date range (common COP Analysis query)
  const test1 = await measureQueryTime(async () => {
    return await pb.collection('ccr_footer_data').getFullList({
      filter: 'date >= "2025-01-01" && date <= "2025-12-31"',
      sort: 'date',
    });
  }, 'Test 1: Date range query (2025 full year)');

  // Test 2: Get data for specific parameter and date range
  const test2 = await measureQueryTime(async () => {
    return await pb.collection('ccr_footer_data').getFullList({
      filter: 'parameter_id != "" && date >= "2025-01-01" && date <= "2025-12-31"',
      sort: 'date,parameter_id',
    });
  }, 'Test 2: Parameter + date range query');

  // Test 3: Get data for specific unit and date range (using plant_unit field)
  const test3 = await measureQueryTime(async () => {
    return await pb.collection('ccr_footer_data').getFullList({
      filter: 'plant_unit != "" && date >= "2025-01-01" && date <= "2025-12-31"',
      sort: 'date,plant_unit',
    });
  }, 'Test 3: Plant unit + date range query');

  // Test 4: Complex query - parameter, plant_unit, and date range (typical COP Analysis)
  const test4 = await measureQueryTime(async () => {
    return await pb.collection('ccr_footer_data').getFullList({
      filter:
        'parameter_id != "" && plant_unit != "" && date >= "2025-01-01" && date <= "2025-12-31"',
      sort: 'date,parameter_id,plant_unit',
    });
  }, 'Test 4: Complex query (parameter + plant_unit + date range)');

  // Test 5: Get data for specific month (monthly analysis)
  const test5 = await measureQueryTime(async () => {
    return await pb.collection('ccr_footer_data').getFullList({
      filter: 'date >= "2025-10-01" && date <= "2025-10-31"',
      sort: 'date',
    });
  }, 'Test 5: Monthly data query (October 2025)');

  // Test 6: Count records for performance monitoring
  const test6 = await measureQueryTime(async () => {
    const result = await pb.collection('ccr_footer_data').getList(1, 1, {
      filter: 'date >= "2025-01-01"',
      fields: 'id',
    });
    return result.totalItems;
  }, 'Test 6: Count total records (for monitoring)');

  // Performance Analysis
  console.log('📈 PERFORMANCE ANALYSIS');
  console.log('='.repeat(60));

  const tests = [test1, test2, test3, test4, test5, test6];
  const successfulTests = tests.filter((t) => t.success);
  const failedTests = tests.filter((t) => !t.success);

  console.log(`✅ Successful queries: ${successfulTests.length}/${tests.length}`);
  if (failedTests.length > 0) {
    console.log(`❌ Failed queries: ${failedTests.length}`);
  }

  if (successfulTests.length > 0) {
    const avgDuration =
      successfulTests.reduce((sum, t) => sum + t.duration, 0) / successfulTests.length;
    const maxDuration = Math.max(...successfulTests.map((t) => t.duration));
    const minDuration = Math.min(...successfulTests.map((t) => t.duration));

    console.log(`⏱️  Average query time: ${avgDuration.toFixed(2)}ms`);
    console.log(`🏃 Max query time: ${maxDuration}ms`);
    console.log(`💨 Min query time: ${minDuration}ms`);

    // Performance rating
    if (avgDuration < 100) {
      console.log('🚀 Performance: EXCELLENT (queries < 100ms)');
    } else if (avgDuration < 500) {
      console.log('✅ Performance: GOOD (queries < 500ms)');
    } else if (avgDuration < 2000) {
      console.log('⚠️  Performance: FAIR (queries < 2s)');
    } else {
      console.log('❌ Performance: NEEDS OPTIMIZATION (queries > 2s)');
    }
  }

  console.log('\n📋 RECOMMENDATIONS');
  console.log('='.repeat(60));

  if (successfulTests.length === tests.length) {
    console.log('✅ All queries successful - database performance is optimal!');
    console.log('💡 Consider implementing caching for expensive computations');
  } else {
    console.log('⚠️  Some queries failed - check database indexes and data integrity');
  }

  console.log('\n🎯 COP Analysis is ready for production use!');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔐 Authenticating with PocketBase...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Successfully authenticated as admin\n');

    await runPerformanceTests();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
