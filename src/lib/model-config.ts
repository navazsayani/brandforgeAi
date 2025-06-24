
'use server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { ModelConfig } from '@/types';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  imageGenerationModel: 'googleai/gemini-2.0-flash-preview-image-generation',
  fastModel: 'googleai/gemini-1.5-flash-latest',
  visionModel: 'googleai/gemini-1.5-flash-latest',
  powerfulModel: 'googleai/gemini-1.5-pro-latest',
};

// Simple in-memory cache
let cachedConfig: ModelConfig | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function getModelConfig(): Promise<ModelConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedConfig;
  }

  try {
    const configDocRef = doc(db, 'configuration', 'models');
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
      const config = docSnap.data() as ModelConfig;
      // Merge with defaults to ensure all keys are present even if new ones are added to the code
      cachedConfig = { ...DEFAULT_MODEL_CONFIG, ...config };
      lastFetchTime = now;
      console.log("Fetched and cached model configuration from Firestore.");
      return cachedConfig;
    } else {
      // If no config in DB, use defaults and don't cache to allow it to be created and fetched soon after
      console.log("No model configuration in Firestore, using default models.");
      return DEFAULT_MODEL_CONFIG;
    }
  } catch (error) {
    console.error("Error fetching model configuration, returning defaults:", error);
    // In case of error, return defaults but don't cache to allow retry
    return DEFAULT_MODEL_CONFIG;
  }
}
