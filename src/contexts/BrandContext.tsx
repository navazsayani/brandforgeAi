
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';
import { useAuth } from './AuthContext'; // Added

// BRAND_PROFILE_DOC_ID is no longer used as a global constant for doc ID

interface BrandContextType {
  userId: string | null; // Added userId here
  brandData: BrandData | null;
  setBrandData: (data: BrandData, userId: string) => Promise<void>; // Added userId parameter
  isLoading: boolean;
  error: string | null;
  generatedImages: GeneratedImage[];
  addGeneratedImage: (image: GeneratedImage) => void;
  generatedSocialPosts: GeneratedSocialMediaPost[];
  addGeneratedSocialPost: (post: GeneratedSocialMediaPost) => void;
  generatedBlogPosts: GeneratedBlogPost[];
  addGeneratedBlogPost: (post: GeneratedBlogPost) => void;
  generatedAdCampaigns: GeneratedAdCampaign[];
  addGeneratedAdCampaign: (campaign: GeneratedAdCampaign) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const defaultEmptyBrandData: BrandData = {
    brandName: "",
    websiteUrl: "",
    brandDescription: "",
    industry: "_none_", // Set default to "_none_" to match UI expectations
    imageStyleNotes: "",
    exampleImages: [],
    targetKeywords: "",
    brandLogoUrl: undefined,
};

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth(); // Get current user from AuthContext
  const [brandData, setBrandDataState] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedSocialPosts, setGeneratedSocialPosts] = useState<GeneratedSocialMediaPost[]>([]);
  const [generatedBlogPosts, setGeneratedBlogPosts] = useState<GeneratedBlogPost[]>([]);
  const [generatedAdCampaigns, setGeneratedAdCampaigns] = useState<GeneratedAdCampaign[]>([]);

  const fetchBrandDataCB = useCallback(async () => {
    if (!currentUser) {
      setBrandDataState(null); // No user, no specific brand data
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const userId = currentUser.uid;

    try {
      const brandDocRef = doc(db, "brandProfiles", userId); // Use userId for document path
      const docSnap = await getDoc(brandDocRef);
      if (docSnap.exists()) {
        const fetchedData = docSnap.data() as BrandData;
        console.log("🔍 BrandContext: Raw data from Firestore:", fetchedData);
        const mergedData = {
          ...defaultEmptyBrandData, // Ensure all fields are present
          ...fetchedData,
        };
        console.log("🔍 BrandContext: Merged data with defaults:", mergedData);
        console.log("🔍 BrandContext: Industry value specifically:", mergedData.industry);
        setBrandDataState(mergedData);
      } else {
        // User has no brand profile yet, initialize with empty/default
        console.log("🔍 BrandContext: No existing data, using defaults");
        setBrandDataState(defaultEmptyBrandData);
      }
    } catch (e: any) {
      console.error("Error fetching brand data from Firestore:", e);
      let specificError = `Failed to fetch brand data: ${e.message || "Unknown error. Check console."}`;
      if (e.code === 'unavailable' || (e.message && (e.message.toLowerCase().includes("client is offline") || e.message.toLowerCase().includes("could not reach cloud firestore backend")))) {
        specificError = "Connection Error: Unable to reach Firestore. Please check your internet connection or Firebase status. The app may operate with cached data if available.";
        console.warn("FIRESTORE OFFLINE: Could not reach Cloud Firestore backend. Client operating in offline mode.", e);
      } else if (e.message && e.message.toLowerCase().includes("missing or insufficient permissions")) {
        specificError = "Database permission error. Please check your Firestore security rules in the Firebase console.";
      }
      setError(specificError);
      setBrandDataState(null); // Set to null on error to avoid using stale data
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Depend on currentUser

  useEffect(() => {
    fetchBrandDataCB();
  }, [fetchBrandDataCB]); // fetchBrandDataCB already depends on currentUser

  const setBrandDataCB = useCallback(async (data: BrandData, userId: string) => { // userId is now required
    if (!userId) {
      const noUserError = "User not authenticated. Cannot save brand profile.";
      setError(noUserError);
      console.error(noUserError);
      throw new Error(noUserError);
    }

    setIsLoading(true);
    setError(null);
    try {
      const dataToSave: BrandData = {
        ...defaultEmptyBrandData, // Ensure all fields are present even if partial data is passed
        ...data,
      };
      console.log("🔍 BrandContext: Data being saved to Firestore:", dataToSave);
      console.log("🔍 BrandContext: Industry value being saved:", dataToSave.industry);
      const brandDocRef = doc(db, "brandProfiles", userId); // Use userId for document path
      await setDoc(brandDocRef, dataToSave, { merge: true }); // Use merge: true to be safe
      setBrandDataState(dataToSave);
      console.log("🔍 BrandContext: Data saved successfully");
    } catch (e: any) {
      console.error("Error saving brand data to Firestore:", e);
      let specificError = `Failed to save brand profile: ${e.message || "Unknown error. Check console."}`;
       if (e.code === 'unavailable' || (e.message && (e.message.toLowerCase().includes("client is offline") || e.message.toLowerCase().includes("could not reach cloud firestore backend")))) {
        specificError = "Connection Error: Unable to save data to Firestore. Please check your internet connection or Firebase status.";
         console.warn("FIRESTORE OFFLINE: Could not reach Cloud Firestore backend during save. Client operating in offline mode.", e);
      } else if (e.message && e.message.toLowerCase().includes("missing or insufficient permissions")) {
          specificError = "Failed to save data due to database permission error. Check Firestore security rules.";
      }
      setError(specificError);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGeneratedImageCB = useCallback((image: GeneratedImage) => {
    setGeneratedImages(prev => [image, ...prev.slice(0,19)]);
  }, []);

  const addGeneratedSocialPostCB = useCallback((post: GeneratedSocialMediaPost) => {
    setGeneratedSocialPosts(prev => [post, ...prev.slice(0,19)]);
  }, []);

  const addGeneratedBlogPostCB = useCallback((post: GeneratedBlogPost) => {
    setGeneratedBlogPosts(prev => [post, ...prev.slice(0,19)]);
  }, []);

  const addGeneratedAdCampaignCB = useCallback((campaign: GeneratedAdCampaign) => {
    setGeneratedAdCampaigns(prev => [campaign, ...prev.slice(0,19)]);
  }, []);

  const contextValue = useMemo(() => ({
    userId: currentUser?.uid || null, // Expose userId from currentUser
    brandData,
    setBrandData: setBrandDataCB,
    isLoading,
    error,
    generatedImages,
    addGeneratedImage: addGeneratedImageCB,
    generatedSocialPosts,
    addGeneratedSocialPost: addGeneratedSocialPostCB,
    generatedBlogPosts,
    addGeneratedBlogPost: addGeneratedBlogPostCB,
    generatedAdCampaigns,
    addGeneratedAdCampaign: addGeneratedAdCampaignCB
  }), [
    currentUser, brandData, setBrandDataCB, isLoading, error, // Added currentUser dependency
    generatedImages, addGeneratedImageCB,
    generatedSocialPosts, addGeneratedSocialPostCB,
    generatedBlogPosts, addGeneratedBlogPostCB,
    generatedAdCampaigns, addGeneratedAdCampaignCB
  ]);

  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

