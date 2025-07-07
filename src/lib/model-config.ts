
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { ModelConfig } from '@/types';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  imageGenerationModel: 'googleai/gemini-2.0-flash-preview-image-generation',
  textToImageModel: 'googleai/gemini-2.0-flash-preview-image-generation',
  fastModel: 'googleai/gemini-1.5-flash-latest',
  visionModel: 'googleai/gemini-1.5-flash-latest',
  powerfulModel: 'googleai/gemini-1.5-pro-latest',
  paymentMode: 'test',
  freepikEnabled: true,
};

// Removed in-memory cache to ensure consistency in serverless environments.
// Firestore's client-side SDK provides its own caching.

export async function getModelConfig(forceRefresh = false): Promise<ModelConfig> {
  try {
    const configDocRef = doc(db, 'configuration', 'models');
    // Using getDoc will use Firestore's cache by default, forceRefresh is now just a signal
    // for intent, but the underlying behavior is handled by Firestore SDK.
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
      const config = docSnap.data() as ModelConfig;
      // Merge with defaults to ensure all keys are present
      return { ...DEFAULT_MODEL_CONFIG, ...config };
    } else {
      console.log("No model configuration in Firestore, using default models.");
      return DEFAULT_MODEL_CONFIG;
    }
  } catch (error) {
    console.error("Error fetching model configuration, returning defaults:", error);
    return DEFAULT_MODEL_CONFIG;
  }
}

export function clearModelConfigCache() {
  // This function is now a no-op since we are not using a manual in-memory cache.
  // It's kept for compatibility with existing calls in actions.ts.
  console.log("In-memory model configuration cache is no longer used; relying on Firestore SDK cache.");
}
