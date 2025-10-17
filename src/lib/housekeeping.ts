/**
 * Comprehensive Housekeeping Utility
 * Handles cleanup of old content, library images, and RAG vectors
 * WITH EXTENSIVE SAFETY CONTROLS
 */

import { db, storage } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, Timestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, deleteObject, listAll, getMetadata } from 'firebase/storage';
import type { HousekeepingScanResult, HousekeepingCleanupResult } from '@/types';

// ==================== SAFETY CONSTANTS ====================
const MIN_AGE_DEPLOYED_CONTENT_DAYS = 180; // 6 months minimum for deployed content
const MIN_AGE_DRAFT_CONTENT_DAYS = 90; // 3 months minimum for draft content
const MIN_AGE_LIBRARY_IMAGES_DAYS = 90; // 3 months minimum for library images
const PROTECTED_USER_EMAILS = ['admin@brandforge.ai']; // Never cleanup these users

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate days since a timestamp
 */
function daysSince(timestamp: Timestamp | Date | any): number {
  let date: Date;

  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if user is protected from cleanup
 */
async function isProtectedUser(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId, 'brandProfiles', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) return false;

    const userData = userDocSnap.data();
    const userEmail = userData?.userEmail || '';

    return PROTECTED_USER_EMAILS.includes(userEmail);
  } catch (error) {
    console.error(`Error checking if user ${userId} is protected:`, error);
    return true; // Err on the side of caution
  }
}

/**
 * Estimate size of a storage file
 */
async function estimateFileSize(fileUrl: string): Promise<number> {
  try {
    const urlObj = new URL(fileUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) return 0;

    const storagePath = decodeURIComponent(pathMatch[1]);
    const fileRef = storageRef(storage, storagePath);
    const metadata = await getMetadata(fileRef);

    return metadata.size || 0;
  } catch (error) {
    return 0; // Assume 0 if we can't get size
  }
}

// ==================== SCAN FUNCTIONS ====================

/**
 * Scan for old deployed content across all users
 */
async function scanOldDeployedContent(minAgeDays: number): Promise<{
  socialPosts: number;
  blogPosts: number;
  adCampaigns: number;
}> {
  console.log(`[Housekeeping Scan] Scanning for deployed content older than ${minAgeDays} days...`);

  let socialCount = 0;
  let blogCount = 0;
  let adCount = 0;

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const cutoffDate = Timestamp.fromDate(new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000));

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    // Check if user is protected
    if (await isProtectedUser(userId)) {
      console.log(`[Housekeeping Scan] Skipping protected user: ${userId}`);
      continue;
    }

    try {
      // Scan social posts
      const socialQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/socialMediaPosts`),
        where('status', '==', 'deployed'),
        where('createdAt', '<', cutoffDate)
      );
      const socialSnapshot = await getDocs(socialQuery);
      socialCount += socialSnapshot.size;

      // Scan blog posts
      const blogQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/blogPosts`),
        where('status', '==', 'deployed'),
        where('createdAt', '<', cutoffDate)
      );
      const blogSnapshot = await getDocs(blogQuery);
      blogCount += blogSnapshot.size;

      // Scan ad campaigns
      const adQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/adCampaigns`),
        where('status', '==', 'deployed'),
        where('createdAt', '<', cutoffDate)
      );
      const adSnapshot = await getDocs(adQuery);
      adCount += adSnapshot.size;

    } catch (error) {
      console.warn(`[Housekeeping Scan] Error scanning user ${userId}:`, error);
    }
  }

  console.log(`[Housekeeping Scan] Found old deployed content: ${socialCount} social, ${blogCount} blogs, ${adCount} ads`);

  return { socialPosts: socialCount, blogPosts: blogCount, adCampaigns: adCount };
}

/**
 * Scan for old draft content across all users
 */
async function scanOldDraftContent(minAgeDays: number): Promise<{
  socialPosts: number;
  blogPosts: number;
  adCampaigns: number;
}> {
  console.log(`[Housekeeping Scan] Scanning for draft content older than ${minAgeDays} days...`);

  let socialCount = 0;
  let blogCount = 0;
  let adCount = 0;

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const cutoffDate = Timestamp.fromDate(new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000));

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    // Check if user is protected
    if (await isProtectedUser(userId)) {
      continue;
    }

    try {
      // Scan social posts
      const socialQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/socialMediaPosts`),
        where('status', '==', 'draft'),
        where('createdAt', '<', cutoffDate)
      );
      const socialSnapshot = await getDocs(socialQuery);
      socialCount += socialSnapshot.size;

      // Scan blog posts
      const blogQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/blogPosts`),
        where('status', '==', 'draft'),
        where('createdAt', '<', cutoffDate)
      );
      const blogSnapshot = await getDocs(blogQuery);
      blogCount += blogSnapshot.size;

      // Scan ad campaigns
      const adQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/adCampaigns`),
        where('status', '==', 'draft'),
        where('createdAt', '<', cutoffDate)
      );
      const adSnapshot = await getDocs(adQuery);
      adCount += adSnapshot.size;

    } catch (error) {
      console.warn(`[Housekeeping Scan] Error scanning user ${userId}:`, error);
    }
  }

  console.log(`[Housekeeping Scan] Found old draft content: ${socialCount} social, ${blogCount} blogs, ${adCount} ads`);

  return { socialPosts: socialCount, blogPosts: blogCount, adCampaigns: adCount };
}

/**
 * Scan for old library images across all users
 */
async function scanOldLibraryImages(minAgeDays: number): Promise<{
  count: number;
  estimatedSize: number;
}> {
  console.log(`[Housekeeping Scan] Scanning for library images older than ${minAgeDays} days...`);

  let imageCount = 0;
  let totalSize = 0;

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const cutoffDate = Timestamp.fromDate(new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000));

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    // Check if user is protected
    if (await isProtectedUser(userId)) {
      continue;
    }

    try {
      const imagesQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/generatedImages`),
        where('createdAt', '<', cutoffDate)
      );
      const imagesSnapshot = await getDocs(imagesQuery);
      imageCount += imagesSnapshot.size;

      // Estimate total size
      for (const imageDoc of imagesSnapshot.docs) {
        const imageData = imageDoc.data();
        if (imageData.imageUrl) {
          const size = await estimateFileSize(imageData.imageUrl);
          totalSize += size;
        }
      }

    } catch (error) {
      console.warn(`[Housekeeping Scan] Error scanning library images for user ${userId}:`, error);
    }
  }

  console.log(`[Housekeeping Scan] Found ${imageCount} old library images (~${formatBytes(totalSize)})`);

  return { count: imageCount, estimatedSize: totalSize };
}

/**
 * Scan for orphaned RAG vectors (vectors without corresponding content)
 * NOTE: This requires server-side implementation with Pinecone access
 */
async function scanOrphanedRAGVectors(): Promise<{ count: number }> {
  console.log(`[Housekeeping Scan] Scanning for orphaned RAG vectors...`);

  // This would need to be implemented server-side with direct Pinecone access
  // For now, return a placeholder that indicates this needs backend implementation
  console.warn(`[Housekeeping Scan] RAG vector scanning requires server-side implementation`);

  return { count: 0 };
}

/**
 * Main scan function - scans everything
 */
export async function scanHousekeeping(options: {
  deployedContentMinAge?: number;
  draftContentMinAge?: number;
  libraryImagesMinAge?: number;
  scanRAGVectors?: boolean;
}): Promise<HousekeepingScanResult> {
  console.log('[Housekeeping] Starting comprehensive housekeeping scan...');

  const deployedMinAge = options.deployedContentMinAge || MIN_AGE_DEPLOYED_CONTENT_DAYS;
  const draftMinAge = options.draftContentMinAge || MIN_AGE_DRAFT_CONTENT_DAYS;
  const libraryMinAge = options.libraryImagesMinAge || MIN_AGE_LIBRARY_IMAGES_DAYS;

  const [oldDeployed, oldDrafts, oldLibrary, orphanedRAG] = await Promise.all([
    scanOldDeployedContent(deployedMinAge),
    scanOldDraftContent(draftMinAge),
    scanOldLibraryImages(libraryMinAge),
    options.scanRAGVectors ? scanOrphanedRAGVectors() : Promise.resolve({ count: 0 })
  ]);

  const usersSnapshot = await getDocs(collection(db, 'users'));

  const result: HousekeepingScanResult = {
    oldDeployedContent: oldDeployed,
    oldDraftContent: oldDrafts,
    oldLibraryImages: oldLibrary,
    orphanedRAGVectors: orphanedRAG,
    totalUsers: usersSnapshot.size,
    scanTimestamp: new Date().toISOString()
  };

  console.log('[Housekeeping] Scan completed:', result);

  return result;
}

// ==================== CLEANUP FUNCTIONS ====================

/**
 * Clean up old deployed content
 */
async function cleanupOldDeployedContent(minAgeDays: number, dryRun: boolean = false): Promise<{
  deleted: number;
  errors: string[];
}> {
  console.log(`[Housekeeping Cleanup] Cleaning up deployed content older than ${minAgeDays} days (dryRun: ${dryRun})...`);

  let deletedCount = 0;
  const errors: string[] = [];

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const cutoffDate = Timestamp.fromDate(new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000));

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    // Safety check: protected users
    if (await isProtectedUser(userId)) {
      console.log(`[Housekeeping Cleanup] Skipping protected user: ${userId}`);
      continue;
    }

    try {
      // Clean social posts
      const socialQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/socialMediaPosts`),
        where('status', '==', 'deployed'),
        where('createdAt', '<', cutoffDate)
      );
      const socialSnapshot = await getDocs(socialQuery);

      for (const postDoc of socialSnapshot.docs) {
        if (!dryRun) {
          await deleteDoc(postDoc.ref);
        }
        deletedCount++;
      }

      // Clean blog posts
      const blogQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/blogPosts`),
        where('status', '==', 'deployed'),
        where('createdAt', '<', cutoffDate)
      );
      const blogSnapshot = await getDocs(blogQuery);

      for (const postDoc of blogSnapshot.docs) {
        if (!dryRun) {
          await deleteDoc(postDoc.ref);
        }
        deletedCount++;
      }

      // Clean ad campaigns
      const adQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/adCampaigns`),
        where('status', '==', 'deployed'),
        where('createdAt', '<', cutoffDate)
      );
      const adSnapshot = await getDocs(adQuery);

      for (const adDoc of adSnapshot.docs) {
        if (!dryRun) {
          await deleteDoc(adDoc.ref);
        }
        deletedCount++;
      }

    } catch (error: any) {
      errors.push(`User ${userId}: ${error.message}`);
    }
  }

  console.log(`[Housekeeping Cleanup] Deleted ${deletedCount} deployed content items`);

  return { deleted: deletedCount, errors };
}

/**
 * Clean up old draft content
 */
async function cleanupOldDraftContent(minAgeDays: number, dryRun: boolean = false): Promise<{
  deleted: number;
  errors: string[];
}> {
  console.log(`[Housekeeping Cleanup] Cleaning up draft content older than ${minAgeDays} days (dryRun: ${dryRun})...`);

  let deletedCount = 0;
  const errors: string[] = [];

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const cutoffDate = Timestamp.fromDate(new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000));

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    // Safety check: protected users
    if (await isProtectedUser(userId)) {
      continue;
    }

    try {
      // Clean social posts
      const socialQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/socialMediaPosts`),
        where('status', '==', 'draft'),
        where('createdAt', '<', cutoffDate)
      );
      const socialSnapshot = await getDocs(socialQuery);

      for (const postDoc of socialSnapshot.docs) {
        if (!dryRun) {
          await deleteDoc(postDoc.ref);
        }
        deletedCount++;
      }

      // Clean blog posts
      const blogQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/blogPosts`),
        where('status', '==', 'draft'),
        where('createdAt', '<', cutoffDate)
      );
      const blogSnapshot = await getDocs(blogQuery);

      for (const postDoc of blogSnapshot.docs) {
        if (!dryRun) {
          await deleteDoc(postDoc.ref);
        }
        deletedCount++;
      }

      // Clean ad campaigns
      const adQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/adCampaigns`),
        where('status', '==', 'draft'),
        where('createdAt', '<', cutoffDate)
      );
      const adSnapshot = await getDocs(adQuery);

      for (const adDoc of adSnapshot.docs) {
        if (!dryRun) {
          await deleteDoc(adDoc.ref);
        }
        deletedCount++;
      }

    } catch (error: any) {
      errors.push(`User ${userId}: ${error.message}`);
    }
  }

  console.log(`[Housekeeping Cleanup] Deleted ${deletedCount} draft content items`);

  return { deleted: deletedCount, errors };
}

/**
 * Clean up old library images (with storage file deletion)
 */
async function cleanupOldLibraryImages(minAgeDays: number, dryRun: boolean = false): Promise<{
  deleted: number;
  savedSpace: number;
  errors: string[];
}> {
  console.log(`[Housekeeping Cleanup] Cleaning up library images older than ${minAgeDays} days (dryRun: ${dryRun})...`);

  let deletedCount = 0;
  let savedSpace = 0;
  const errors: string[] = [];

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const cutoffDate = Timestamp.fromDate(new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000));

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    // Safety check: protected users
    if (await isProtectedUser(userId)) {
      continue;
    }

    try {
      const imagesQuery = query(
        collection(db, `users/${userId}/brandProfiles/${userId}/generatedImages`),
        where('createdAt', '<', cutoffDate)
      );
      const imagesSnapshot = await getDocs(imagesQuery);

      for (const imageDoc of imagesSnapshot.docs) {
        const imageData = imageDoc.data();

        // Delete storage file
        if (imageData.imageUrl) {
          try {
            const size = await estimateFileSize(imageData.imageUrl);
            savedSpace += size;

            if (!dryRun) {
              const urlObj = new URL(imageData.imageUrl);
              const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
              if (pathMatch) {
                const storagePath = decodeURIComponent(pathMatch[1]);
                const fileRef = storageRef(storage, storagePath);
                await deleteObject(fileRef);
              }
            }
          } catch (storageError: any) {
            console.warn(`Failed to delete storage file: ${storageError.message}`);
          }
        }

        // Delete Firestore document
        if (!dryRun) {
          await deleteDoc(imageDoc.ref);
        }
        deletedCount++;
      }

    } catch (error: any) {
      errors.push(`User ${userId}: ${error.message}`);
    }
  }

  console.log(`[Housekeeping Cleanup] Deleted ${deletedCount} library images, saved ${formatBytes(savedSpace)}`);

  return { deleted: deletedCount, savedSpace, errors };
}

/**
 * Main cleanup function
 */
export async function cleanupHousekeeping(options: {
  cleanDeployedContent?: boolean;
  cleanDraftContent?: boolean;
  cleanLibraryImages?: boolean;
  cleanRAGVectors?: boolean;
  deployedContentMinAge?: number;
  draftContentMinAge?: number;
  libraryImagesMinAge?: number;
  dryRun?: boolean;
}): Promise<HousekeepingCleanupResult> {
  console.log('[Housekeeping] Starting comprehensive cleanup...');
  console.log('[Housekeeping] Options:', options);

  const dryRun = options.dryRun ?? false;
  const deployedMinAge = options.deployedContentMinAge || MIN_AGE_DEPLOYED_CONTENT_DAYS;
  const draftMinAge = options.draftContentMinAge || MIN_AGE_DRAFT_CONTENT_DAYS;
  const libraryMinAge = options.libraryImagesMinAge || MIN_AGE_LIBRARY_IMAGES_DAYS;

  let totalDeployedDeleted = 0;
  let totalDraftDeleted = 0;
  let totalLibraryDeleted = 0;
  let totalRAGDeleted = 0;
  let totalSavedSpace = 0;
  const allErrors: string[] = [];

  // Clean deployed content
  if (options.cleanDeployedContent) {
    const result = await cleanupOldDeployedContent(deployedMinAge, dryRun);
    totalDeployedDeleted = result.deleted;
    allErrors.push(...result.errors);
  }

  // Clean draft content
  if (options.cleanDraftContent) {
    const result = await cleanupOldDraftContent(draftMinAge, dryRun);
    totalDraftDeleted = result.deleted;
    allErrors.push(...result.errors);
  }

  // Clean library images
  if (options.cleanLibraryImages) {
    const result = await cleanupOldLibraryImages(libraryMinAge, dryRun);
    totalLibraryDeleted = result.deleted;
    totalSavedSpace += result.savedSpace;
    allErrors.push(...result.errors);
  }

  // Clean RAG vectors (requires server-side implementation)
  if (options.cleanRAGVectors) {
    console.warn('[Housekeeping] RAG vector cleanup requires server-side implementation');
    // totalRAGDeleted would be set here when implemented
  }

  const result: HousekeepingCleanupResult = {
    deletedDeployedContent: totalDeployedDeleted,
    deletedDraftContent: totalDraftDeleted,
    deletedLibraryImages: totalLibraryDeleted,
    deletedRAGVectors: totalRAGDeleted,
    savedStorageSpace: totalSavedSpace,
    errors: allErrors
  };

  console.log('[Housekeeping] Cleanup completed:', result);

  return result;
}

// ==================== UTILITY FUNCTIONS ====================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
