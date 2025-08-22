/**
 * Firebase Admin SDK initialization utility
 * Centralizes the initialization logic to avoid duplication
 */

import admin from 'firebase-admin';

let isInitialized = false;

export function initializeFirebaseAdmin(): void {
  if (isInitialized || admin.apps.length > 0) {
    return; // Already initialized
  }

  try {
    let credential;
    
    // Try to use service account key if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = admin.credential.cert(serviceAccount);
        console.log('[Firebase Admin] Using service account key from environment variable');
      } catch (parseError) {
        console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
      }
    } else {
      // Fallback to application default credentials
      credential = admin.credential.applicationDefault();
      console.log('[Firebase Admin] Using application default credentials');
    }
    
    admin.initializeApp({
      credential,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    
    isInitialized = true;
    console.log('[Firebase Admin] Successfully initialized');
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization failed:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

export function ensureFirebaseAdminInitialized(): void {
  if (!isInitialized && admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
}

export default admin;