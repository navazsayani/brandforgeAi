
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';
import { useAuth } from './AuthContext'; // Added

// BRAND_PROFILE_DOC_ID is no longer used as a global constant for doc ID

interface LastImageGenerationResult {
  generatedImages: string[];
  promptUsed: string;
  providerUsed: string;
}

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
  sessionLastImageGenerationResult: LastImageGenerationResult | null; // Added
  setSessionLastImageGenerationResult: (result: LastImageGenerationResult | null) => void; // Added
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
  const [sessionLastImageGenerationResult, setSessionLastImageGenerationResultState] = useState<LastImageGenerationResult | null>(null); // Added state

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

        // Normalize industry directly from fetchedData before merging
        const normalizedFetchedData = { ...fetchedData };
        if (normalizedFetchedData.industry === "" || normalizedFetchedData.industry === undefined || normalizedFetchedData.industry === null) {
          console.log("🔍 BrandContext: Normalizing fetched industry from '", normalizedFetchedData.industry, "' to '_none_'.");
          normalizedFetchedData.industry = "_none_";
        }

        const mergedData = {
          ...defaultEmptyBrandData, // Default already has industry: "_none_"
          ...normalizedFetchedData, // Use normalized data for merge
        };
        
        if (mergedData.industry === "" || mergedData.industry === undefined || mergedData.industry === null) {
            console.log("🔍 BrandContext: Normalizing mergedData industry from '", mergedData.industry, "' to '_none_'.");
            mergedData.industry = "_none_";
        }
        
        console.log("🔍 BrandContext: Merged data with defaults:", mergedData);
        console.log("🔍 BrandContext: Industry value specifically being set to state:", mergedData.industry);
        setBrandDataState(mergedData);
      } else {
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
      setBrandDataState(null); 
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); 

  useEffect(() => {
    fetchBrandDataCB();
  }, [fetchBrandDataCB]); 

  const setBrandDataCB = useCallback(async (data: BrandData, userId: string) => { 
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
        ...defaultEmptyBrandData, 
        ...data,
      };
      if (dataToSave.industry === "" || dataToSave.industry === undefined || dataToSave.industry === null) {
        console.log("🔍 BrandContext (Save): Normalizing industry from '", dataToSave.industry, "' to '_none_' before saving.");
        dataToSave.industry = "_none_";
      }

      console.log("🔍 BrandContext: Data being saved to Firestore:", dataToSave);
      console.log("🔍 BrandContext: Industry value being saved:", dataToSave.industry);
      const brandDocRef = doc(db, "brandProfiles", userId); 
      await setDoc(brandDocRef, dataToSave, { merge: true }); 
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

  // Added setter for sessionLastImageGenerationResult
  const setSessionLastImageGenerationResultCB = useCallback((result: LastImageGenerationResult | null) => {
    setSessionLastImageGenerationResultState(result);
  }, []);

  const contextValue = useMemo(() => ({
    userId: currentUser?.uid || null, 
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
    addGeneratedAdCampaign: addGeneratedAdCampaignCB,
    sessionLastImageGenerationResult, // Added to context
    setSessionLastImageGenerationResult: setSessionLastImageGenerationResultCB // Added to context
  }), [
    currentUser, brandData, setBrandDataCB, isLoading, error, 
    generatedImages, addGeneratedImageCB,
    generatedSocialPosts, addGeneratedSocialPostCB,
    generatedBlogPosts, addGeneratedBlogPostCB,
    generatedAdCampaigns, addGeneratedAdCampaignCB,
    sessionLastImageGenerationResult, setSessionLastImageGenerationResultCB // Added dependencies
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

