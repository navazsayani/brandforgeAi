/**
 * Test script for the enhanced orphaned images cleanup system
 * This script can be run to test both phases of the cleanup process
 */

import { cleanupOrphanedImagesForUser, cleanupStorageOrphansForUser, scanUserForOrphanedImages } from '@/lib/cleanup-orphaned-images';

async function testCleanupSystem() {
  console.log('🧪 Testing Enhanced Orphaned Images Cleanup System');
  console.log('================================================');

  // Test user ID (replace with actual user ID for testing)
  const testUserId = 'test-user-id';
  
  try {
    console.log('\n📊 Phase 0: Scanning for orphaned images...');
    const scanResult = await scanUserForOrphanedImages(testUserId);
    
    console.log(`Found ${scanResult.totalOrphanedCount} orphaned images:`);
    console.log(`  - Example images: ${scanResult.exampleImages.orphanedCount}`);
    console.log(`  - Library images: ${scanResult.libraryImages.orphanedCount}`);
    
    if (scanResult.totalOrphanedCount === 0) {
      console.log('✅ No orphaned images found. Testing storage orphans only...');
    }

    console.log('\n🔍 Phase 1: Testing database orphans cleanup (DRY RUN)...');
    const phase1Result = await cleanupOrphanedImagesForUser(testUserId, true, true);
    
    console.log('Phase 1 Results:');
    console.log(`  - Would remove ${phase1Result.totalOrphanedCount} DB references`);
    console.log(`  - Would delete ${phase1Result.storageFilesDeleted || 0} storage files`);

    console.log('\n🗂️ Phase 2: Testing storage orphans cleanup (DRY RUN)...');
    const phase2Result = await cleanupStorageOrphansForUser(testUserId, true);
    
    console.log('Phase 2 Results:');
    console.log(`  - Total storage files: ${phase2Result.totalFiles}`);
    console.log(`  - Orphaned files found: ${phase2Result.orphanedFiles}`);
    console.log(`  - Would delete: ${phase2Result.orphanedFiles} files`);
    console.log(`  - Would save: ${formatBytes(phase2Result.savedSpace)} of storage`);
    
    if (phase2Result.errors.length > 0) {
      console.log(`  - Errors: ${phase2Result.errors.length}`);
      phase2Result.errors.forEach(error => console.log(`    ⚠️ ${error}`));
    }

    console.log('\n📈 Summary:');
    const totalDbOrphans = phase1Result.totalOrphanedCount;
    const totalStorageOrphans = phase2Result.orphanedFiles;
    const totalSpaceSaved = phase2Result.savedSpace;
    
    console.log(`  - Total DB orphans: ${totalDbOrphans}`);
    console.log(`  - Total storage orphans: ${totalStorageOrphans}`);
    console.log(`  - Total items to clean: ${totalDbOrphans + totalStorageOrphans}`);
    console.log(`  - Storage space to save: ${formatBytes(totalSpaceSaved)}`);

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 To run actual cleanup (not dry run), set dryRun parameter to false');
    console.log('⚠️ WARNING: Actual cleanup will permanently delete files!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Example usage for testing specific scenarios
async function testSpecificScenarios() {
  console.log('\n🎯 Testing Specific Scenarios');
  console.log('=============================');

  // Test 1: User with no orphans
  console.log('\n1. Testing user with no orphans...');
  try {
    const result = await scanUserForOrphanedImages('user-with-no-orphans');
    console.log(`✅ Clean user test: ${result.totalOrphanedCount} orphans found`);
  } catch (error: any) {
    console.log(`⚠️ Clean user test failed: ${error.message}`);
  }

  // Test 2: User with many orphans
  console.log('\n2. Testing user with many orphans...');
  try {
    const result = await scanUserForOrphanedImages('user-with-many-orphans');
    console.log(`📊 Heavy orphan user test: ${result.totalOrphanedCount} orphans found`);
  } catch (error: any) {
    console.log(`⚠️ Heavy orphan user test failed: ${error.message}`);
  }

  // Test 3: Non-existent user
  console.log('\n3. Testing non-existent user...');
  try {
    const result = await scanUserForOrphanedImages('non-existent-user');
    console.log(`❓ Non-existent user test: ${result.totalOrphanedCount} orphans found`);
  } catch (error: any) {
    console.log(`✅ Non-existent user test correctly failed: ${error.message}`);
  }
}

// Export functions for use in other scripts
export {
  testCleanupSystem,
  testSpecificScenarios,
  formatBytes
};

// Run tests if this script is executed directly
if (require.main === module) {
  console.log('🚀 Starting cleanup system tests...');
  testCleanupSystem()
    .then(() => testSpecificScenarios())
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}