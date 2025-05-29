
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { BrandData, GeneratedImage, GeneratedSocialMediaPost, GeneratedBlogPost, GeneratedAdCampaign } from '@/types';

const BRAND_PROFILE_DOC_ID = "defaultBrandProfile"; // Using a fixed ID for simplicity

interface BrandContextType {
  brandData: BrandData | null;
  setBrandData: (data: BrandData) => Promise<void>;
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

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brandData, setBrandDataState] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedSocialPosts, setGeneratedSocialPosts] = useState<GeneratedSocialMediaPost[]>([]);
  const [generatedBlogPosts, setGeneratedBlogPosts] = useState<GeneratedBlogPost[]>([]);
  const [generatedAdCampaigns, setGeneratedAdCampaigns] = useState<GeneratedAdCampaign[]>([]);

  useEffect(() => {
    const fetchBrandData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const brandDocRef = doc(db, "brandProfiles", BRAND_PROFILE_DOC_ID);
        const docSnap = await getDoc(brandDocRef);
        if (docSnap.exists()) {
          const fetchedData = docSnap.data() as BrandData;
          // Ensure exampleImages is always an array
          setBrandDataState({ ...fetchedData, exampleImages: fetchedData.exampleImages || [] });
        } else {
          setBrandDataState({ exampleImages: [] }); // Initialize with empty array if no profile
        }
      } catch (e: any) {
        console.error("Error fetching brand data:", e);
        let specificError = `Failed to fetch brand data: ${e.message || "Unknown error. Check console."}`;
        if (e.message && e.message.toLowerCase().includes("client is offline")) {
          specificError = "Failed to connect to the database. Please check your internet connection and Firebase project configuration (e.g., correct Project ID in .env).";
        } else if (e.message && e.message.toLowerCase().includes("missing or insufficient permissions")) {
          specificError = "Database permission error. Please check your Firestore security rules in the Firebase console.";
        } else if (e.code && e.code === "unavailable") {
           specificError = "The Firebase service is temporarily unavailable. Please try again later.";
        }
        setError(specificError);
        setBrandDataState(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrandData();
  }, []);

  const setBrandDataCB = useCallback(async (data: BrandData) => {
    setIsLoading(true);
    setError(null);
    try {
      const dataToSave = { ...data, exampleImages: data.exampleImages || [] }; // Ensure exampleImages is an array
      const brandDocRef = doc(db, "brandProfiles", BRAND_PROFILE_DOC_ID);
      await setDoc(brandDocRef, dataToSave, { merge: true });
      setBrandDataState(dataToSave);
    } catch (e: any) {
      console.error("Error saving brand data:", e);
      let specificError = `Failed to save brand profile: ${e.message || "Unknown error. Check console."}`;
      if (e.message && e.message.toLowerCase().includes("client is offline")) {
        specificError = "Failed to save data. Client is offline. Check your internet connection.";
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
    brandData, setBrandDataCB, isLoading, error,
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
