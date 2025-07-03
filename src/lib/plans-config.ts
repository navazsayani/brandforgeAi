
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { PlansConfig, PlanDetails } from '@/types';
import { DEFAULT_PLANS_CONFIG } from '@/lib/constants';

// Simple in-memory cache for plan configuration
let cachedPlansConfig: PlansConfig | null = null;
let lastPlansFetchTime: number = 0;
const PLANS_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function getPlansConfig(forceRefresh = false): Promise<PlansConfig> {
  const now = Date.now();
  if (!forceRefresh && cachedPlansConfig && now - lastPlansFetchTime < PLANS_CACHE_DURATION_MS) {
    return cachedPlansConfig;
  }

  try {
    const configDocRef = doc(db, 'configuration', 'plans');
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
      const config = docSnap.data() as PlansConfig;
      // Merge with defaults to ensure all keys are present
      // Note: This is a shallow merge. A deep merge might be needed if structure is complex.
      cachedPlansConfig = {
        ...DEFAULT_PLANS_CONFIG,
        ...config,
        USD: { ...DEFAULT_PLANS_CONFIG.USD, ...(config.USD || {}) },
        INR: { ...DEFAULT_PLANS_CONFIG.INR, ...(config.INR || {}) },
      };
      lastPlansFetchTime = now;
      console.log(`Fetched and cached plans configuration from Firestore (Forced: ${forceRefresh}).`);
      return cachedPlansConfig;
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
  cachedPlansConfig = null;
  lastPlansFetchTime = 0;
  console.log("Plans configuration cache cleared.");
}
