
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
      // Deep merge to ensure new default features are added to existing Firestore configs
      const mergedConfig: PlansConfig = {
        USD: {
          free: {
            ...DEFAULT_PLANS_CONFIG.USD.free,
            ...(config.USD?.free || {}),
            features: [
              ...DEFAULT_PLANS_CONFIG.USD.free.features,
              ...(config.USD?.free?.features || []).filter(
                f => !DEFAULT_PLANS_CONFIG.USD.free.features.some(df => df.name === f.name)
              )
            ],
          },
          pro: {
            ...DEFAULT_PLANS_CONFIG.USD.pro,
            ...(config.USD?.pro || {}),
            features: [
              ...DEFAULT_PLANS_CONFIG.USD.pro.features,
              ...(config.USD?.pro?.features || []).filter(
                f => !DEFAULT_PLANS_CONFIG.USD.pro.features.some(df => df.name === f.name)
              )
            ],
          },
        },
        INR: {
          free: {
            ...DEFAULT_PLANS_CONFIG.INR.free,
            ...(config.INR?.free || {}),
            features: [
              ...DEFAULT_PLANS_CONFIG.INR.free.features,
              ...(config.INR?.free?.features || []).filter(
                f => !DEFAULT_PLANS_CONFIG.INR.free.features.some(df => df.name === f.name)
              )
            ],
          },
          pro: {
            ...DEFAULT_PLANS_CONFIG.INR.pro,
            ...(config.INR?.pro || {}),
            features: [
              ...DEFAULT_PLANS_CONFIG.INR.pro.features,
              ...(config.INR?.pro?.features || []).filter(
                f => !DEFAULT_PLANS_CONFIG.INR.pro.features.some(df => df.name === f.name)
              )
            ],
          },
        },
      };
      return mergedConfig;
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
