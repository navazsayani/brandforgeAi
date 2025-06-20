
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';
import { useAuth } from './AuthContext'; 

interface LastImageGenerationResult {
  generatedImages: string[];
  promptUsed: string;
  providerUsed: string;
}

interface BrandContextType {
  userId: string | null; 
  brandData: BrandData | null;
  setBrandData: (data: BrandData, userId: string) => Promise<void>; 
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
  sessionLastImageGenerationResult: LastImageGenerationResult | null; 
  setSessionLastImageGenerationResult: (result: LastImageGenerationResult | null) => void; 
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const defaultEmptyBrandData: BrandData = {
    brandName: "",
    websiteUrl: "",
    brandDescription: "",
    industry: "_none_", 
    imageStyleNotes: "",
    exampleImages: [],
    targetKeywords: "",
    brandLogoUrl: undefined,
    plan: 'free', // Default plan
};

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth(); 
  const [brandData, setBrandDataState] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedSocialPosts, setGeneratedSocialPosts] = useState<GeneratedSocialMediaPost[]>([]);
  const [generatedBlogPosts, setGeneratedBlogPosts] = useState<GeneratedBlogPost[]>([]);
  const [generatedAdCampaigns, setGeneratedAdCampaigns] = useState<GeneratedAdCampaign[]>([]);
  const [sessionLastImageGenerationResult, setSessionLastImageGenerationResultState] = useState<LastImageGenerationResult | null>(null); 

  const fetchBrandDataCB = useCallback(async () => {
    if (!currentUser) {
      setBrandDataState(defaultEmptyBrandData); // Use default if no user, includes default plan
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const userId = currentUser.uid;

    try {
      const brandDocRef = doc(db, "users", userId, "brandProfiles", userId); 
      const docSnap = await getDoc(brandDocRef);
      if (docSnap.exists()) {
        const fetchedData = docSnap.data() as BrandData;
        
        const normalizedFetchedData = { ...fetchedData };
        if (normalizedFetchedData.industry === "" || normalizedFetchedData.industry === undefined || normalizedFetchedData.industry === null) {
          normalizedFetchedData.industry = "_none_";
        }
        // Ensure plan defaults to 'free' if not present or invalid
        if (!normalizedFetchedData.plan || !['free', 'premium'].includes(normalizedFetchedData.plan)) {
            normalizedFetchedData.plan = 'free';
        }

        const mergedData = {
          ...defaultEmptyBrandData, 
          ...normalizedFetchedData, 
        };
        
        setBrandDataState(mergedData);
      } else {
        setBrandDataState(defaultEmptyBrandData); // User exists, but no profile, use defaults (includes plan: 'free')
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
      setBrandDataState(defaultEmptyBrandData); // Fallback to default on error
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
        dataToSave.industry = "_none_";
      }
      // Ensure plan defaults to 'free' if not present or invalid before saving
      if (!dataToSave.plan || !['free', 'premium'].includes(dataToSave.plan)) {
        dataToSave.plan = 'free';
      }

      const brandDocRef = doc(db, "users", userId, "brandProfiles", userId); 
      await setDoc(brandDocRef, dataToSave, { merge: true }); 
      setBrandDataState(dataToSave); 
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
    sessionLastImageGenerationResult, 
    setSessionLastImageGenerationResult: setSessionLastImageGenerationResultCB 
  }), [
    currentUser, brandData, setBrandDataCB, isLoading, error, 
    generatedImages, addGeneratedImageCB,
    generatedSocialPosts, addGeneratedSocialPostCB,
    generatedBlogPosts, addGeneratedBlogPostCB,
    generatedAdCampaigns, addGeneratedAdCampaignCB,
    sessionLastImageGenerationResult, setSessionLastImageGenerationResultCB 
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

