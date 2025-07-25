/**
 * Admin script to scan and cleanup orphaned images
 * Run this in the browser console or as a Node.js script
 */

import { scanAllUsersForOrphanedImages, generateOrphanedImagesReport, cleanupOrphanedImagesForUser } from './cleanup-orphaned-images';

/**
 * Main cleanup function - run this to scan and optionally clean up orphaned images
 */
export async function runOrphanedImageCleanup(options: {
  dryRun?: boolean;
  userId?: string; // If specified, only scan this user
  autoCleanup?: boolean; // If true, automatically clean up orphaned references
} = {}) {
  const { dryRun = true, userId, autoCleanup = false } = options;
  
  console.log('🧹 Starting Orphaned Image Cleanup...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}`);
  
  try {
    if (userId) {
      // Scan specific user
      console.log(`Scanning user: ${userId}`);
      const report = await cleanupOrphanedImagesForUser(userId, dryRun);
      
      console.log('\n=== SINGLE USER REPORT ===');
      console.log(`User: ${report.userEmail} (${report.brandName})`);
      console.log(`Total Images: ${report.totalImages}`);
      console.log(`Orphaned: ${report.orphanedCount}`);
      
      if (report.orphanedCount > 0) {
        console.log('Orphaned URLs:');
        report.orphanedUrls.forEach(url => {
          console.log(`  - ${url}`);
        });
      }
    } else {
      // Scan all users
      console.log('Scanning all users...');
      const reports = await scanAllUsersForOrphanedImages();
      
      generateOrphanedImagesReport(reports);
      
      if (autoCleanup && !dryRun) {
        console.log('\n🔧 Auto-cleaning up orphaned references...');
        
        for (const report of reports) {
          if (report.orphanedCount > 0) {
            console.log(`Cleaning up ${report.orphanedCount} orphaned images for ${report.userEmail}...`);
            await cleanupOrphanedImagesForUser(report.userId, false);
          }
        }
        
        console.log('✅ Auto-cleanup completed!');
      }
    }
    
    console.log('\n✅ Orphaned image scan completed!');
    
    if (dryRun) {
      console.log('\n💡 To actually clean up orphaned references, run with dryRun: false');
      console.log('Example: runOrphanedImageCleanup({ dryRun: false, autoCleanup: true })');
    }
    
  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  }
}

/**
 * Quick function to check a specific image URL
 */
export async function checkSpecificImageUrl(url: string) {
  const { checkFirebaseStorageUrl } = await import('./cleanup-orphaned-images');
  
  console.log(`Checking URL: ${url}`);
  
  try {
    const exists = await checkFirebaseStorageUrl(url);
    console.log(`Result: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    return exists;
  } catch (error: any) {
    console.error(`Error checking URL: ${error.message}`);
    return false;
  }
}

// Export for browser console use
if (typeof window !== 'undefined') {
  (window as any).runOrphanedImageCleanup = runOrphanedImageCleanup;
  (window as any).checkSpecificImageUrl = checkSpecificImageUrl;
  
  console.log('🔧 Admin cleanup functions loaded!');
  console.log('Available functions:');
  console.log('  - runOrphanedImageCleanup({ dryRun: true })');
  console.log('  - checkSpecificImageUrl("your-url-here")');
}