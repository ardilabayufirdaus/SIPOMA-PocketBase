import { runPermissionPersistenceTest } from './permission-persistence.test';

/**
 * Automated test runner for permission persistence
 * Run this in browser console to test permission saving/loading
 */
export const runAutomatedTests = async () => {
  console.log('🚀 Starting Automated Permission Persistence Tests');
  console.log('='.repeat(60));

  try {
    const result = await runPermissionPersistenceTest();

    if (result) {
      console.log('✅ All tests passed! Permission persistence is working correctly.');
    } else {
      console.log('❌ Some tests failed. Permission persistence has issues.');
    }

    return result;
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    return false;
  }
};

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🔧 Permission Persistence Test Runner loaded');
  console.log('💡 Run: runAutomatedTests() to start testing');

  // Make it available globally
  (window as any).runAutomatedTests = runAutomatedTests;
}
