/**
 * Client-safe utilities for Firebase Storage operations
 * This file contains functions that can be safely used in client-side components
 */

import { storage } from '@/lib/firebaseConfig';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { decodeHtmlEntitiesInUrl } from './utils';

/**
 * Check if a Firebase Storage URL actually exists (client-side version)
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