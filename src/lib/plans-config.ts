
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { PlansConfig, PlanDetails } from '@/types';
import { DEFAULT_PLANS_CONFIG } from '@/lib/constants';

// Removed in-memory cache to ensure consistency in serverless environments.
// Firestore's client-side SDK provides its own caching.

export async function getPlansConfig(forceRefresh = false): Promise<PlansConfig> {
  try {
    const configDocRef = doc(db, 'configuration', 'plans');
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
      const config = docSnap.data() as PlansConfig;
      // Merge with defaults to ensure all keys are present
      // Note: This is a shallow merge. A deep merge might be needed if structure is complex.
      return {
        ...DEFAULT_PLANS_CONFIG,
        ...config,
        USD: { ...DEFAULT_PLANS_CONFIG.USD, ...(config.USD || {}) },
        INR: { ...DEFAULT_PLANS_CONFIG.INR, ...(config.INR || {}) },
      };
    } else {
      console.log("No plans configuration in Firestore, using default plans. A new one can be saved from the admin panel.");
      return DEFAULT_PLANS_CONFIG;
    }
  } catch (error) {
    console.error("Error fetching plans configuration, returning defaults:", error);
    return DEFAULT_PLANS_CONFIG;
  }
}

export function clearPlansConfigCache() {
  // This function is now a no-op since we are not using a manual in-memory cache.
  // It's kept for compatibility with existing calls in actions.ts.
  console.log("In-memory plans configuration cache is no longer used; relying on Firestore SDK cache.");
}
