
'use server';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { PlansConfig, PlanDetails } from '@/types';

export const DEFAULT_PLANS_CONFIG: PlansConfig = {
  USD: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started and exploring core features.',
      price: { amount: '$0', unit: '/ month' },
      features: [
        { name: 'Brand Profile Setup', included: true },
        { name: 'AI-Powered Idea Generation', included: true },
        { name: 'Blog Outline Generation', included: true },
      ],
      quotas: {
        imageGenerations: 10,
        socialPosts: 5,
        blogPosts: 0, // 0 means feature is disabled
      },
      cta: 'Your Current Plan',
    },
    pro: {
      id: 'pro_usd',
      name: 'Pro',
      description: 'For professionals and small businesses who need more power.',
      price: { amount: '$12', originalAmount: '$29', unit: '/ month' },
      features: [
        { name: 'Everything in Free, plus:', included: true },
        { name: 'Full Blog Post Generation', included: true },
        { name: 'Access to Premium Image Models', included: true },
        { name: 'Save Images to Library', included: true },
        { name: 'Priority Support', included: true },
      ],
      quotas: {
        imageGenerations: 100,
        socialPosts: 50,
        blogPosts: 5,
      },
      cta: 'Upgrade to Pro',
    },
  },
  INR: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started and exploring core features.',
      price: { amount: '₹0', unit: '/ month' },
      features: [
        { name: 'Brand Profile Setup', included: true },
        { name: 'AI-Powered Idea Generation', included: true },
        { name: 'Blog Outline Generation', included: true },
      ],
      quotas: {
        imageGenerations: 10,
        socialPosts: 5,
        blogPosts: 0,
      },
      cta: 'Your Current Plan',
    },
    pro: {
      id: 'pro_inr',
      name: 'Pro',
      description: 'For professionals and small businesses who need more power.',
      price: { amount: '₹399', originalAmount: '₹999', unit: '/ month' },
      features: [
        { name: 'Everything in Free, plus:', included: true },
        { name: 'Full Blog Post Generation', included: true },
        { name: 'Access to Premium Image Models', included: true },
        { name: 'Save Images to Library', included: true },
        { name: 'Priority Support', included: true },
      ],
      quotas: {
        imageGenerations: 100,
        socialPosts: 50,
        blogPosts: 5,
      },
      cta: 'Upgrade to Pro',
    },
  },
};

// Simple in-memory cache for plan configuration
let cachedPlansConfig: PlansConfig | null = null;
let lastPlansFetchTime: number = 0;
const PLANS_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function getPlansConfig(): Promise<PlansConfig> {
  const now = Date.now();
  if (cachedPlansConfig && now - lastPlansFetchTime < PLANS_CACHE_DURATION_MS) {
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
      console.log("Fetched and cached plans configuration from Firestore.");
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
