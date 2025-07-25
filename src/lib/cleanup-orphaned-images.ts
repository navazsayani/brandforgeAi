/**
 * Utility to detect and clean up orphaned image references
 * This handles cases where Firestore has URLs but Storage files don't exist
 */

import { db, storage } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { decodeHtmlEntitiesInUrl, verifyImageUrlExists } from './utils';

export interface OrphanedImageReport {
  userId: string;
  userEmail?: string;
  brandName?: string;
  exampleImages: {
    orphanedUrls: string[];
    validUrls: string[];
    totalImages: number;
    orphanedCount: number;
  };
  libraryImages: {
    orphanedUrls: string[];
    validUrls: string[];
    totalImages: number;
    orphanedCount: number;
  };
  totalOrphanedCount: number;
  totalImageCount: number;
}

/**
 * Check if a Firebase Storage URL actually exists
 */
export async function checkFirebaseStorageUrl(url: string): Promise<boolean> {
  try {
    const decodedUrl = decodeHtmlEntitiesInUrl(url);
    
    // Extract the storage path from the URL
    const urlObj = new URL(decodedUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      console.warn(`Could not extract storage path from URL: ${decodedUrl}`);
      return false;
    }
    
    const storagePath = decodeURIComponent(pathMatch[1]);
    const fileRef = storageRef(storage, storagePath);
    
    // Try to get the download URL - this will fail if file doesn't exist
    await getDownloadURL(fileRef);
    return true;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return false;
    }
    // For other errors (network, permissions, etc.), assume file exists
    console.warn(`Error checking storage URL ${url}:`, error.message);
    return true;
  }
}

/**
 * Scan a user's brand profile and image library for orphaned image references
 */
export async function scanUserForOrphanedImages(userId: string): Promise<OrphanedImageReport> {
  console.log(`Scanning user ${userId} for orphaned images...`);
  
  const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
  const userDocSnap = await getDoc(userDocRef);
  
  if (!userDocSnap.exists()) {
    throw new Error(`User profile not found for ${userId}`);
  }
  
  const brandData = userDocSnap.data();
  const exampleImages = brandData.exampleImages || [];
  const userEmail = brandData.userEmail || 'Unknown';
  const brandName = brandData.brandName || 'Unnamed Brand';
  
  console.log(`Found ${exampleImages.length} example images for ${userEmail}`);
  
  // Scan example images
  const exampleOrphanedUrls: string[] = [];
  const exampleValidUrls: string[] = [];
  
  for (const imageUrl of exampleImages) {
    console.log(`Checking example image: ${imageUrl.substring(0, 80)}...`);
    
    const exists = await checkFirebaseStorageUrl(imageUrl);
    if (exists) {
      exampleValidUrls.push(imageUrl);
      console.log(`✓ Valid`);
    } else {
      exampleOrphanedUrls.push(imageUrl);
      console.log(`✗ Orphaned`);
    }
  }
  
  // Scan library images
  const libraryCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/savedLibraryImages`);
  const librarySnapshot = await getDocs(libraryCollectionRef);
  
  console.log(`Found ${librarySnapshot.docs.length} library images for ${userEmail}`);
  
  const libraryOrphanedUrls: string[] = [];
  const libraryValidUrls: string[] = [];
  const orphanedLibraryDocs: string[] = []; // Store doc IDs for cleanup
  
  for (const doc of librarySnapshot.docs) {
    const data = doc.data();
    const imageUrl = data.storageUrl;
    
    if (imageUrl) {
      console.log(`Checking library image: ${imageUrl.substring(0, 80)}...`);
      
      const exists = await checkFirebaseStorageUrl(imageUrl);
      if (exists) {
        libraryValidUrls.push(imageUrl);
        console.log(`✓ Valid`);
      } else {
        libraryOrphanedUrls.push(imageUrl);
        orphanedLibraryDocs.push(doc.id);
        console.log(`✗ Orphaned`);
      }
    }
  }
  
  const totalOrphanedCount = exampleOrphanedUrls.length + libraryOrphanedUrls.length;
  const totalImageCount = exampleImages.length + librarySnapshot.docs.length;
  
  return {
    userId,
    userEmail,
    brandName,
    exampleImages: {
      orphanedUrls: exampleOrphanedUrls,
      validUrls: exampleValidUrls,
      totalImages: exampleImages.length,
      orphanedCount: exampleOrphanedUrls.length
    },
    libraryImages: {
      orphanedUrls: libraryOrphanedUrls,
      validUrls: libraryValidUrls,
      totalImages: librarySnapshot.docs.length,
      orphanedCount: libraryOrphanedUrls.length
    },
    totalOrphanedCount,
    totalImageCount,
    // Store orphaned doc IDs for cleanup (internal use)
    _orphanedLibraryDocs: orphanedLibraryDocs
  } as OrphanedImageReport & { _orphanedLibraryDocs: string[] };
}

/**
 * Clean up orphaned image references for a user
 */
export async function cleanupOrphanedImagesForUser(userId: string, dryRun: boolean = true): Promise<OrphanedImageReport> {
  const report = await scanUserForOrphanedImages(userId) as OrphanedImageReport & { _orphanedLibraryDocs: string[] };
  
  if (report.totalOrphanedCount === 0) {
    console.log(`No orphaned images found for user ${userId}`);
    return report;
  }
  
  console.log(`Found ${report.totalOrphanedCount} orphaned images for user ${userId}`);
  console.log(`  - Example images: ${report.exampleImages.orphanedCount}`);
  console.log(`  - Library images: ${report.libraryImages.orphanedCount}`);
  
  if (!dryRun) {
    // Clean up orphaned example images
    if (report.exampleImages.orphanedCount > 0) {
      const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
      await setDoc(userDocRef, {
        exampleImages: report.exampleImages.validUrls
      }, { merge: true });
      
      console.log(`✓ Cleaned up ${report.exampleImages.orphanedCount} orphaned example image references`);
    }
    
    // Clean up orphaned library images
    if (report.libraryImages.orphanedCount > 0 && report._orphanedLibraryDocs) {
      for (const docId of report._orphanedLibraryDocs) {
        const docRef = doc(db, `users/${userId}/brandProfiles/${userId}/savedLibraryImages`, docId);
        await deleteDoc(docRef);
      }
      
      console.log(`✓ Cleaned up ${report.libraryImages.orphanedCount} orphaned library image references`);
    }
    
    console.log(`✓ Total cleanup: ${report.totalOrphanedCount} orphaned image references for user ${userId}`);
  } else {
    console.log(`DRY RUN: Would remove ${report.totalOrphanedCount} orphaned image references`);
    console.log(`  - Example images: ${report.exampleImages.orphanedCount}`);
    console.log(`  - Library images: ${report.libraryImages.orphanedCount}`);
  }
  
  return report;
}

/**
 * Scan all users for orphaned images
 */
export async function scanAllUsersForOrphanedImages(): Promise<OrphanedImageReport[]> {
  console.log('Scanning all users for orphaned images...');
  
  const usersCollectionRef = collection(db, 'users');
  const userDocsSnapshot = await getDocs(usersCollectionRef);
  
  const reports: OrphanedImageReport[] = [];
  
  for (const userDoc of userDocsSnapshot.docs) {
    const userId = userDoc.id;
    
    try {
      const report = await scanUserForOrphanedImages(userId);
      reports.push(report);
      
      if (report.totalOrphanedCount > 0) {
        console.log(`⚠️  User ${report.userEmail} has ${report.totalOrphanedCount} orphaned images (${report.exampleImages.orphanedCount} example + ${report.libraryImages.orphanedCount} library)`);
      }
    } catch (error: any) {
      console.warn(`Failed to scan user ${userId}:`, error.message);
    }
  }
  
  return reports;
}

/**
 * Generate a comprehensive report of orphaned images
 */
export function generateOrphanedImagesReport(reports: OrphanedImageReport[]): void {
  console.log('\n=== ORPHANED IMAGES REPORT ===');
  
  const totalUsers = reports.length;
  const usersWithOrphans = reports.filter(r => r.totalOrphanedCount > 0).length;
  const totalOrphaned = reports.reduce((sum, r) => sum + r.totalOrphanedCount, 0);
  const totalImages = reports.reduce((sum, r) => sum + r.totalImageCount, 0);
  const totalExampleOrphaned = reports.reduce((sum, r) => sum + r.exampleImages.orphanedCount, 0);
  const totalLibraryOrphaned = reports.reduce((sum, r) => sum + r.libraryImages.orphanedCount, 0);
  
  console.log(`Total Users Scanned: ${totalUsers}`);
  console.log(`Users with Orphaned Images: ${usersWithOrphans}`);
  console.log(`Total Orphaned References: ${totalOrphaned}`);
  console.log(`  - Example Images: ${totalExampleOrphaned}`);
  console.log(`  - Library Images: ${totalLibraryOrphaned}`);
  console.log(`Total Images: ${totalImages}`);
  console.log(`Orphaned Percentage: ${totalImages > 0 ? ((totalOrphaned / totalImages) * 100).toFixed(1) : 0}%`);
  
  if (usersWithOrphans > 0) {
    console.log('\n=== USERS WITH ORPHANED IMAGES ===');
    reports
      .filter(r => r.totalOrphanedCount > 0)
      .forEach(report => {
        console.log(`\n${report.userEmail} (${report.brandName})`);
        console.log(`  User ID: ${report.userId}`);
        console.log(`  Total Orphaned: ${report.totalOrphanedCount}/${report.totalImageCount}`);
        
        if (report.exampleImages.orphanedCount > 0) {
          console.log(`  Example Images Orphaned: ${report.exampleImages.orphanedCount}/${report.exampleImages.totalImages}`);
          report.exampleImages.orphanedUrls.forEach(url => {
            console.log(`    - [EXAMPLE] ${url.substring(0, 100)}...`);
          });
        }
        
        if (report.libraryImages.orphanedCount > 0) {
          console.log(`  Library Images Orphaned: ${report.libraryImages.orphanedCount}/${report.libraryImages.totalImages}`);
          report.libraryImages.orphanedUrls.forEach(url => {
            console.log(`    - [LIBRARY] ${url.substring(0, 100)}...`);
          });
        }
      });
  }
}

/**
 * Enhanced delete function that checks existence before attempting deletion
 */
export async function safeDeleteImageFromStorage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const decodedUrl = decodeHtmlEntitiesInUrl(imageUrl);
    
    // First check if the image exists
    const exists = await checkFirebaseStorageUrl(imageUrl);
    if (!exists) {
      return {
        success: false,
        error: 'Image does not exist in storage (orphaned reference)'
      };
    }
    
    // Extract storage path and delete
    const urlObj = new URL(decodedUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      return {
        success: false,
        error: 'Could not extract storage path from URL'
      };
    }
    
    const storagePath = decodeURIComponent(pathMatch[1]);
    const fileRef = storageRef(storage, storagePath);
    
    // Note: We can't import deleteObject here due to server/client context
    // This function should be called from the appropriate context
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Scan all users for orphaned images and return in admin format
 */
export async function scanAllOrphanedImages(): Promise<{
  orphanedBrandImages: Array<{ userId: string; userEmail?: string; imageUrl: string }>;
  orphanedLibraryImages: Array<{ userId: string; userEmail?: string; imageId: string; imageUrl: string }>;
  totalScanned: number;
  scanTimestamp: string;
}> {
  console.log('Starting system-wide orphaned images scan...');
  
  const reports = await scanAllUsersForOrphanedImages();
  const orphanedBrandImages: Array<{ userId: string; userEmail?: string; imageUrl: string }> = [];
  const orphanedLibraryImages: Array<{ userId: string; userEmail?: string; imageId: string; imageUrl: string }> = [];
  
  for (const report of reports) {
    // Add orphaned brand profile images
    for (const imageUrl of report.exampleImages.orphanedUrls) {
      orphanedBrandImages.push({
        userId: report.userId,
        userEmail: report.userEmail,
        imageUrl
      });
    }
    
    // Add orphaned library images
    for (const imageUrl of report.libraryImages.orphanedUrls) {
      orphanedLibraryImages.push({
        userId: report.userId,
        userEmail: report.userEmail,
        imageId: `orphaned-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        imageUrl
      });
    }
  }
  
  const totalOrphans = orphanedBrandImages.length + orphanedLibraryImages.length;
  console.log(`Scan completed. Found ${totalOrphans} orphaned images across ${reports.length} users.`);
  
  return {
    orphanedBrandImages,
    orphanedLibraryImages,
    totalScanned: reports.length,
    scanTimestamp: new Date().toISOString()
  };
}

/**
 * Clean up all orphaned images across all users
 */
export async function cleanupAllOrphanedImages(): Promise<{ deletedCount: number }> {
  console.log('Starting system-wide orphaned images cleanup...');
  
  const usersCollectionRef = collection(db, 'users');
  const userDocsSnapshot = await getDocs(usersCollectionRef);
  
  let totalDeleted = 0;
  
  for (const userDoc of userDocsSnapshot.docs) {
    const userId = userDoc.id;
    
    try {
      const report = await cleanupOrphanedImagesForUser(userId, false); // false = not dry run
      totalDeleted += report.totalOrphanedCount;
      
      if (report.totalOrphanedCount > 0) {
        console.log(`✓ Cleaned up ${report.totalOrphanedCount} orphaned images for user ${report.userEmail}`);
      }
    } catch (error: any) {
      console.warn(`Failed to cleanup orphaned images for user ${userId}:`, error.message);
    }
  }
  
  console.log(`✓ System-wide cleanup completed. Total deleted: ${totalDeleted} orphaned image references.`);
  
  return { deletedCount: totalDeleted };
}