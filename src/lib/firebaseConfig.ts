
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Initialize Analytics (client-side only, with safety checks)
let analytics: Analytics | null = null;

// Function to get analytics instance (lazy initialization)
export const getAnalyticsInstance = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (analytics) {
    return analytics;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
      console.log('[Firebase Analytics] Initialized successfully');
      return analytics;
    } else {
      console.log('[Firebase Analytics] Not supported in this environment');
      return null;
    }
  } catch (error) {
    console.error('[Firebase Analytics] Initialization error:', error);
    return null;
  }
};

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  getAnalyticsInstance();
}

export { app, db, storage, auth, analytics };
