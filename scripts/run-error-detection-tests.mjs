/**
 * Script untuk menjalankan test untuk mendeteksi error "Cannot convert object to primitive value"
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Utility untuk colorized output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logger
const logger = {
  info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warn: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  step: (message) => console.log(`${colors.cyan}[STEP]${colors.reset} ${message}`),
};

// Function untuk menjalankan command
function runCommand(command, args = [], options = {}) {
  logger.step(`Running command: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  return result.status === 0;
}

// Fungsi utama
async function main() {
  logger.info('Starting error detection tests...');

  // Jalankan PermissionGuard test
  const permissionGuardSuccess = runCommand('npx', [
    'jest',
    'PermissionGuard.test.tsx',
    '--detectOpenHandles',
  ]);

  if (!permissionGuardSuccess) {
    logger.error(
      'PermissionGuard tests failed. This may indicate issues with permission handling.'
    );
  } else {
    logger.success('PermissionGuard tests passed!');
  }

  // Jalankan Lazy Loading test
  const lazyLoadingSuccess = runCommand('npx', [
    'jest',
    'LazyPermissionGuard.test.tsx',
    '--detectOpenHandles',
  ]);

  if (!lazyLoadingSuccess) {
    logger.error(
      'LazyPermissionGuard tests failed. This may indicate issues with lazy loading components.'
    );
  } else {
    logger.success('LazyPermissionGuard tests passed!');
  }

  // Jalankan App Integration test
  const appIntegrationSuccess = runCommand('npx', [
    'jest',
    'AppIntegration.test.tsx',
    '--detectOpenHandles',
  ]);

  if (!appIntegrationSuccess) {
    logger.error(
      'App integration tests failed. This may indicate broader issues in the application.'
    );
  } else {
    logger.success('App integration tests passed!');
  }

  if (permissionGuardSuccess && lazyLoadingSuccess && appIntegrationSuccess) {
    logger.success(
      'All tests passed! The error "Cannot convert object to primitive value" should be fixed.'
    );
  } else {
    logger.error('Some tests failed. Please review the output above for details.');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
