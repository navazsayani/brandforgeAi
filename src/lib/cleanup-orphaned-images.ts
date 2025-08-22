/**
 * Utility to detect and clean up orphaned image references
 * This handles cases where Firestore has URLs but Storage files don't exist
 * AND cases where Storage files exist but have no Firestore references
 */

import { db, storage } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL, deleteObject } from 'firebase/storage';
import { decodeHtmlEntitiesInUrl, verifyImageUrlExists } from './utils';
import { ensureFirebaseAdminInitialized } from './firebase-admin';
import admin from 'firebase-admin';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
ensureFirebaseAdminInitialized();

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
  logoImages: {
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
 * Scan a user's brand logos for dormant/inactive ones
 */
export async function scanUserForDormantLogos(userId: string, dormantThresholdDays: number = 90): Promise<{
  userId: string;
  userEmail?: string;
  brandName?: string;
  dormantLogos: Array<{
    logoId: string;
    logoUrl: string;
    lastUpdated: Date;
    daysSinceUpdate: number;
  }>;
  totalLogos: number;
  dormantCount: number;
}> {
  console.log(`Scanning user ${userId} for dormant logos (threshold: ${dormantThresholdDays} days)...`);
  
  const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
  const userDocSnap = await getDoc(userDocRef);
  
  if (!userDocSnap.exists()) {
    throw new Error(`User profile not found for ${userId}`);
  }
  
  const brandData = userDocSnap.data();
  const userEmail = brandData.userEmail || 'Unknown';
  const brandName = brandData.brandName || 'Unnamed Brand';
  
  // Scan brand logos collection
  const logosCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/brandLogos`);
  const logosSnapshot = await getDocs(logosCollectionRef);
  
  console.log(`Found ${logosSnapshot.docs.length} logos for ${userEmail}`);
  
  const dormantLogos: Array<{
    logoId: string;
    logoUrl: string;
    lastUpdated: Date;
    daysSinceUpdate: number;
  }> = [];
  
  const dormantThresholdMs = dormantThresholdDays * 24 * 60 * 60 * 1000;
  const now = new Date();
  
  for (const logoDoc of logosSnapshot.docs) {
    const logoData = logoDoc.data();
    const logoUrl = logoData.logoUrl;
    
    if (!logoUrl) continue; // Skip logos without URLs
    
    // Get the last updated timestamp
    const updatedAt = logoData.updatedAt || logoData.createdAt;
    const lastUpdated = updatedAt?.toDate ? updatedAt.toDate() : new Date(updatedAt || 0);
    const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
    const daysSinceUpdate = Math.floor(timeSinceUpdate / (24 * 60 * 60 * 1000));
    
    console.log(`Checking logo ${logoDoc.id}: last updated ${daysSinceUpdate} days ago`);
    
    // Check if logo is dormant
    if (timeSinceUpdate > dormantThresholdMs) {
      // Additional check: Skip the 'currentLogo' if it's the only logo (active brand logo)
      if (logoDoc.id === 'currentLogo' && logosSnapshot.docs.length === 1) {
        console.log(`Skipping currentLogo as it's the only logo for user ${userId}`);
        continue;
      }
      
      dormantLogos.push({
        logoId: logoDoc.id,
        logoUrl,
        lastUpdated,
        daysSinceUpdate
      });
      console.log(`✗ Logo ${logoDoc.id} is dormant (${daysSinceUpdate} days old)`);
    } else {
      console.log(`✓ Logo ${logoDoc.id} is active`);
    }
  }
  
  return {
    userId,
    userEmail,
    brandName,
    dormantLogos,
    totalLogos: logosSnapshot.docs.length,
    dormantCount: dormantLogos.length
  };
}

/**
 * Clean up dormant logos for a user
 */
export async function cleanupDormantLogosForUser(
  userId: string,
  dormantThresholdDays: number = 90,
  dryRun: boolean = true
): Promise<{
  userId: string;
  userEmail?: string;
  deletedLogos: number;
  deletedStorageFiles: number;
  savedSpace: number;
  errors: string[];
}> {
  const dormantScan = await scanUserForDormantLogos(userId, dormantThresholdDays);
  
  if (dormantScan.dormantCount === 0) {
    console.log(`No dormant logos found for user ${userId}`);
    return {
      userId,
      userEmail: dormantScan.userEmail,
      deletedLogos: 0,
      deletedStorageFiles: 0,
      savedSpace: 0,
      errors: []
    };
  }
  
  console.log(`Found ${dormantScan.dormantCount} dormant logos for user ${userId}`);
  
  let deletedLogos = 0;
  let deletedStorageFiles = 0;
  let savedSpace = 0;
  const errors: string[] = [];
  
  if (!dryRun) {
    for (const dormantLogo of dormantScan.dormantLogos) {
      try {
        // Delete from Firestore
        const logoDocRef = doc(db, `users/${userId}/brandProfiles/${userId}/brandLogos`, dormantLogo.logoId);
        await deleteDoc(logoDocRef);
        deletedLogos++;
        console.log(`✓ Deleted dormant logo document: ${dormantLogo.logoId}`);
        
        // Delete from Storage
        const deleteResult = await safeDeleteImageFromStorage(dormantLogo.logoUrl, false);
        if (deleteResult.success && deleteResult.deleted) {
          deletedStorageFiles++;
          // Estimate saved space (we don't have exact file size, so estimate)
          savedSpace += 100 * 1024; // Estimate 100KB per logo
          console.log(`✓ Deleted dormant logo storage file: ${dormantLogo.logoUrl}`);
        } else if (deleteResult.error) {
          console.warn(`Warning deleting storage file: ${deleteResult.error}`);
        }
        
      } catch (error: any) {
        const errorMsg = `Failed to delete dormant logo ${dormantLogo.logoId}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    console.log(`✓ Cleaned up ${deletedLogos} dormant logos for user ${userId}`);
  } else {
    console.log(`DRY RUN: Would delete ${dormantScan.dormantCount} dormant logos for user ${userId}`);
    dormantScan.dormantLogos.forEach(logo => {
      console.log(`  - Would delete: ${logo.logoId} (${logo.daysSinceUpdate} days old)`);
    });
  }
  
  return {
    userId,
    userEmail: dormantScan.userEmail,
    deletedLogos,
    deletedStorageFiles,
    savedSpace,
    errors
  };
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
  
  // Scan brand logos
  const logosCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/brandLogos`);
  const logosSnapshot = await getDocs(logosCollectionRef);
  
  console.log(`Found ${logosSnapshot.docs.length} brand logos for ${userEmail}`);
  
  const logoOrphanedUrls: string[] = [];
  const logoValidUrls: string[] = [];
  const orphanedLogoDocs: string[] = []; // Store doc IDs for cleanup
  
  for (const logoDoc of logosSnapshot.docs) {
    const logoData = logoDoc.data();
    const logoUrl = logoData.logoUrl;
    
    if (logoUrl) {
      console.log(`Checking brand logo: ${logoUrl.substring(0, 80)}...`);
      
      const exists = await checkFirebaseStorageUrl(logoUrl);
      if (exists) {
        logoValidUrls.push(logoUrl);
        console.log(`✓ Valid`);
      } else {
        logoOrphanedUrls.push(logoUrl);
        orphanedLogoDocs.push(logoDoc.id);
        console.log(`✗ Orphaned`);
      }
    }
  }
  
  const totalOrphanedCount = exampleOrphanedUrls.length + libraryOrphanedUrls.length + logoOrphanedUrls.length;
  const totalImageCount = exampleImages.length + librarySnapshot.docs.length + logosSnapshot.docs.length;
  
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
    logoImages: {
      orphanedUrls: logoOrphanedUrls,
      validUrls: logoValidUrls,
      totalImages: logosSnapshot.docs.length,
      orphanedCount: logoOrphanedUrls.length
    },
    totalOrphanedCount,
    totalImageCount,
    // Store orphaned doc IDs for cleanup (internal use)
    _orphanedLibraryDocs: orphanedLibraryDocs,
    _orphanedLogoDocs: orphanedLogoDocs
  } as OrphanedImageReport & { _orphanedLibraryDocs: string[]; _orphanedLogoDocs: string[] };
}

/**
 * Clean up orphaned image references for a user (Phase 1: Enhanced with storage deletion)
 */
export async function cleanupOrphanedImagesForUser(userId: string, dryRun: boolean = true, deleteStorageFiles: boolean = true): Promise<OrphanedImageReport & { storageFilesDeleted?: number }> {
  const report = await scanUserForOrphanedImages(userId) as OrphanedImageReport & { _orphanedLibraryDocs: string[]; _orphanedLogoDocs: string[] };
  
  if (report.totalOrphanedCount === 0) {
    console.log(`No orphaned images found for user ${userId}`);
    return report;
  }
  
  console.log(`Found ${report.totalOrphanedCount} orphaned images for user ${userId}`);
  console.log(`  - Example images: ${report.exampleImages.orphanedCount}`);
  console.log(`  - Library images: ${report.libraryImages.orphanedCount}`);
  console.log(`  - Logo images: ${report.logoImages.orphanedCount}`);
  
  let storageFilesDeleted = 0;
  
  if (!dryRun) {
    // Clean up orphaned example images
    if (report.exampleImages.orphanedCount > 0) {
      // Delete storage files first (if enabled)
      if (deleteStorageFiles) {
        for (const orphanUrl of report.exampleImages.orphanedUrls) {
          const deleteResult = await safeDeleteImageFromStorage(orphanUrl, true);
          if (deleteResult.success && deleteResult.deleted) {
            storageFilesDeleted++;
          }
        }
      }
      
      // Then clean up database references
      const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
      await setDoc(userDocRef, {
        exampleImages: report.exampleImages.validUrls
      }, { merge: true });
      
      console.log(`✓ Cleaned up ${report.exampleImages.orphanedCount} orphaned example image references`);
    }
    
    // Clean up orphaned library images
    if (report.libraryImages.orphanedCount > 0 && report._orphanedLibraryDocs) {
      // Delete storage files first (if enabled)
      if (deleteStorageFiles) {
        for (const orphanUrl of report.libraryImages.orphanedUrls) {
          const deleteResult = await safeDeleteImageFromStorage(orphanUrl, true);
          if (deleteResult.success && deleteResult.deleted) {
            storageFilesDeleted++;
          }
        }
      }
      
      // Then clean up database references
      for (const docId of report._orphanedLibraryDocs) {
        const docRef = doc(db, `users/${userId}/brandProfiles/${userId}/savedLibraryImages`, docId);
        await deleteDoc(docRef);
      }
      
      console.log(`✓ Cleaned up ${report.libraryImages.orphanedCount} orphaned library image references`);
    }
    
    // Clean up orphaned logo images
    if (report.logoImages.orphanedCount > 0 && report._orphanedLogoDocs) {
      // Delete storage files first (if enabled)
      if (deleteStorageFiles) {
        for (const orphanUrl of report.logoImages.orphanedUrls) {
          const deleteResult = await safeDeleteImageFromStorage(orphanUrl, true);
          if (deleteResult.success && deleteResult.deleted) {
            storageFilesDeleted++;
          }
        }
      }
      
      // Then clean up database references
      for (const docId of report._orphanedLogoDocs) {
        const docRef = doc(db, `users/${userId}/brandProfiles/${userId}/brandLogos`, docId);
        await deleteDoc(docRef);
      }
      
      console.log(`✓ Cleaned up ${report.logoImages.orphanedCount} orphaned logo image references`);
    }
    
    console.log(`✓ Total cleanup: ${report.totalOrphanedCount} orphaned image references for user ${userId}`);
    if (deleteStorageFiles) {
      console.log(`✓ Deleted ${storageFilesDeleted} storage files`);
    }
  } else {
    console.log(`DRY RUN: Would remove ${report.totalOrphanedCount} orphaned image references`);
    console.log(`  - Example images: ${report.exampleImages.orphanedCount}`);
    console.log(`  - Library images: ${report.libraryImages.orphanedCount}`);
    console.log(`  - Logo images: ${report.logoImages.orphanedCount}`);
    if (deleteStorageFiles) {
      console.log(`  - Would also delete ${report.totalOrphanedCount} storage files`);
    }
  }
  
  return { ...report, storageFilesDeleted };
}

/**
 * Phase 2: Clean up storage files that have no database references
 */
export async function cleanupStorageOrphansForUser(userId: string, dryRun: boolean = true, minFileAge: number = 7 * 24 * 60 * 60 * 1000): Promise<{
  totalFiles: number;
  orphanedFiles: number;
  deletedFiles: number;
  savedSpace: number;
  errors: string[];
}> {
  console.log(`Scanning storage orphans for user ${userId}...`);
  
  const userStorageFiles = await listUserStorageFiles(userId);
  const orphanedFiles: Array<{ path: string; size: number }> = [];
  const errors: string[] = [];
  
  console.log(`Found ${userStorageFiles.length} storage files for user ${userId}`);
  
  // Check each storage file for database references
  for (const file of userStorageFiles) {
    try {
      // Skip files that are too new (safety measure)
      const fileAge = Date.now() - file.created.getTime();
      if (fileAge < minFileAge) {
        console.log(`Skipping recent file: ${file.path} (age: ${Math.round(fileAge / (24 * 60 * 60 * 1000))} days)`);
        continue;
      }
      
      // Check if file has database reference
      const hasDbRef = await checkDatabaseReference(userId, file.url);
      if (!hasDbRef) {
        orphanedFiles.push({ path: file.path, size: file.size });
        console.log(`Found storage orphan: ${file.path}`);
      }
    } catch (error: any) {
      errors.push(`Error checking file ${file.path}: ${error.message}`);
    }
  }
  
  let deletedFiles = 0;
  let savedSpace = 0;
  
  if (!dryRun && orphanedFiles.length > 0) {
    console.log(`Deleting ${orphanedFiles.length} orphaned storage files...`);
    
    for (const file of orphanedFiles) {
      try {
        const bucket = getAdminStorage().bucket();
        await bucket.file(file.path).delete();
        deletedFiles++;
        savedSpace += file.size;
        console.log(`✓ Deleted orphaned storage file: ${file.path}`);
      } catch (error: any) {
        errors.push(`Failed to delete ${file.path}: ${error.message}`);
      }
    }
  }
  
  const result = {
    totalFiles: userStorageFiles.length,
    orphanedFiles: orphanedFiles.length,
    deletedFiles,
    savedSpace,
    errors
  };
  
  if (dryRun) {
    console.log(`DRY RUN: Would delete ${orphanedFiles.length} orphaned storage files (${formatBytes(orphanedFiles.reduce((sum, f) => sum + f.size, 0))})`);
  } else {
    console.log(`✓ Storage cleanup complete: deleted ${deletedFiles} files, saved ${formatBytes(savedSpace)}`);
  }
  
  return result;
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        console.log(`⚠️  User ${report.userEmail} has ${report.totalOrphanedCount} orphaned images (${report.exampleImages.orphanedCount} example + ${report.libraryImages.orphanedCount} library + ${report.logoImages.orphanedCount} logo)`);
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
  const totalLogoOrphaned = reports.reduce((sum, r) => sum + r.logoImages.orphanedCount, 0);
  
  console.log(`Total Users Scanned: ${totalUsers}`);
  console.log(`Users with Orphaned Images: ${usersWithOrphans}`);
  console.log(`Total Orphaned References: ${totalOrphaned}`);
  console.log(`  - Example Images: ${totalExampleOrphaned}`);
  console.log(`  - Library Images: ${totalLibraryOrphaned}`);
  console.log(`  - Logo Images: ${totalLogoOrphaned}`);
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
 * Enhanced delete function that safely deletes storage files
 */
export async function safeDeleteImageFromStorage(imageUrl: string, skipExistenceCheck: boolean = false): Promise<{ success: boolean; error?: string; deleted?: boolean }> {
  try {
    const decodedUrl = decodeHtmlEntitiesInUrl(imageUrl);
    
    // Check if the image exists (unless skipped)
    if (!skipExistenceCheck) {
      const exists = await checkFirebaseStorageUrl(imageUrl);
      if (!exists) {
        return {
          success: true,
          deleted: false,
          error: 'Image does not exist in storage (already cleaned up)'
        };
      }
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
    
    // Delete the actual storage file
    await deleteObject(fileRef);
    console.log(`✓ Deleted storage file: ${storagePath}`);
    
    return { success: true, deleted: true };
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return {
        success: true,
        deleted: false,
        error: 'File already deleted or does not exist'
      };
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get file age from Firebase Storage using Admin SDK
 */
export async function getStorageFileAge(storagePath: string): Promise<number | null> {
  try {
    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);
    const [metadata] = await file.getMetadata();
    const created = new Date(metadata.timeCreated || Date.now());
    return Date.now() - created.getTime();
  } catch (error: any) {
    console.warn(`Could not get file age for ${storagePath}:`, error.message);
    return null;
  }
}

/**
 * List all storage files for a user using Admin SDK
 */
export async function listUserStorageFiles(userId: string): Promise<Array<{
  path: string;
  url: string;
  size: number;
  created: Date;
}>> {
  try {
    const bucket = getAdminStorage().bucket();
    const prefix = `users/${userId}/`;
    const [files] = await bucket.getFiles({ prefix });
    
    const userFiles = [];
    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata();
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 1000 // 1 minute
        });
        
        userFiles.push({
          path: file.name,
          url,
          size: parseInt(String(metadata.size || '0')),
          created: new Date(metadata.timeCreated || Date.now())
        });
      } catch (fileError: any) {
        console.warn(`Could not get metadata for file ${file.name}:`, fileError.message);
      }
    }
    
    return userFiles;
  } catch (error: any) {
    console.error(`Failed to list storage files for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Check if a storage file has any database references
 */
export async function checkDatabaseReference(userId: string, storageUrl: string): Promise<boolean> {
  try {
    // Check brand profile example images
    const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const brandData = userDocSnap.data();
      const exampleImages = brandData.exampleImages || [];
      
      if (exampleImages.some((url: string) => url === storageUrl)) {
        return true;
      }
    }
    
    // Check saved library images
    const libraryCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/savedLibraryImages`);
    const librarySnapshot = await getDocs(libraryCollectionRef);
    
    for (const doc of librarySnapshot.docs) {
      const data = doc.data();
      if (data.storageUrl === storageUrl) {
        return true;
      }
    }
    
    // Check brand logos (updated to use logoUrl instead of logoData)
    const logosCollectionRef = collection(db, `users/${userId}/brandProfiles/${userId}/brandLogos`);
    const logosSnapshot = await getDocs(logosCollectionRef);
    
    for (const doc of logosSnapshot.docs) {
      const data = doc.data();
      if (data.logoUrl === storageUrl) {
        return true;
      }
    }
    
    return false;
  } catch (error: any) {
    console.warn(`Error checking database reference for ${storageUrl}:`, error.message);
    return true; // Assume it exists to be safe
  }
}

/**
 * Scan all users for orphaned images and return in admin format
 */
export async function scanAllOrphanedImages(): Promise<{
  orphanedBrandImages: Array<{ userId: string; userEmail?: string; imageUrl: string }>;
  orphanedLibraryImages: Array<{ userId: string; userEmail?: string; imageId: string; imageUrl: string }>;
  orphanedLogoImages: Array<{ userId: string; userEmail?: string; logoId: string; imageUrl: string }>;
  totalScanned: number;
  scanTimestamp: string;
}> {
  console.log('Starting system-wide orphaned images scan...');
  
  const reports = await scanAllUsersForOrphanedImages();
  const orphanedBrandImages: Array<{ userId: string; userEmail?: string; imageUrl: string }> = [];
  const orphanedLibraryImages: Array<{ userId: string; userEmail?: string; imageId: string; imageUrl: string }> = [];
  const orphanedLogoImages: Array<{ userId: string; userEmail?: string; logoId: string; imageUrl: string }> = [];
  
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
    
    // Add orphaned logo images
    for (const imageUrl of report.logoImages.orphanedUrls) {
      orphanedLogoImages.push({
        userId: report.userId,
        userEmail: report.userEmail,
        logoId: `orphaned-logo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        imageUrl
      });
    }
  }
  
  const totalOrphans = orphanedBrandImages.length + orphanedLibraryImages.length + orphanedLogoImages.length;
  console.log(`Scan completed. Found ${totalOrphans} orphaned images across ${reports.length} users.`);
  
  return {
    orphanedBrandImages,
    orphanedLibraryImages,
    orphanedLogoImages,
    totalScanned: reports.length,
    scanTimestamp: new Date().toISOString()
  };
}

/**
 * Clean up all orphaned images across all users (Enhanced with storage deletion and dormant logos)
 */
export async function cleanupAllOrphanedImages(deleteStorageFiles: boolean = true, cleanupDormantLogos: boolean = true, dormantThresholdDays: number = 90): Promise<{
  deletedDbReferences: number;
  deletedStorageFiles: number;
  storageOrphansDeleted: number;
  deletedDormantLogos: number;
  totalSavedSpace: number;
}> {
  console.log('Starting system-wide orphaned images cleanup...');
  if (cleanupDormantLogos) {
    console.log(`Including dormant logo cleanup (threshold: ${dormantThresholdDays} days)`);
  }
  
  const usersCollectionRef = collection(db, 'users');
  const userDocsSnapshot = await getDocs(usersCollectionRef);
  
  let totalDbDeleted = 0;
  let totalStorageDeleted = 0;
  let totalStorageOrphansDeleted = 0;
  let totalDormantLogosDeleted = 0;
  let totalSavedSpace = 0;
  
  for (const userDoc of userDocsSnapshot.docs) {
    const userId = userDoc.id;
    
    try {
      // Phase 1: Clean up database orphans (and their storage files)
      const report = await cleanupOrphanedImagesForUser(userId, false, deleteStorageFiles);
      totalDbDeleted += report.totalOrphanedCount;
      totalStorageDeleted += report.storageFilesDeleted || 0;
      
      if (report.totalOrphanedCount > 0) {
        console.log(`✓ Phase 1: Cleaned up ${report.totalOrphanedCount} orphaned DB references for user ${report.userEmail}`);
      }
      
      // Phase 2: Clean up storage orphans (files without DB references)
      const storageCleanup = await cleanupStorageOrphansForUser(userId, false);
      totalStorageOrphansDeleted += storageCleanup.deletedFiles;
      totalSavedSpace += storageCleanup.savedSpace;
      
      if (storageCleanup.deletedFiles > 0) {
        console.log(`✓ Phase 2: Cleaned up ${storageCleanup.deletedFiles} orphaned storage files for user ${report.userEmail}`);
      }
      
      // Phase 3: Clean up dormant logos (if enabled)
      if (cleanupDormantLogos) {
        const logoCleanup = await cleanupDormantLogosForUser(userId, dormantThresholdDays, false);
        totalDormantLogosDeleted += logoCleanup.deletedLogos;
        totalSavedSpace += logoCleanup.savedSpace;
        
        if (logoCleanup.deletedLogos > 0) {
          console.log(`✓ Phase 3: Cleaned up ${logoCleanup.deletedLogos} dormant logos for user ${logoCleanup.userEmail}`);
        }
      }
      
    } catch (error: any) {
      console.warn(`Failed to cleanup orphaned images for user ${userId}:`, error.message);
    }
  }
  
  console.log(`✓ System-wide cleanup completed:`);
  console.log(`  - DB references deleted: ${totalDbDeleted}`);
  console.log(`  - Storage files deleted (from DB orphans): ${totalStorageDeleted}`);
  console.log(`  - Storage orphans deleted: ${totalStorageOrphansDeleted}`);
  if (cleanupDormantLogos) {
    console.log(`  - Dormant logos deleted: ${totalDormantLogosDeleted}`);
  }
  console.log(`  - Total storage space saved: ${formatBytes(totalSavedSpace)}`);
  
  return {
    deletedDbReferences: totalDbDeleted,
    deletedStorageFiles: totalStorageDeleted,
    storageOrphansDeleted: totalStorageOrphansDeleted,
    deletedDormantLogos: totalDormantLogosDeleted,
    totalSavedSpace
  };
}

/**
 * Scan all users for dormant logos
 */
export async function scanAllUsersForDormantLogos(dormantThresholdDays: number = 90): Promise<Array<{
  userId: string;
  userEmail?: string;
  brandName?: string;
  dormantLogos: Array<{
    logoId: string;
    logoUrl: string;
    lastUpdated: Date;
    daysSinceUpdate: number;
  }>;
  totalLogos: number;
  dormantCount: number;
}>> {
  console.log(`Scanning all users for dormant logos (threshold: ${dormantThresholdDays} days)...`);
  
  const usersCollectionRef = collection(db, 'users');
  const userDocsSnapshot = await getDocs(usersCollectionRef);
  
  const reports = [];
  
  for (const userDoc of userDocsSnapshot.docs) {
    const userId = userDoc.id;
    
    try {
      const report = await scanUserForDormantLogos(userId, dormantThresholdDays);
      reports.push(report);
      
      if (report.dormantCount > 0) {
        console.log(`⚠️  User ${report.userEmail} has ${report.dormantCount} dormant logos out of ${report.totalLogos} total`);
      }
    } catch (error: any) {
      console.warn(`Failed to scan dormant logos for user ${userId}:`, error.message);
    }
  }
  
  const totalDormant = reports.reduce((sum, r) => sum + r.dormantCount, 0);
  const totalLogos = reports.reduce((sum, r) => sum + r.totalLogos, 0);
  console.log(`Scan completed. Found ${totalDormant} dormant logos out of ${totalLogos} total across ${reports.length} users.`);
  
  return reports;
}